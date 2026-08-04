import pytest

from parameterized import parameterized

from products.cdp.backend.max_tools import CreateIQLTransformationFunctionTool
from products.insights_ai.backend.model import PydanticOutputParserException


class TestParseOutput:
    @parameterized.expand(
        [
            (
                "slice_syntax",
                "let x := content[1:2000]",
                "no viable alternative at input",
            ),
            (
                "double_ampersand",
                "if (a && b) { print(a) }",
                "no viable alternative at input",
            ),
        ]
    )
    def test_parse_output_includes_specific_parse_error(self, _name, script_code, expected_fragment):
        tool = CreateIQLTransformationFunctionTool.__new__(CreateIQLTransformationFunctionTool)
        with pytest.raises(PydanticOutputParserException) as exc_info:
            tool._parse_output(f"<script_code>{script_code}</script_code>")
        assert expected_fragment in str(exc_info.value)

    def test_parse_output_generic_error_for_non_syntax_issues(self):
        # Code that parses but fails at the HyphenatedPropertyDetector stage
        script_code = "let x := event.some-prop"
        tool = CreateIQLTransformationFunctionTool.__new__(CreateIQLTransformationFunctionTool)
        with pytest.raises(PydanticOutputParserException) as exc_info:
            tool._parse_output(f"<script_code>{script_code}</script_code>")
        assert "The Script code failed to compile" in str(exc_info.value)
        # Should NOT contain a specific parse error since it's not a syntax error
        assert "no viable alternative" not in str(exc_info.value)

    def test_parse_output_valid_code(self):
        script_code = "let x := 1\nreturn event"
        tool = CreateIQLTransformationFunctionTool.__new__(CreateIQLTransformationFunctionTool)
        result = tool._parse_output(f"<script_code>{script_code}</script_code>")
        assert result.script_code == script_code
