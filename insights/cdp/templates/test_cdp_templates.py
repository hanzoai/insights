import dataclasses

from insights.test.base import BaseTest

from insights.cdp.templates import INSIGHTS_FUNCTION_TEMPLATES
from insights.cdp.templates.insights_function_template import sync_template_to_db
from insights.cdp.validation import InputsSchemaItemSerializer, compile_script
from insights.models.insights_function_template import InsightsFunctionTemplate
from insights.models.insights_functions.insights_function import TYPES_WITH_TRANSPILED_FILTERS


class TestTemplatesGeneral(BaseTest):
    def setUp(self):
        super().setUp()

    def test_templates_are_valid(self):
        for template in INSIGHTS_FUNCTION_TEMPLATES:
            if template.inputs_schema:
                serializer = InputsSchemaItemSerializer(data=template.inputs_schema, many=True)
                assert serializer.is_valid()

            if template.type not in TYPES_WITH_TRANSPILED_FILTERS:
                bytecode = compile_script(template.code, template.type)
                assert bytecode[0] == "_H"

    def test_sync_template_to_db(self):
        template_data = dataclasses.asdict(INSIGHTS_FUNCTION_TEMPLATES[0])
        template = sync_template_to_db(template_data)
        assert template.template_id == template_data["id"]
        assert template.name == template_data["name"]
        assert template.code == template_data["code"]
        assert template.type == template_data["type"]
        assert template.inputs_schema == template_data["inputs_schema"]
        assert template.category == template_data["category"]
        assert template.description == template_data["description"]
        assert template.filters == template_data["filters"]

    def test_sync_existing_template(self):
        template_data = INSIGHTS_FUNCTION_TEMPLATES[0]
        template_id = template_data.id
        template = sync_template_to_db(template_data)
        assert InsightsFunctionTemplate.objects.filter(template_id=template_id).count() == 1
        assert template.sha == "721860af"

        template_data_dict = dataclasses.asdict(template_data)
        template = sync_template_to_db(template_data_dict)  # Test it as a dictionary
        assert template.sha == "721860af"
        assert InsightsFunctionTemplate.objects.filter(template_id=template_id).count() == 1

        template_data_dict["code"] = "return 1"
        template = sync_template_to_db(template_data_dict)
        assert template.sha == "a7ba7533"
        assert template.code == "return 1"
        assert InsightsFunctionTemplate.objects.filter(template_id=template_id).count() == 1
