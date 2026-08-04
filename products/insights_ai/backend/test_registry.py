"""Tests that the product tools are found, described, and run for one team only.

The eight products below are the ones whose tools need nothing but the base
class. The three named in `UNPORTED` still want the graph scaffolding this
deployment does not carry, so they are expected to be absent — asserted here, so
that porting one is noticed rather than silently changing the registry.
"""

import inspect
from types import ModuleType

from insights.test.base import BaseTest

from pydantic import BaseModel

from insights.models import Team

from products.insights_ai.backend import registry
from products.insights_ai.backend.max_tool import MaxTool, MaxToolAccessDenied, MaxToolError
from products.tasks.backend.models import Task


class ListArgs(BaseModel):
    pass


PORTED = [
    "cdp",
    "error_tracking",
    "experiments",
    "feature_flags",
    "surveys",
    "tasks",
    "user_interviews",
    "workflows",
]


class TestDiscovery(BaseTest):
    def test_every_ported_product_imports_cleanly(self):
        for product in PORTED:
            with self.subTest(product=product):
                __import__(f"products.{product}.backend.max_tools")

    def test_every_ported_product_contributes_at_least_one_tool(self):
        products = {tool.__module__.split(".")[1] for tool in registry.tools().values()}

        self.assertEqual(products, set(PORTED))

    def test_lists_the_tools_by_the_name_the_model_calls_them_by(self):
        for name, tool in registry.tools().items():
            with self.subTest(tool=name):
                self.assertEqual(tool.name, name)

    def test_the_unported_products_are_absent(self):
        products = {tool.__module__.split(".")[1] for tool in registry.tools().values()}

        self.assertEqual(products & registry.UNPORTED, set())

    def test_a_known_tool_from_each_product_is_registered(self):
        for name in ["create_survey", "list_tasks", "create_feature_flag", "analyze_user_interviews"]:
            with self.subTest(tool=name):
                self.assertIn(name, registry.tools())


class TestDefinitions(BaseTest):
    def test_every_tool_describes_itself_as_an_openai_function(self):
        for definition in registry.definitions():
            with self.subTest(tool=definition["function"]["name"]):
                self.assertEqual(definition["type"], "function")
                self.assertTrue(definition["function"]["description"])
                self.assertEqual(definition["function"]["parameters"]["type"], "object")

    def test_there_is_one_definition_per_tool(self):
        names = [definition["function"]["name"] for definition in registry.definitions()]

        self.assertEqual(sorted(names), sorted(registry.tools()))
        self.assertEqual(len(names), len(set(names)))


class TestTenancy(BaseTest):
    def test_no_registered_tool_lets_the_model_name_a_tenant(self):
        for name, tool in registry.tools().items():
            with self.subTest(tool=name):
                self.assertEqual(registry._tenancy_fields(tool), [])

    def test_a_tool_asking_for_a_team_is_refused(self):
        # Written into a module of its own, because what the registry collects is
        # what a `max_tools` module declares.
        module = ModuleType("products.pretend.backend.max_tools")
        exec(
            "from pydantic import BaseModel, Field\n"
            "from products.insights_ai.backend.max_tool import MaxTool\n"
            "class Args(BaseModel):\n"
            "    team_id: int = Field(description='which team')\n"
            "class LeakyTool(MaxTool):\n"
            "    name: str = 'leaky'\n"
            "    description: str = 'asks the model which team to read'\n"
            "    args_schema: type[BaseModel] = Args\n",
            module.__dict__,
        )

        self.assertEqual(registry.tools_in(module), {})

    def test_a_tool_asking_for_nothing_untoward_is_kept(self):
        module = ModuleType("products.pretend.backend.max_tools")
        exec(
            "from pydantic import BaseModel, Field\n"
            "from products.insights_ai.backend.max_tool import MaxTool\n"
            "class Args(BaseModel):\n"
            "    thing: str = Field(description='a thing')\n"
            "class FineTool(MaxTool):\n"
            "    name: str = 'fine'\n"
            "    description: str = 'reads a thing'\n"
            "    args_schema: type[BaseModel] = Args\n",
            module.__dict__,
        )

        self.assertEqual(list(registry.tools_in(module)), ["fine"])


class TestRunning(BaseTest):
    """`list_tasks` end to end: a real tool, a real team, real rows."""

    def _task(self, title: str, *, team: Team) -> Task:
        return Task.objects.create(
            team=team,
            title=title,
            description=f"description of {title}",
            origin_product=Task.OriginProduct.USER_CREATED,
            repository="hanzoai/insights",
        )

    def test_returns_this_teams_tasks(self):
        self._task("Fix the login redirect", team=self.team)
        self._task("Add a retention chart", team=self.team)

        content, artifact = registry.run("list_tasks", {}, team=self.team, user=self.user)

        self.assertIn("Fix the login redirect", content)
        self.assertIn("Add a retention chart", content)
        self.assertEqual(
            {task["title"] for task in artifact["tasks"]}, {"Fix the login redirect", "Add a retention chart"}
        )

    def test_never_returns_another_teams_tasks(self):
        other = Team.objects.create(organization=self.organization, name="Another project")
        self._task("Ours", team=self.team)
        self._task("Theirs", team=other)

        content, artifact = registry.run("list_tasks", {}, team=self.team, user=self.user)

        self.assertIn("Ours", content)
        self.assertNotIn("Theirs", content)
        self.assertEqual([task["title"] for task in artifact["tasks"]], ["Ours"])

    def test_the_limit_the_model_asks_for_is_honoured(self):
        for index in range(4):
            self._task(f"Task {index}", team=self.team)

        _, artifact = registry.run("list_tasks", {"limit": 2}, team=self.team, user=self.user)

        self.assertEqual(len(artifact["tasks"]), 2)

    def test_an_empty_project_says_so_rather_than_failing(self):
        content, artifact = registry.run("list_tasks", {}, team=self.team, user=self.user)

        self.assertEqual(artifact["tasks"], [])
        self.assertIn("No tasks", content)

    def test_an_unknown_tool_is_reported_to_the_model(self):
        with self.assertRaises(MaxToolError) as caught:
            registry.run("no_such_tool", {}, team=self.team, user=self.user)

        self.assertIn("no_such_tool", str(caught.exception))

    def test_arguments_that_do_not_fit_the_schema_are_reported_to_the_model(self):
        with self.assertRaises(MaxToolError):
            registry.run("list_tasks", {"limit": 500}, team=self.team, user=self.user)


class GuardedTool(MaxTool):
    """Defined here, so it is never one of the registry's own tools."""

    name: str = "guarded_tool"
    description: str = "A tool behind an access check."
    args_schema: type[BaseModel] = ListArgs

    def get_required_resource_access(self):
        return [("feature_flag", "viewer")]

    def _run_impl(self) -> tuple[str, None]:
        return "ran", None


class TestAccess(BaseTest):
    def test_a_tool_needing_access_refuses_when_there_is_nobody_to_check(self):
        with self.assertRaises(MaxToolAccessDenied) as caught:
            GuardedTool(team=self.team, user=None).run({})

        self.assertEqual(caught.exception.resource, "feature_flag")
        self.assertEqual(caught.exception.required_level, "viewer")

    def test_a_permitted_user_gets_through(self):
        content, _ = GuardedTool(team=self.team, user=self.user).run({})

        self.assertEqual(content, "ran")

    def test_a_tool_declaring_no_access_runs_without_a_user(self):
        content, artifact = registry.run("list_tasks", {}, team=self.team, user=None)

        self.assertEqual(artifact["tasks"], [])

    def test_a_tool_defined_outside_a_max_tools_module_is_not_registered(self):
        self.assertNotIn("guarded_tool", registry.tools())


class TestSubclassing(BaseTest):
    def test_a_registered_tool_is_a_max_tool(self):
        for name, tool in registry.tools().items():
            with self.subTest(tool=name):
                self.assertTrue(issubclass(tool, MaxTool))
                self.assertIsNot(tool, MaxTool)
                self.assertTrue(issubclass(tool.args_schema, BaseModel))

    def test_every_tool_implements_one_of_the_two_impls(self):
        for name, tool in registry.tools().items():
            with self.subTest(tool=name):
                stub = tool(team=self.team)

                self.assertTrue(
                    stub._overrides("_run_impl") or stub._overrides("_arun_impl"),
                    f"{tool.__name__} implements neither _run_impl nor _arun_impl",
                )

    def test_every_impl_accepts_every_argument_its_schema_declares(self):
        """The arguments are validated then splatted in, so the two must agree.

        A field the impl has no parameter for is a TypeError the first time the
        model uses it — which is exactly the kind of thing nobody finds by hand.
        """
        for name, tool in registry.tools().items():
            with self.subTest(tool=name):
                stub = tool(team=self.team)
                impl = stub._arun_impl if stub._overrides("_arun_impl") else stub._run_impl
                parameters = inspect.signature(impl).parameters

                if any(p.kind is inspect.Parameter.VAR_KEYWORD for p in parameters.values()):
                    continue
                missing = set(tool.args_schema.model_fields) - set(parameters)

                self.assertEqual(missing, set(), f"{tool.__name__} cannot accept {sorted(missing)}")
