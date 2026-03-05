import asyncio
from typing import cast

from langchain_core.prompts import ChatPromptTemplate

from posthog.schema import AssistantInsightsQLQuery

from posthog.insightsql import ast
from posthog.insightsql.context import InsightsQLContext
from posthog.insightsql.database.database import Database
from posthog.insightsql.errors import (
    ExposedInsightsQLError,
    NotImplementedError as InsightsQLNotImplementedError,
    ResolutionError,
)
from posthog.insightsql.parser import parse_select
from posthog.insightsql.placeholders import find_placeholders, replace_placeholders
from posthog.insightsql.printer import prepare_and_print_ast

from posthog.models import Team
from posthog.sync import database_sync_to_async

from ee.hogai.chat_agent.schema_generator.utils import SchemaGeneratorOutput
from ee.hogai.core.mixins import AssistantContextMixin
from ee.hogai.utils.warehouse import serialize_database_schema

from ..schema_generator.parsers import PydanticOutputParserException, parse_pydantic_structured_output
from .prompts import (
    INSIGHTSQL_GENERATOR_SYSTEM_PROMPT,
    SQL_EXPRESSIONS_DOCS,
    SQL_SUPPORTED_AGGREGATIONS_DOCS,
    SQL_SUPPORTED_FUNCTIONS_DOCS,
)

SQLSchemaGeneratorOutput = SchemaGeneratorOutput[AssistantInsightsQLQuery]


class InsightsQLDatabaseMixin:
    _team: Team
    _database_instance: Database | None = None

    def _get_database(self):
        if self._database_instance:
            return self._database_instance
        self._database_instance = Database.create_for(team=self._team)
        return self._database_instance

    @database_sync_to_async
    def _aget_database(self):
        return self._get_database()

    def _get_default_insightsql_context(self, database: Database):
        insightsql_context = InsightsQLContext(team=self._team, database=database, enable_select_queries=True)
        return insightsql_context

    async def _serialize_database_schema(self):
        database = await self._aget_database()
        return await serialize_database_schema(database, self._get_default_insightsql_context(database))


class InsightsQLOutputParserMixin(InsightsQLDatabaseMixin):
    def _parse_output(self, output: dict) -> SQLSchemaGeneratorOutput:
        result = parse_pydantic_structured_output(SchemaGeneratorOutput[str])(output)  # type: ignore
        cleaned_query = result.query.rstrip(";").strip() if result.query else ""
        return SQLSchemaGeneratorOutput(
            query=AssistantInsightsQLQuery(query=cleaned_query),
        )

    def _validate_insightsql_query_sync(self, query: str) -> AssistantInsightsQLQuery:
        """
        Validate a InsightsQL query string and return AssistantInsightsQLQuery.

        This is the core validation logic used by both internal and external tools.
        """
        cleaned_query = query.rstrip(";").strip() if query else ""
        if not cleaned_query:
            raise PydanticOutputParserException(llm_output="", validation_message="Query is empty")

        database = self._get_database()
        insightsql_context = self._get_default_insightsql_context(database)

        try:
            parsed_query = parse_select(cleaned_query, placeholders={})

            # Replace placeholders with dummy values to compile the generated query.
            finder = find_placeholders(parsed_query)
            if finder.placeholder_fields or finder.has_filters:
                dummy_placeholders: dict[str, ast.Expr] = {
                    str(field[0]): ast.Constant(value=1) for field in finder.placeholder_fields
                }
                if finder.has_filters:
                    dummy_placeholders["filters"] = ast.Constant(value=1)
                parsed_query = cast(ast.SelectQuery, replace_placeholders(parsed_query, dummy_placeholders))

            prepare_and_print_ast(parsed_query, context=insightsql_context, dialect="clickhouse")
        except (ExposedInsightsQLError, InsightsQLNotImplementedError, ResolutionError) as err:
            err_msg = str(err)
            if err_msg.startswith("no viable alternative"):
                # The "no viable alternative" ANTLR error is horribly unhelpful, both for humans and LLMs
                err_msg = 'ANTLR parsing error: "no viable alternative at input". This means that the query isn\'t valid InsightsQL.'
            raise PydanticOutputParserException(llm_output=cleaned_query, validation_message=err_msg)

        return AssistantInsightsQLQuery(query=cleaned_query)

    @database_sync_to_async(thread_sensitive=False)
    def _validate_insightsql_query(self, query: str) -> AssistantInsightsQLQuery:
        """Async wrapper for _validate_insightsql_query_sync."""
        return self._validate_insightsql_query_sync(query)

    @database_sync_to_async(thread_sensitive=False)
    def _quality_check_output(self, output: SQLSchemaGeneratorOutput):
        query = output.query.query if output.query else None
        if not query:
            raise PydanticOutputParserException(llm_output="", validation_message="Output is empty")
        self._validate_insightsql_query_sync(query)


class InsightsQLGeneratorMixin(InsightsQLOutputParserMixin, AssistantContextMixin):
    async def _construct_system_prompt(self) -> ChatPromptTemplate:
        schema_description, core_memory = await asyncio.gather(
            self._serialize_database_schema(),
            self._aget_core_memory_text(),
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", INSIGHTSQL_GENERATOR_SYSTEM_PROMPT),
            ],
            template_format="mustache",
        ).partial(
            sql_expressions_docs=SQL_EXPRESSIONS_DOCS,
            sql_supported_functions_docs=SQL_SUPPORTED_FUNCTIONS_DOCS,
            sql_supported_aggregations_docs=SQL_SUPPORTED_AGGREGATIONS_DOCS,
            schema_description=schema_description,
            core_memory=core_memory,
        )

        return prompt
