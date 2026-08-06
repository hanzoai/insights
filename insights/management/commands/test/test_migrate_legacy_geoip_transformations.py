from io import StringIO

from insights.test.base import BaseTest
from unittest.mock import patch

from django.core.management import call_command

from insights.cdp.validation import compile_hog

from products.cdp.backend.models.insights_function_template import InsightsFunctionTemplate
from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction

GEOIP_TEMPLATE_CODE = """
if (event.properties?.$geoip_disable or empty(event.properties?.$ip)) {
    return event
}
return event
"""


class TestMigrateLegacyGeoipTransformations(BaseTest):
    def setUp(self):
        super().setUp()

        self.template = InsightsFunctionTemplate.objects.create(
            template_id="template-geoip",
            name="GeoIP",
            description="Adds geoip data to the event",
            code=GEOIP_TEMPLATE_CODE,
            code_language="script",
            inputs_schema=[],
            type="transformation",
            status="stable",
            free=True,
            icon_url="/static/transformations/geoip.png",
        )

        with patch("products.cdp.backend.models.insights_functions.insights_function.reload_insights_functions_on_workers"):
            self.legacy_function = InsightsFunction.objects.create(
                team=self.team,
                name="My GeoIP",
                type="transformation",
                template_id="plugin-insights-plugin-geoip",
                script="return event",
                enabled=True,
                execution_order=2,
                icon_url="https://raw.githubusercontent.com/Insights/insights-plugin-geoip/main/logo.png",
                filters={"events": [{"id": "$pageview", "type": "events"}]},
            )
            self.other_function = InsightsFunction.objects.create(
                team=self.team,
                name="Other transformation",
                type="transformation",
                template_id="plugin-downsampling-plugin",
                script="return event",
                enabled=True,
            )
            self.deleted_function = InsightsFunction.objects.create(
                team=self.team,
                name="Deleted GeoIP",
                type="transformation",
                template_id="plugin-insights-plugin-geoip",
                script="return event",
                enabled=True,
                deleted=True,
            )

    @patch("products.cdp.backend.models.insights_functions.insights_function.reload_insights_functions_on_workers")
    def test_migrates_legacy_geoip_in_place_preserving_user_state(self, _mock_reload):
        filters_before = InsightsFunction.objects.get(id=self.legacy_function.id).filters

        out = StringIO()
        call_command("migrate_legacy_geoip_transformations", stdout=out)

        self.legacy_function.refresh_from_db()
        assert self.legacy_function.template_id == "template-geoip"
        assert self.legacy_function.script == GEOIP_TEMPLATE_CODE
        assert self.legacy_function.bytecode == compile_hog(GEOIP_TEMPLATE_CODE, "transformation")
        assert self.legacy_function.insights_function_template_id == self.template.id
        assert self.legacy_function.icon_url == "/static/transformations/geoip.png"

        # User state must survive the migration untouched
        assert self.legacy_function.name == "My GeoIP"
        assert self.legacy_function.enabled is True
        assert self.legacy_function.execution_order == 2
        assert self.legacy_function.filters == filters_before

        self.other_function.refresh_from_db()
        assert self.other_function.template_id == "plugin-downsampling-plugin"
        assert self.other_function.script == "return event"

        self.deleted_function.refresh_from_db()
        assert self.deleted_function.template_id == "plugin-insights-plugin-geoip"

        output = out.getvalue()
        self.assertIn("Found 1 legacy GeoIP transformations to migrate", output)
        self.assertIn("Migrated: 1", output)

    @patch("products.cdp.backend.models.insights_functions.insights_function.reload_insights_functions_on_workers")
    def test_migrates_all_rows_across_batches(self, _mock_reload):
        for i in range(2):
            InsightsFunction.objects.create(
                team=self.team,
                name=f"GeoIP {i}",
                type="transformation",
                template_id="plugin-insights-plugin-geoip",
                script="return event",
                enabled=True,
            )

        out = StringIO()
        with patch("insights.management.commands.migrate_legacy_geoip_transformations.BATCH_SIZE", 1):
            call_command("migrate_legacy_geoip_transformations", stdout=out)

        assert not InsightsFunction.objects.filter(template_id="plugin-insights-plugin-geoip", deleted=False).exists()
        assert InsightsFunction.objects.filter(template_id="template-geoip").count() == 3
        self.assertIn("Migrated: 3", out.getvalue())

    def test_dry_run_makes_no_changes(self):
        out = StringIO()
        call_command("migrate_legacy_geoip_transformations", dry_run=True, stdout=out)

        self.legacy_function.refresh_from_db()
        assert self.legacy_function.template_id == "plugin-insights-plugin-geoip"
        assert self.legacy_function.script == "return event"

        output = out.getvalue()
        self.assertIn("DRY RUN - No changes will be made", output)
        self.assertIn("Migrated: 1", output)

    def test_aborts_when_new_template_missing(self):
        InsightsFunctionTemplate.objects.all().delete()

        out = StringIO()
        call_command("migrate_legacy_geoip_transformations", stdout=out)

        self.legacy_function.refresh_from_db()
        assert self.legacy_function.template_id == "plugin-insights-plugin-geoip"

        self.assertIn("Template template-geoip not found in the database, aborting", out.getvalue())
