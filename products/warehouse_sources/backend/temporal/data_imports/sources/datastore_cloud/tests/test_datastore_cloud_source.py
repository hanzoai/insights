from unittest.mock import MagicMock, patch

from parameterized import parameterized

from insights.schema import (
    ExternalDataSourceType as SchemaExternalDataSourceType,
    ReleaseStatus,
    SourceFieldInputConfig,
)

from products.warehouse_sources.backend.temporal.data_imports.sources.datastore_cloud.datastore_cloud import (
    DatastoreCloudResumeConfig,
)
from products.warehouse_sources.backend.temporal.data_imports.sources.datastore_cloud.settings import (
    USAGE_COST_LOOKBACK_SECONDS,
)
from products.warehouse_sources.backend.temporal.data_imports.sources.datastore_cloud.source import (
    DatastoreCloudSource,
)
from products.warehouse_sources.backend.types import ExternalDataSourceType


class TestDatastoreCloudSourceConfig:
    def test_source_type(self) -> None:
        assert DatastoreCloudSource().source_type == ExternalDataSourceType.DATASTORECLOUD

    def test_config_exposes_key_id_and_secret_fields(self) -> None:
        config = DatastoreCloudSource().get_source_config
        assert config.name == SchemaExternalDataSourceType.DATASTORE_CLOUD
        assert config.releaseStatus == ReleaseStatus.ALPHA
        assert config.docsUrl == "https://hanzo.ai/docs/cdp/sources/datastore-cloud"
        assert config.unreleasedSource is None
        fields = [f for f in config.fields if isinstance(f, SourceFieldInputConfig)]
        assert [f.name for f in fields] == ["key_id", "key_secret"]
        by_name = {f.name: f for f in fields}
        assert by_name["key_id"].secret is False and by_name["key_id"].required is True
        assert by_name["key_secret"].secret is True and by_name["key_secret"].required is True


class TestDatastoreCloudSchemas:
    def test_all_endpoints_present(self) -> None:
        names = {s.name for s in DatastoreCloudSource().get_schemas(MagicMock(), team_id=1)}
        assert names == {
            "organizations",
            "services",
            "usage_cost",
            "api_keys",
            "members",
            "activities",
            "backups",
        }

    def test_usage_cost_is_incremental_on_date_with_restatement_lookback(self) -> None:
        schema = next(s for s in DatastoreCloudSource().get_schemas(MagicMock(), team_id=1) if s.name == "usage_cost")
        assert schema.supports_incremental is True
        assert schema.supports_append is False  # unlocked records get restated; append would duplicate
        assert [f["field"] for f in schema.incremental_fields] == ["date"]
        assert schema.default_incremental_lookback_seconds == USAGE_COST_LOOKBACK_SECONDS

    def test_activities_is_incremental_on_created_at(self) -> None:
        schema = next(s for s in DatastoreCloudSource().get_schemas(MagicMock(), team_id=1) if s.name == "activities")
        assert schema.supports_incremental is True
        assert schema.supports_append is False
        assert [f["field"] for f in schema.incremental_fields] == ["createdAt"]

    @parameterized.expand([("organizations",), ("services",), ("api_keys",), ("members",), ("backups",)])
    def test_snapshot_endpoints_are_full_refresh_only(self, endpoint: str) -> None:
        # These list endpoints return complete unfiltered arrays — no server-side updated-since
        # filter exists, so they must not advertise incremental.
        schema = next(s for s in DatastoreCloudSource().get_schemas(MagicMock(), team_id=1) if s.name == endpoint)
        assert schema.supports_incremental is False
        assert schema.supports_append is False

    def test_names_filter(self) -> None:
        schemas = DatastoreCloudSource().get_schemas(MagicMock(), team_id=1, names=["usage_cost"])
        assert [s.name for s in schemas] == ["usage_cost"]


class TestValidateCredentials:
    @parameterized.expand([("valid", True, True), ("invalid", False, False)])
    def test_plumbs_transport_result(self, _name: str, transport_result: bool, expected: bool) -> None:
        config = MagicMock(key_id="key-id", key_secret="key-secret")
        with patch(
            "products.warehouse_sources.backend.temporal.data_imports.sources.datastore_cloud.source.validate_datastore_cloud_credentials",
            return_value=transport_result,
        ) as mock_validate:
            ok, error = DatastoreCloudSource().validate_credentials(config, team_id=1)
        assert ok is expected
        assert (error is None) is expected
        mock_validate.assert_called_once_with("key-id", "key-secret")


class TestDatastoreCloudResumableManager:
    def test_manager_bound_to_resume_config(self) -> None:
        manager = DatastoreCloudSource().get_resumable_source_manager(MagicMock())
        assert manager._data_class is DatastoreCloudResumeConfig


class TestDatastoreCloudSourceForPipeline:
    def _response(self, endpoint: str) -> object:
        inputs = MagicMock()
        inputs.schema_name = endpoint
        inputs.logger = MagicMock()
        inputs.should_use_incremental_field = True
        inputs.db_incremental_field_last_value = None
        config = MagicMock(key_id="key-id", key_secret="key-secret")
        return DatastoreCloudSource().source_for_pipeline(config, MagicMock(), inputs)

    @parameterized.expand(
        [
            ("organizations", ["id"], None),
            ("services", ["organizationId", "id"], None),
            ("usage_cost", ["organizationId", "date", "entityId"], "datetime"),
            ("members", ["organizationId", "userId"], None),
            ("activities", ["organizationId", "id"], "datetime"),
            ("backups", ["organizationId", "serviceId", "id"], "datetime"),
        ]
    )
    def test_primary_keys_and_partitioning(
        self, endpoint: str, primary_keys: list[str], partition_mode: str | None
    ) -> None:
        response = self._response(endpoint)
        assert response.name == endpoint  # type: ignore[attr-defined]
        assert response.primary_keys == primary_keys  # type: ignore[attr-defined]
        assert response.sort_mode == "asc"  # type: ignore[attr-defined]
        assert response.partition_mode == partition_mode  # type: ignore[attr-defined]


class TestDocumentedTables:
    def test_lists_tables_without_credentials(self) -> None:
        # Static endpoint catalog => the source opts into publishing its table list to public docs.
        assert DatastoreCloudSource().lists_tables_without_credentials is True
        tables = DatastoreCloudSource().get_documented_tables()
        names = {t["name"] for t in tables}
        assert "usage_cost" in names and "services" in names
        usage = next(t for t in tables if t["name"] == "usage_cost")
        assert "Incremental" in usage["sync_methods"]
        assert usage["description"]
