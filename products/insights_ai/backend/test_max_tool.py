"""Tests for the tool contract itself, using tools defined here rather than real ones.

What a product tool relies on is the surface `MaxTool` offers: the team it was
given, the screen context, argument validation, which of the two impls runs, and
the approval gate in front of them. Each is checked by what it does — a tool that
returns the team it was handed, arguments that come back changed, a call refused.

None of this needs a database: a team is only read from here, so a stand-in with
a name is enough, and that keeps the contract checkable anywhere. Access control
is the one part that does need real rows, and it is tested in `test_registry.py`.
"""

from types import SimpleNamespace
from typing import Any

from django.test import SimpleTestCase

from asgiref.sync import async_to_sync
from pydantic import BaseModel, Field

from products.insights_ai.backend.max_tool import MaxTool, MaxToolApprovalRequired, MaxToolError

TEAM = SimpleNamespace(name="Test project")


class Args(BaseModel):
    thing: str = Field(description="A thing")
    count: int = Field(default=1, description="How many")


class SyncTool(MaxTool):
    name: str = "sync_tool"
    description: str = "  A tool that runs synchronously.  "
    args_schema: type[BaseModel] = Args
    context_prompt_template: str = "Currently showing {current}"

    def _run_impl(self, thing: str, count: int = 1) -> tuple[str, Any]:
        return f"{thing} x{count} for {self._team.name}", {"thing": thing, "count": count}


class AsyncTool(MaxTool):
    name: str = "async_tool"
    description: str = "A tool that runs asynchronously."
    args_schema: type[BaseModel] = Args

    async def _arun_impl(self, thing: str, count: int = 1) -> tuple[str, Any]:
        return f"async {thing} x{count} for {self._team.name}", None


class DangerousTool(MaxTool):
    name: str = "dangerous_tool"
    description: str = "A tool that destroys something."
    args_schema: type[BaseModel] = Args

    async def is_dangerous_operation(self, thing: str, count: int = 1) -> bool:
        return thing == "production"

    async def format_dangerous_operation_preview(self, thing: str, count: int = 1) -> str:
        return f"This would delete {thing}"

    def _run_impl(self, thing: str, count: int = 1) -> tuple[str, Any]:
        return f"deleted {thing}", None


class NoImplTool(MaxTool):
    name: str = "no_impl_tool"
    description: str = "A tool whose author forgot the body."
    args_schema: type[BaseModel] = Args


class ConfigTool(MaxTool):
    name: str = "config_tool"
    description: str = "A tool that reads what the caller configured."
    args_schema: type[BaseModel] = Args

    def _run_impl(self, thing: str, count: int = 1) -> tuple[str, Any]:
        return str((self._config.get("configurable") or {}).get("thread")), None


class TestDefinition(SimpleTestCase):
    def test_is_an_openai_dialect_function(self):
        definition = SyncTool.definition()

        self.assertEqual(definition["type"], "function")
        self.assertEqual(definition["function"]["name"], "sync_tool")
        self.assertEqual(definition["function"]["description"], "A tool that runs synchronously.")

        parameters = definition["function"]["parameters"]
        self.assertEqual(parameters["type"], "object")
        self.assertEqual(set(parameters["properties"]), {"thing", "count"})
        self.assertEqual(parameters["required"], ["thing"])

    def test_describes_no_team_project_or_organization(self):
        # The whole point: there is no argument by which the model names a tenant.
        self.assertNotIn("team", SyncTool.definition()["function"]["parameters"]["properties"])


class TestRunning(SimpleTestCase):
    def test_sync_impl_runs_and_sees_its_team(self):
        content, artifact = SyncTool(team=TEAM).run({"thing": "widget", "count": 3})

        self.assertEqual(content, "widget x3 for Test project")
        self.assertEqual(artifact, {"thing": "widget", "count": 3})

    def test_async_impl_runs_from_a_sync_caller(self):
        content, _ = AsyncTool(team=TEAM).run({"thing": "widget"})

        self.assertEqual(content, "async widget x1 for Test project")

    def test_sync_impl_runs_from_an_async_caller(self):
        content, _ = async_to_sync(SyncTool(team=TEAM).arun)({"thing": "widget"})

        self.assertEqual(content, "widget x1 for Test project")

    def test_async_impl_runs_from_an_async_caller(self):
        content, _ = async_to_sync(AsyncTool(team=TEAM).arun)({"thing": "widget"})

        self.assertEqual(content, "async widget x1 for Test project")

    def test_a_tool_with_neither_impl_says_so(self):
        with self.assertRaises(NotImplementedError):
            NoImplTool(team=TEAM).run({"thing": "widget"})

    def test_defaults_are_applied(self):
        _, artifact = SyncTool(team=TEAM).run({"thing": "widget"})

        self.assertEqual(artifact["count"], 1)

    def test_the_callers_config_reaches_the_tool(self):
        tool = ConfigTool(team=TEAM, config={"configurable": {"thread": "abc"}})

        self.assertEqual(tool.run({"thing": "widget"})[0], "abc")

    def test_config_defaults_to_something_a_tool_can_read(self):
        self.assertEqual(ConfigTool(team=TEAM).run({"thing": "widget"})[0], "None")


class TestArguments(SimpleTestCase):
    def test_undeclared_arguments_never_reach_the_tool(self):
        # The model can say anything; only what the schema declares gets through.
        _, artifact = SyncTool(team=TEAM).run({"thing": "widget", "team_id": 999, "sneaky": True})

        self.assertEqual(artifact, {"thing": "widget", "count": 1})

    def test_a_missing_argument_is_reported_to_the_model(self):
        with self.assertRaises(MaxToolError) as caught:
            SyncTool(team=TEAM).run({"count": 2})

        self.assertIn("sync_tool", str(caught.exception))

    def test_an_ill_typed_argument_is_reported_to_the_model(self):
        with self.assertRaises(MaxToolError):
            SyncTool(team=TEAM).run({"thing": "widget", "count": "lots"})


class TestContext(SimpleTestCase):
    def test_renders_what_the_caller_put_on_screen(self):
        tool = SyncTool(team=TEAM, context={"current": "the dashboard"})

        self.assertEqual(tool.render_context_prompt(), "Currently showing the dashboard")

    def test_a_dict_renders_as_json(self):
        tool = SyncTool(team=TEAM, context={"current": {"a": 1}})

        self.assertEqual(tool.render_context_prompt(), 'Currently showing {"a": 1}')

    def test_a_missing_key_renders_rather_than_raising(self):
        self.assertEqual(SyncTool(team=TEAM).render_context_prompt(), "Currently showing None")

    def test_doubled_braces_are_literal(self):
        class Braced(SyncTool):
            context_prompt_template: str = "Send {{'a': {current}}}"

        tool = Braced(team=TEAM, context={"current": 1})

        self.assertEqual(tool.render_context_prompt(), "Send {'a': 1}")

    def test_a_tool_without_a_template_renders_nothing(self):
        self.assertIsNone(AsyncTool(team=TEAM).render_context_prompt())

    def test_context_defaults_to_empty_rather_than_none(self):
        self.assertEqual(SyncTool(team=TEAM).context, {})

    def test_the_context_a_tool_reads_is_the_one_it_was_given(self):
        self.assertEqual(SyncTool(team=TEAM, context={"a": 1}).context, {"a": 1})


class TestDangerousOperations(SimpleTestCase):
    def test_a_dangerous_call_is_refused_with_its_preview(self):
        with self.assertRaises(MaxToolApprovalRequired) as caught:
            DangerousTool(team=TEAM).run({"thing": "production"})

        self.assertEqual(caught.exception.preview, "This would delete production")

    def test_a_refused_call_does_not_run(self):
        # The refusal has to happen instead of the work, not alongside it.
        class Counting(DangerousTool):
            ran = 0

            def _run_impl(self, thing: str, count: int = 1) -> tuple[str, Any]:
                type(self).ran += 1
                return "ran", None

        with self.assertRaises(MaxToolApprovalRequired):
            Counting(team=TEAM).run({"thing": "production"})

        self.assertEqual(Counting.ran, 0)

    def test_an_approved_dangerous_call_runs(self):
        content, _ = DangerousTool(team=TEAM).run({"thing": "production"}, approved=True)

        self.assertEqual(content, "deleted production")

    def test_a_call_the_tool_judges_safe_runs_unapproved(self):
        content, _ = DangerousTool(team=TEAM).run({"thing": "staging"})

        self.assertEqual(content, "deleted staging")

    def test_the_gate_holds_on_the_async_path_too(self):
        with self.assertRaises(MaxToolApprovalRequired):
            async_to_sync(DangerousTool(team=TEAM).arun)({"thing": "production"})
