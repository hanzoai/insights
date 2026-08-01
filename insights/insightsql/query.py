import dataclasses
from time import sleep
from typing import Any, ClassVar, Literal, Optional, Union, cast

from opentelemetry import trace

from insights.schema import (
    DataWarehouseSourceUsage,
    HogLanguage,
    InsightsQLFilters,
    InsightsQLMetadata,
    InsightsQLMetadataResponse,
    InsightsQLQueryModifiers,
    InsightsQLQueryResponse,
    InsightsQLVariable,
)

from insights.insightsql import ast
from insights.insightsql.constants import (
    InsightsQLDialect,
    InsightsQLGlobalSettings,
    LimitContext,
    get_default_insightsql_global_settings,
    get_default_limit_for_context,
)
from insights.insightsql.database.database import Database
from insights.insightsql.database.direct_sql_table import DirectSQLTable
from insights.insightsql.database.schema.duckdb_table_functions import (
    GenerateSeriesTable,
    OpaqueFunctionCallTable,
    RangeTable,
)
from insights.insightsql.database.schema.logs import INSIGHTSQL_MAX_BYTES_TO_READ_FOR_LOGS_USER_QUERIES
from insights.insightsql.database.warehouse_usage import WarehouseSourceUsage, extract_warehouse_sources
from insights.insightsql.direct_connection import (
    INVALID_CONNECTION_ID_ERROR,
    get_direct_connection_source,
    get_direct_connection_source_none_or_raise,
)
from insights.insightsql.direct_sql import DirectQueryRequest, ensure_single_direct_statement, get_adapter
from insights.insightsql.errors import ExposedInsightsQLError, InternalInsightsQLError, QueryError, ResolutionError
from insights.insightsql.feature_extractor import extract_insightsql_features
from insights.insightsql.filters import replace_filters
from insights.insightsql.insightsql import InsightsQLContext
from insights.insightsql.modifiers import create_default_modifiers_for_team
from insights.insightsql.parser import parse_select, sanitize_client_parser_mode
from insights.insightsql.placeholders import find_placeholders, replace_placeholders
from insights.insightsql.printer import prepare_ast_for_printing, print_prepared_ast
from insights.insightsql.printer.access_control import build_access_control_warning
from insights.insightsql.resolver import Resolver
from insights.insightsql.resolver_utils import extract_base_table_types, extract_select_queries
from insights.insightsql.timings import InsightsQLTimings
from insights.insightsql.transforms.preaggregated_table_transformation import do_preaggregated_table_transforms
from insights.insightsql.variables import replace_variables
from insights.insightsql.visitor import clone_expr
from insights.insightsql.warehouse_warnings import record_warnings

from insights.datastore.client import sync_execute
from insights.datastore.client.connection import DatastoreUser, Workload
from insights.datastore.query_tagging import tag_queries
from insights.errors import CHQueryErrorS3Error, CHQueryErrorS3FileChangedDuringRead, ExposedCHQueryError
from insights.exceptions_capture import capture_exception
from insights.models.team import Team
from insights.models.user import User
from insights.rbac.user_access_control import UserAccessControl
from insights.settings import INSIGHTSQL_INCREASED_MAX_EXECUTION_TIME

tracer = trace.get_tracer(__name__)

TRANSIENT_S3_ERROR_RETRY_DELAY_SECONDS = 1.0


@dataclasses.dataclass
class InsightsQLQueryExecutor:
    query: Union[str, ast.SelectQuery, ast.SelectSetQuery] | None
    team: Team
    _: dataclasses.KW_ONLY
    query_type: str = "insightsql_query"
    filters: Optional[InsightsQLFilters] = None
    placeholders: Optional[dict[str, ast.Expr]] = None
    variables: Optional[dict[str, InsightsQLVariable]] = None
    workload: Workload = Workload.DEFAULT
    ch_user: DatastoreUser = DatastoreUser.DEFAULT
    settings: Optional[InsightsQLGlobalSettings] = None
    modifiers: Optional[InsightsQLQueryModifiers] = None
    limit_context: Optional[LimitContext] = LimitContext.QUERY
    timings: InsightsQLTimings = dataclasses.field(default_factory=InsightsQLTimings)
    pretty: Optional[bool] = True
    context: InsightsQLContext = dataclasses.field(default_factory=lambda: InsightsQLQueryExecutor.__uninitialized_context)
    insightsql_context: Optional[InsightsQLContext] = None
    datastore_prepared_ast: Optional[ast.AST] = None
    datastore_context: Optional[InsightsQLContext] = None
    datastore_sql: Optional[str] = None
    direct_context: Optional[InsightsQLContext] = None
    direct_sql: Optional[str] = None
    direct_source_id: Optional[str] = None
    direct_values: dict[str, object] | None = None
    direct_dialect: Optional[InsightsQLDialect] = None
    connection_id: Optional[str] = None
    send_raw_query: bool = False
    user: Optional[User] = None
    bypass_warehouse_access_control: bool = False
    user_access_control: Optional[UserAccessControl] = None

    __uninitialized_context: ClassVar[InsightsQLContext] = InsightsQLContext()

    @dataclasses.dataclass(frozen=True)
    class _PreparedExecution:
        sql: str
        context: InsightsQLContext
        engine: Literal["datastore", "direct_sql"]

    @tracer.start_as_current_span("InsightsQLQueryExecutor.__post_init__")
    def __post_init__(self):
        if self.context is self.__uninitialized_context:
            self.context = InsightsQLContext(
                team_id=self.team.pk,
                user=self.user,
                user_access_control=self.user_access_control,
                bypass_warehouse_access_control=self.bypass_warehouse_access_control,
            )
        elif self.context.user_access_control is None:
            self.context.user_access_control = self.user_access_control

        self.query_modifiers = create_default_modifiers_for_team(self.team, self.modifiers)
        self.debug = self.modifiers is not None and self.modifiers.debug
        self.error: Optional[str] = None
        self.explain: Optional[list[str]] = None
        self.results = None
        self.types = None
        self.metadata: Optional[InsightsQLMetadataResponse] = None
        self.insightsql: Optional[str] = None
        self.print_columns: list[str] = []
        self.has_more: Optional[bool] = None
        self.limit: Optional[int] = None
        self.offset: Optional[int] = None
        self.used_data_warehouse_sources: list[WarehouseSourceUsage] = []

    @tracer.start_as_current_span("InsightsQLQueryExecutor._parse_query")
    def _parse_query(self):
        with self.timings.measure("query"):
            if isinstance(self.query, ast.SelectQuery) or isinstance(self.query, ast.SelectSetQuery):
                self.select_query = self.query
                self.query = None
            else:
                self.select_query = parse_select(
                    str(self.query),
                    timings=self.timings,
                    # Client-supplied `parserMode` can't force the best-effort-guarded cpp backend.
                    parser_mode=sanitize_client_parser_mode(self.query_modifiers.parserMode),
                )

    @tracer.start_as_current_span("InsightsQLQueryExecutor._process_variables")
    def _process_variables(self):
        with self.timings.measure("variables"):
            if self.variables and len(self.variables.keys()) > 0:
                self.select_query = replace_variables(
                    node=self.select_query, variables=list(self.variables.values()), team=self.team
                )

    @tracer.start_as_current_span("InsightsQLQueryExecutor._process_placeholders")
    def _process_placeholders(self):
        with self.timings.measure("replace_placeholders"):
            if not self.placeholders:
                self.placeholders = {}
            finder = find_placeholders(self.select_query)

            if finder.has_filters:
                if "filters" in self.placeholders and self.filters is not None:
                    raise ValueError("Query contains 'filters' both as placeholder and as a query parameter.")
                # Build the database once with the executor's modifiers and cache it on the context
                # so that _generate_insightsql reuses it instead of building a second Database.
                # Skip for direct-connection queries, whose database needs a connection_id resolved later.
                if self.context.database is None and self.connection_id is None:
                    self.context.database = Database.create_for(
                        team=self.team,
                        user=self.user,
                        user_access_control=self.context.user_access_control,
                        modifiers=self.query_modifiers,
                        timings=self.timings,
                        bypass_warehouse_access_control=self.context.bypass_warehouse_access_control,
                    )
                self.select_query = replace_filters(
                    self.select_query, self.filters, self.team, database=self.context.database
                )

            if finder.placeholder_fields or finder.placeholder_expressions:
                self.select_query = cast(ast.SelectQuery, replace_placeholders(self.select_query, self.placeholders))

    @tracer.start_as_current_span("InsightsQLQueryExecutor._apply_limit")
    def _apply_limit(self):
        if self.limit_context in (LimitContext.COHORT_CALCULATION, LimitContext.SAVED_QUERY):
            self.context.limit_top_select = False

        with self.timings.measure("max_limit"):
            for one_query in extract_select_queries(self.select_query):
                if one_query.limit is None:
                    one_query.limit = ast.Constant(
                        value=get_default_limit_for_context(self.limit_context or LimitContext.QUERY)
                    )

    @tracer.start_as_current_span("InsightsQLQueryExecutor._apply_optimizers")
    def _apply_optimizers(self):
        if self.query_modifiers.usePreaggregatedTableTransforms:
            with self.timings.measure("preaggregated_table_transforms"):
                assert self.insightsql_context is not None
                assert self.insightsql_context.team is not None
                transformed_node = do_preaggregated_table_transforms(self.select_query, self.insightsql_context)
                if isinstance(transformed_node, ast.SelectQuery) or isinstance(transformed_node, ast.SelectSetQuery):
                    self.select_query = transformed_node

        if self.query_modifiers.usePreaggregatedIntermediateResults:
            with self.timings.measure("daily_unique_persons_pageviews_transform"):
                assert self.insightsql_context is not None
                assert self.insightsql_context.team is not None
                from products.analytics_platform.backend.lazy_computation.lazy_computation_transformer import (
                    Transformer as DailyUniquePersonsPageviewsTransformer,
                )

                transformer = DailyUniquePersonsPageviewsTransformer(self.insightsql_context)
                transformed_node = transformer.visit(self.select_query)
                if isinstance(transformed_node, ast.SelectQuery) or isinstance(transformed_node, ast.SelectSetQuery):
                    self.select_query = transformed_node

    @tracer.start_as_current_span("InsightsQLQueryExecutor._generate_insightsql")
    def _generate_insightsql(self):
        source = get_direct_connection_source_none_or_raise(
            self.team,
            self.connection_id,
            user=self.user,
            error_factory=ExposedInsightsQLError,
        )
        self.connection_id = str(source.id) if source else None
        self._direct_source = source

        database = self.context.database
        if database is None or self.connection_id is not None:
            database = Database.create_for(
                team=self.team,
                user=self.user,
                user_access_control=self.context.user_access_control,
                modifiers=self.query_modifiers,
                timings=self.timings,
                connection_id=self.connection_id,
                bypass_warehouse_access_control=self.context.bypass_warehouse_access_control,
            )

        # Reset between executions: the resolver/printer append per query, and dataclasses.replace
        # below shares these by reference. Without reset, callers reusing a InsightsQLContext across
        # executors would see warnings from prior runs — and a stale external_tables entry would skip
        # re-registering the hidden table against the rebuilt database, leaving a dangling reference.
        self.context.data_warehouse_sync_warnings.clear()
        self.context.external_tables.clear()
        self.context.information_schema_introspection = None

        self.insightsql_context = dataclasses.replace(
            self.context,
            team_id=self.team.pk,
            team=self.team,
            user=self.user,
            enable_select_queries=True,
            timings=self.timings,
            modifiers=self.query_modifiers,
            limit_context=self.limit_context,
            database=database,
        )

        self._apply_optimizers()

        with self.timings.measure("clone"):
            cloned_query = clone_expr(self.select_query, True)

        with self.timings.measure("prepare_ast_for_printing"):
            select_query_insightsql = cast(
                ast.SelectQuery | ast.SelectSetQuery,
                prepare_ast_for_printing(node=cloned_query, context=self.insightsql_context, dialect="insightsql"),
            )

        with self.timings.measure("print_prepared_ast"):
            self.insightsql = print_prepared_ast(
                select_query_insightsql,
                self.insightsql_context,
                "insightsql",
                pretty=self.pretty if self.pretty is not None else True,
            )
            self.print_columns = []
            columns_query = (
                next(extract_select_queries(select_query_insightsql))
                if isinstance(select_query_insightsql, ast.SelectSetQuery)
                else select_query_insightsql
            )
            for node in columns_query.select:
                if isinstance(node, ast.Alias):
                    self.print_columns.append(node.alias)
                else:
                    stack = [select_query_insightsql] if isinstance(select_query_insightsql, ast.SelectQuery) else None
                    self.print_columns.append(
                        print_prepared_ast(
                            node=node,
                            context=self.insightsql_context,
                            dialect="insightsql",
                            stack=stack,
                        )
                    )

    def _effective_direct_settings(self) -> InsightsQLGlobalSettings:
        settings = get_default_insightsql_global_settings(
            self.team.pk,
            self.settings,
        )

        if self.limit_context in (
            LimitContext.EXPORT,
            LimitContext.COHORT_CALCULATION,
            LimitContext.NOTEBOOK_MATERIALIZE,
            LimitContext.QUERY_ASYNC,
            LimitContext.SAVED_QUERY,
            LimitContext.RETENTION,
            LimitContext.POSTFN_AI,
        ):
            settings.max_execution_time = max(settings.max_execution_time or 0, INSIGHTSQL_INCREASED_MAX_EXECUTION_TIME)

        return settings

    def _prepare_direct_query(self) -> _PreparedExecution | None:
        try:
            query_type = self._get_select_query_type()
        except (QueryError, ResolutionError, AttributeError):
            if self.connection_id is None:
                return None
            raise

        if query_type is None:
            return None

        # Dialect-level table functions (range, generate_series, introspected opaque calls)
        # aren't bound to any source — they're standalone SQL any direct connection can run,
        # so they shouldn't influence source dispatching or block table-less execution.
        base_table_types = [
            table_type
            for table_type in extract_base_table_types(query_type)
            if not isinstance(table_type.table, (RangeTable, GenerateSeriesTable, OpaqueFunctionCallTable))
        ]
        direct_source_ids = {
            table_type.table.external_data_source_id
            for table_type in base_table_types
            if isinstance(table_type.table, DirectSQLTable)
        }

        direct_source_id: str | None = None

        if len(direct_source_ids) == 0:
            if self.connection_id is None:
                return None

            if len(base_table_types) > 0:
                raise ExposedInsightsQLError("Table not found in the selected connection.")

            direct_source_id = self.connection_id

        if len(direct_source_ids) > 1:
            raise ExposedInsightsQLError("Direct queries can only reference a single source.")

        has_non_direct_tables = any(not isinstance(table_type.table, DirectSQLTable) for table_type in base_table_types)
        if has_non_direct_tables:
            if self.connection_id is None:
                return None
            raise ExposedInsightsQLError("Direct queries cannot be joined with Insights or warehouse-synced tables.")

        if self.connection_id is None:
            raise ExposedInsightsQLError("Direct queries require selecting a connection.")

        if direct_source_id is None:
            direct_source_id = next(iter(direct_source_ids))

        if self.connection_id != direct_source_id:
            raise ExposedInsightsQLError("The query references a different source than the selected connection.")

        source = getattr(self, "_direct_source", None)
        adapter = get_adapter(source.direct_engine) if source is not None else None
        dialect: InsightsQLDialect = adapter.dialect if adapter is not None and adapter.dialect is not None else "postgres"

        direct_context = dataclasses.replace(
            self.context,
            is_direct_query=True,
            team_id=self.team.pk,
            team=self.team,
            enable_select_queries=True,
            timings=self.timings,
            modifiers=self.query_modifiers,
            limit_context=self.limit_context,
            database=self.insightsql_context.database if self.insightsql_context else None,
        )

        direct_prepared_ast = prepare_ast_for_printing(
            node=self.select_query,
            context=direct_context,
            dialect=dialect,
        )

        self.direct_sql = ensure_single_direct_statement(
            print_prepared_ast(
                node=cast(ast.SelectQuery | ast.SelectSetQuery, direct_prepared_ast),
                context=direct_context,
                dialect=dialect,
                pretty=self.pretty if self.pretty is not None else True,
            )
        )
        self.direct_context = direct_context
        self.direct_values = direct_context.values
        self.direct_source_id = direct_source_id
        self.direct_dialect = dialect

        return self._PreparedExecution(
            sql=self.direct_sql,
            context=direct_context,
            engine="direct_sql",
        )

    def _get_select_query_type(self) -> ast.SelectQueryType | ast.SelectSetQueryType | None:
        if self.select_query.type is not None:
            return self.select_query.type

        resolved_query = Resolver(context=self.insightsql_context or self.context, dialect="insightsql").visit(
            clone_expr(self.select_query, True)
        )

        if isinstance(resolved_query, ast.SelectQuery) or isinstance(resolved_query, ast.SelectSetQuery):
            return resolved_query.type

        return None

    def _detect_warehouse_sources(self) -> list[WarehouseSourceUsage]:
        """Detect connector-synced data warehouse sources referenced by the (resolved) query and
        store them for the query response. Never raises — telemetry must not break query execution."""
        try:
            sources = extract_warehouse_sources(self._get_select_query_type())
        except Exception:
            sources = []
        self.used_data_warehouse_sources = sources
        return sources

    @tracer.start_as_current_span("InsightsQLQueryExecutor._execute_direct_sql_query")
    def _execute_direct_sql_query(self) -> None:
        assert self.direct_sql is not None
        assert self.direct_source_id is not None

        source = get_direct_connection_source(self.team, self.direct_source_id, user=self.user)
        if source is None:
            raise ExposedInsightsQLError("Connection not found or has been deleted")

        adapter = get_adapter(source.direct_engine)
        if adapter is None:
            raise InternalInsightsQLError(f"No direct SQL adapter registered for engine: {source.direct_engine}")

        result = adapter.execute(
            DirectQueryRequest(
                source=source,
                team=self.team,
                sql=self.direct_sql,
                values=self.direct_values,
                settings=self._effective_direct_settings(),
                timings=self.timings,
                query_type=self.query_type,
                debug=bool(self.debug),
            )
        )

        self.results = result.results
        self.types = result.types
        self.error = result.error
        # A literal `SELECT *` on a direct connection is expanded by the external server, so the
        # driver response is the only source of truth for the columns. Detect that by the count
        # disagreeing with InsightsQL's own column list (and cover the empty case) — then take the
        # driver's names, keeping them consistent with `self.types`, which is always driver-derived
        # above. When counts match (ordinary explicit-column queries) InsightsQL's names are left as-is.
        if result.print_columns and (not self.print_columns or len(result.print_columns) != len(self.print_columns)):
            self.print_columns = result.print_columns

    @tracer.start_as_current_span("InsightsQLQueryExecutor._generate_datastore_sql")
    def _generate_datastore_sql(self):
        settings = get_default_insightsql_global_settings(self.team.pk, self.settings)
        if self.limit_context in (
            LimitContext.EXPORT,
            LimitContext.COHORT_CALCULATION,
            LimitContext.NOTEBOOK_MATERIALIZE,
            LimitContext.QUERY_ASYNC,
            LimitContext.SAVED_QUERY,
            LimitContext.RETENTION,
            LimitContext.POSTFN_AI,
        ):
            settings.max_execution_time = max(settings.max_execution_time or 0, INSIGHTSQL_INCREASED_MAX_EXECUTION_TIME)

        if self.query_modifiers.formatCsvAllowDoubleQuotes is not None:
            settings.format_csv_allow_double_quotes = self.query_modifiers.formatCsvAllowDoubleQuotes
        if self.query_modifiers.forceDatastoreDataSkippingIndexes:
            settings.force_data_skipping_indices = self.query_modifiers.forceDatastoreDataSkippingIndexes

        try:
            self.datastore_context = dataclasses.replace(
                self.context,
                team_id=self.team.pk,
                team=self.team,
                user=self.user,
                enable_select_queries=True,
                timings=self.timings,
                modifiers=self.query_modifiers,
                limit_context=self.limit_context,
                database=self.insightsql_context.database if self.insightsql_context else None,
            )
            with self.timings.measure("prepare_ast_for_printing"):
                self.datastore_prepared_ast = prepare_ast_for_printing(
                    node=self.select_query,
                    context=self.datastore_context,
                    dialect="datastore",
                    settings=settings,
                )

            if self.datastore_context.workload == Workload.LOGS and self.query_type == "InsightsQLQuery":
                if settings.max_bytes_to_read is None:
                    settings.max_bytes_to_read = INSIGHTSQL_MAX_BYTES_TO_READ_FOR_LOGS_USER_QUERIES
                if settings.read_overflow_mode is None:
                    settings.read_overflow_mode = "throw"

            with self.timings.measure("print_prepared_ast"):
                if self.datastore_prepared_ast is None:
                    self.datastore_sql = ""
                else:
                    self.datastore_sql = print_prepared_ast(
                        node=self.datastore_prepared_ast,
                        context=self.datastore_context,
                        dialect="datastore",
                        settings=settings,
                        pretty=self.pretty if self.pretty is not None else True,
                    )
        except Exception as e:
            if self.debug:
                self.datastore_sql = ""
                if isinstance(e, ExposedCHQueryError | ExposedInsightsQLError):
                    self.error = str(e)
                else:
                    self.error = "Unknown error"
            else:
                raise

    def _prepare_execution(self) -> _PreparedExecution:
        self._parse_query()
        self._process_variables()
        self._process_placeholders()
        self._apply_limit()
        with self.timings.measure("_generate_insightsql"):
            self._generate_insightsql()

        direct_execution = self._prepare_direct_query()
        if direct_execution is not None:
            return direct_execution

        with self.timings.measure("_generate_datastore_sql"):
            self._generate_datastore_sql()

        assert self.datastore_sql is not None
        assert self.datastore_context is not None
        return self._PreparedExecution(
            sql=self.datastore_sql,
            context=self.datastore_context,
            engine="datastore",
        )

    def _execute_raw_direct_query(self) -> None:
        if not isinstance(self.query, str):
            raise ExposedInsightsQLError("Sending a raw query requires a raw query string.")

        source = get_direct_connection_source_none_or_raise(
            self.team,
            self.connection_id,
            user=self.user,
            error_factory=ExposedInsightsQLError,
            require_pure_direct=True,
        )
        if source is None:
            raise ExposedInsightsQLError("Sending a raw query requires a valid connection.")
        self.connection_id = str(source.id)
        self.direct_source_id = self.connection_id
        adapter = get_adapter(source.direct_engine)
        if adapter is None:
            raise ExposedInsightsQLError(INVALID_CONNECTION_ID_ERROR)
        self.direct_dialect = adapter.dialect
        self.direct_sql = adapter.prepare_raw_sql(str(self.query))
        self._execute_direct_sql_query()

    def _capture_send_raw_query_translation_error(self) -> None:
        """Try a post-success InsightsQL translation for raw queries.

        On success, this stores the translated InsightsQL in ``self.insightsql`` for the response.
        On failure, it records the exception for telemetry and leaves ``self.insightsql`` unset.

        This runs synchronously after the raw query succeeds, so it adds the cost of
        ``_prepare_execution()`` to raw-query responses.
        """
        if not isinstance(self.query, str) or self.connection_id is None:
            return

        try:
            shadow_executor = InsightsQLQueryExecutor(
                query=str(self.query),
                team=self.team,
                query_type=self.query_type,
                filters=self.filters,
                placeholders=self.placeholders,
                variables=self.variables,
                workload=self.workload,
                settings=self.settings,
                modifiers=self.modifiers,
                limit_context=self.limit_context,
                pretty=self.pretty,
                connection_id=self.connection_id,
                user=self.user,
            )
            shadow_executor._prepare_execution()
            self.insightsql = shadow_executor.insightsql
        except Exception as error:
            capture_exception(
                error,
                {
                    "component": "send_raw_query_parse_and_print",
                    "send_raw_query": True,
                    "team_id": self.team.pk,
                    "connection_id": self.connection_id,
                    "query_type": self.query_type,
                },
            )

    @tracer.start_as_current_span("InsightsQLQueryExecutor._execute_datastore_query")
    def _execute_datastore_query(self):
        # A None prepared AST compiles to empty SQL: nothing to run, so return empty results.
        # execute() guards this, but direct callers (e.g. web-analytics events prefilter) don't.
        # A None (vs "") datastore_sql means _prepare_execution() never ran — surface that.
        if self.datastore_sql == "":
            self.results = []
            self.types = []
            return
        if self.datastore_sql is None:
            raise ValueError("Cannot execute Datastore query: SQL was not prepared")
        datastore_context = self.datastore_context
        if datastore_context is None:
            raise ValueError("Cannot execute Datastore query: Datastore context was not prepared")
        timings_dict = self.timings.to_dict()
        with self.timings.measure("datastore_execute"):
            with self.timings.measure("extract_insightsql_features"):
                insightsql_features = extract_insightsql_features(self.select_query)
            self._detect_warehouse_sources()
            tag_queries(
                team_id=self.team.pk,
                query_type=self.query_type,
                has_joins="JOIN" in self.datastore_sql,
                has_json_operations="JSONExtract" in self.datastore_sql or "JSONHas" in self.datastore_sql,
                insightsql_features=insightsql_features,
                timings=timings_dict,
                modifiers=(
                    {k: v for k, v in self.modifiers.model_dump().items() if v is not None} if self.modifiers else {}
                ),
            )

            workload = self.workload
            if workload == Workload.DEFAULT and datastore_context.workload is not None:
                workload = datastore_context.workload

            def run_datastore_query() -> Any:
                return sync_execute(
                    self.datastore_sql,
                    datastore_context.values,
                    with_column_types=True,
                    workload=workload,
                    team_id=self.team.pk,
                    readonly=True,
                    ch_user=self.ch_user,
                    external_tables=list(datastore_context.external_tables.values()) or None,
                )

            try:
                try:
                    self.results, self.types = run_datastore_query()
                except (CHQueryErrorS3Error, CHQueryErrorS3FileChangedDuringRead):
                    # Files backing a warehouse table can be replaced mid-read; one retry re-lists them
                    sleep(TRANSIENT_S3_ERROR_RETRY_DELAY_SECONDS)
                    self.results, self.types = run_datastore_query()
            except Exception as e:
                if self.debug:
                    self.results = []
                    if isinstance(e, ExposedCHQueryError | ExposedInsightsQLError):
                        self.error = str(e)
                    else:
                        self.error = "Unknown error"
                else:
                    raise

        if self.debug and self.error is None:
            with self.timings.measure("explain"):
                # nosemgrep: datastore-injection-taint - self.datastore_sql is InsightsQL-compiled from AST, not raw user input; values remain parameterized in datastore_context.values
                explain_results = sync_execute(
                    f"EXPLAIN {self.datastore_sql}",
                    datastore_context.values,
                    with_column_types=True,
                    workload=workload,
                    team_id=self.team.pk,
                    readonly=True,
                    ch_user=self.ch_user,
                    external_tables=list(datastore_context.external_tables.values()) or None,
                )
                self.explain = [str(r[0]) for r in explain_results[0]]
            with self.timings.measure("metadata"):
                from insights.insightsql.metadata import get_insightsql_metadata

                self.metadata = get_insightsql_metadata(
                    InsightsQLMetadata(language=HogLanguage.FN_QL, query=self.insightsql, debug=True),
                    self.team,
                    user=self.user,
                    insightsql_ast=self.select_query,
                    prepared_ast=self.datastore_prepared_ast,
                    printed_sql=self.datastore_sql,
                )

    @tracer.start_as_current_span("InsightsQLQueryExecutor.generate_datastore_sql")
    def generate_datastore_sql(self) -> tuple[str, InsightsQLContext]:
        prepared_execution = self._prepare_execution()
        return prepared_execution.sql, prepared_execution.context

    @tracer.start_as_current_span("InsightsQLQueryExecutor.execute")
    def execute(self) -> InsightsQLQueryResponse:
        trace.get_current_span().set_attribute("team_id", self.team.pk)
        try:
            if self.send_raw_query and self.connection_id is not None:
                self._execute_raw_direct_query()
                self._capture_send_raw_query_translation_error()
            else:
                prepared_execution = self._prepare_execution()

                if prepared_execution.engine == "direct_sql":
                    self._execute_direct_sql_query()
                    self._detect_warehouse_sources()
                elif self.datastore_sql is not None:
                    if self.datastore_sql == "":
                        self.results = []
                        self.types = []
                        if self.error is None:
                            self.error = "Unknown error"
                    else:
                        self._execute_datastore_query()
        finally:
            # Side-channel: push collected warnings to the query-runner-level accumulator even on
            # failure. The warning is often the actual explanation for the query error (e.g. a
            # FAILED warehouse sync left the table unreadable); throwing it away when execution
            # raises would hide the most useful signal.
            if self.context and self.context.data_warehouse_sync_warnings:
                record_warnings(self.context.data_warehouse_sync_warnings.values())

        warnings: list = []
        if self.context:
            warnings = list(self.context.data_warehouse_sync_warnings.values())
            access_control_warning = build_access_control_warning(self.context.access_control_restricted_resources)
            if access_control_warning:
                warnings.append(access_control_warning)
        return InsightsQLQueryResponse(
            query=self.query,
            insightsql=self.insightsql,
            datastore=self.direct_sql or self.datastore_sql,
            error=self.error,
            timings=self.timings.to_list(),
            results=self.results,
            columns=self.print_columns,
            types=self.types,
            modifiers=self.query_modifiers,
            explain=self.explain,
            metadata=self.metadata,
            warnings=warnings or None,
            hasMore=self.has_more,
            limit=self.limit,
            offset=self.offset,
            used_data_warehouse_sources=self._serialized_warehouse_sources(),
        )

    def _serialized_warehouse_sources(self) -> Optional[list[DataWarehouseSourceUsage]]:
        """Warehouse source attribution is telemetry for authenticated app users only. It carries
        connector ids, connector types, and underlying table names, so it must never reach an
        anonymous/shared-link viewer — resolving a saved view exposes the tables behind it."""
        if not self.used_data_warehouse_sources:
            return None
        if self.user is None or not self.user.is_authenticated:
            return None
        return [
            DataWarehouseSourceUsage(id=s.id, source_type=s.source_type, table_name=s.table_name)
            for s in self.used_data_warehouse_sources
        ]


def execute_insightsql_query(*args, **kwargs) -> InsightsQLQueryResponse:
    return InsightsQLQueryExecutor(*args, **kwargs).execute()
