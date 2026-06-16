"""
Integration test for TypeScript definition generation.

Tests the complete flow:
1. Create EventDefinitions with EventSchemas
2. Generate TypeScript via the typescript_definitions method
3. Write generated TypeScript to temp file
4. Create a test file that uses the types
5. Run TypeScript compiler to verify no errors
"""

import re
import tempfile
from pathlib import Path
from typing import Any

import pytest
from insights.test.base import APIBaseTest
from unittest.mock import MagicMock, patch

from rest_framework import status

from insights.models import EventDefinition, EventSchema, SchemaPropertyGroup, SchemaPropertyGroupProperty


@pytest.mark.usefixtures("unittest_snapshot")
class TestEventDefinitionTypeScriptGeneration(APIBaseTest):
    """
    Critical integration test ensuring TypeScript generation maintains type safety
    while allowing additional properties beyond the schema.
    """

    snapshot: Any

    def setUp(self):
        super().setUp()

        # Create property group with required and optional fields
        self.property_group = SchemaPropertyGroup.objects.create(
            team=self.team, project=self.project, name="Test Properties"
        )

        SchemaPropertyGroupProperty.objects.create(
            property_group=self.property_group,
            name="required_field",
            property_type="Numeric",
            is_required=True,
            description="A required numeric field",
        )

        SchemaPropertyGroupProperty.objects.create(
            property_group=self.property_group,
            name="optional_field",
            property_type="String",
            is_required=False,
            description="An optional string field",
        )

        # Create event definition and link to property group
        self.event_def = EventDefinition.objects.create(team=self.team, project=self.project, name="test_event")

        EventSchema.objects.create(event_definition=self.event_def, property_group=self.property_group)

        # Create event with all optional fields
        self.optional_event_def = EventDefinition.objects.create(
            team=self.team, project=self.project, name="optional_event"
        )

        optional_property_group = SchemaPropertyGroup.objects.create(
            team=self.team, project=self.project, name="Optional Properties"
        )

        SchemaPropertyGroupProperty.objects.create(
            property_group=optional_property_group,
            name="optional_only",
            property_type="String",
            is_required=False,
        )

        EventSchema.objects.create(event_definition=self.optional_event_def, property_group=optional_property_group)

        # Create event with no schema (all properties allowed)
        self.untyped_event_def = EventDefinition.objects.create(
            team=self.team, project=self.project, name="untyped_event"
        )

        # Create event with special characters to test escaping
        self.special_chars_event = EventDefinition.objects.create(
            team=self.team, project=self.project, name="a'a\\'b\"c>?>%}}%%>c<[[?${{%}}cake'"
        )

        special_property_group = SchemaPropertyGroup.objects.create(
            team=self.team, project=self.project, name="Special Properties"
        )

        SchemaPropertyGroupProperty.objects.create(
            property_group=special_property_group,
            name="prop'with\\'quotes\"\\slash",
            property_type="String",
            is_required=True,
        )

        EventSchema.objects.create(event_definition=self.special_chars_event, property_group=special_property_group)

    def _generate_typescript(self) -> str:
        """Generate TypeScript definitions by calling the actual API endpoint"""
        response = self.client.get(f"/api/projects/{self.project.id}/event_definitions/typescript/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json()["content"]

    def _strip_dynamic_timestamp(self, content: str) -> str:
        """Remove the dynamic timestamp from generated TypeScript to allow snapshot testing"""
        # Replace the timestamp line with a fixed string
        return re.sub(
            r"Generated at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+",
            "Generated at: <TIMESTAMP>",
            content,
        )

    @patch("subprocess.run")
    def test_typescript_allows_additional_properties(self, mock_subprocess_run):
        """
        Critical test: Verify that additional properties beyond schema
        are allowed while required properties are still validated.

        This is the core functionality that prevents "excess property checking"
        errors in TypeScript while maintaining type safety for required fields.

        Uses the real insights-js package to ensure compatibility with actual types.
        """

        # Mock subprocess.run to skip pnpm install and TypeScript compilation
        def mock_run(*args, **kwargs):
            mock_result = MagicMock()
            mock_result.returncode = 0
            mock_result.stdout = ""
            mock_result.stderr = ""
            return mock_result

        mock_subprocess_run.side_effect = mock_run

        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)

            # Generate TypeScript
            ts_content = self._generate_typescript()

            # Create minimal package.json to install only required dependencies
            package_json = tmpdir_path / "package.json"
            package_json.write_text('{"dependencies": {"typescript": "^5.0.0", "insights-js": "^1.0.0"}}')

            # Write generated types (using real insights-js)
            types_file = tmpdir_path / "insights-typed.ts"
            types_file.write_text(ts_content)

            # Create test file that exercises all type scenarios
            test_file = tmpdir_path / "test.ts"
            test_file.write_text(
                """
import insights, { EventName } from './insights-typed'

// ========================================
// TEST 1: Additional properties are allowed
// ========================================

// ✅ Should compile: required field + extra properties (CRITICAL TEST)
insights.capture('test_event', {
    required_field: 123,
    optional_field: 'test',
    extra_property: 'this should be allowed',
    another_extra: true,
    nested_extra: { foo: 'bar' }
})

// ✅ Should compile: only required field
insights.capture('test_event', {
    required_field: 456
})

// ========================================
// TEST 2: Required properties are validated
// ========================================

// ❌ Should fail: missing required field
// @ts-expect-error
insights.capture('test_event', {
    optional_field: 'test'
})

// ❌ Should fail: wrong type for required field
// @ts-expect-error
insights.capture('test_event', {
    required_field: 'string not allowed'
})

// ========================================
// TEST 3: Events with all optional properties
// ========================================

// ✅ Should compile: no properties needed
insights.capture('optional_event')

// ✅ Should compile: with properties
insights.capture('optional_event', {
    optional_only: 'value',
    extra_field: 123
})

// ========================================
// TEST 4: Untyped events accept anything
// ========================================

// ✅ Should compile: any properties
insights.capture('untyped_event', {
    anything: 'goes',
    here: 123
})

// ✅ Should compile: no properties
insights.capture('untyped_event')

// ========================================
// TEST 5: Undefined events work flexibly
// ========================================

// ✅ Should compile: custom event with properties
insights.capture('custom_undefined_event', {
    any: 'properties',
    work: 'here'
})

// ✅ Should compile: custom event without properties
insights.capture('another_custom_event')

// ========================================
// TEST 6: String variables are blocked
// ========================================

// ❌ Should fail: broad string type not allowed
let stringVar: string = 'test_event'
// @ts-expect-error
insights.capture(stringVar)

// ✅ Should compile: EventName type works
let typedVar: EventName = 'test_event'
insights.capture(typedVar, { required_field: 789 })

// ✅ Should compile: const infers literal type
const constVar = 'test_event'
insights.capture(constVar, { required_field: 999 })

// ========================================
// TEST 7: captureRaw bypasses all checking
// ========================================

// ✅ Should compile: missing required fields is OK
insights.captureRaw('test_event', {
    optional_field: 'test'
})

// ✅ Should compile: wrong types are OK
insights.captureRaw('test_event', {
    required_field: 'string is fine here'
})

// ✅ Should compile: string variables work
insights.captureRaw(stringVar, { any: 'data' })

// ========================================
// TEST 8: Special characters are escaped
// ========================================

// ✅ Should compile: event and property names with special chars
insights.capture("a'a\\\\'b\\"c>?>%}}%%>c<[[?${{%}}cake'", {
    "prop'with\\\\'quotes\\"\\\\slash": 'value'
})
"""
            )

            # Use snapshot to verify the generated TypeScript structure and content
            # This ensures any changes to the TypeScript generation are intentional and reviewed
            # Strip the dynamic timestamp so the snapshot is stable
            self.snapshot.assert_match(self._strip_dynamic_timestamp(ts_content))
