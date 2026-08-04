"""Which product tools exist, and how to run one.

Every `products/<product>/backend/max_tools.py` is imported once and searched for
`MaxTool` subclasses. There is no decorator and no list to keep in step: a tool
is registered by being a subclass declared in one of those modules, which is
already the only thing its author writes.

TENANCY. A tool is refused if its arguments declare a team, project or
organization. `team` reaches a tool as a keyword argument from the authenticated
request and never as something the model says, so a schema that asks for one is
a bug in that tool, not a route the registry will expose.
"""

from __future__ import annotations

import re
import pkgutil
import importlib
from functools import cache

import structlog

from products.insights_ai.backend.max_tool import MaxTool, MaxToolError

logger = structlog.get_logger(__name__)

# Tools whose graph scaffolding has not been ported. They are expected to fail to
# import, so their absence is noted rather than warned about.
UNPORTED = frozenset({"replay", "revenue_analytics", "web_analytics"})

# An argument by any of these names would be the model choosing the tenant.
_TENANCY = re.compile(r"team|project|organization|(^|_)org($|_)|tenant", re.I)


def _tenancy_fields(tool: type[MaxTool]) -> list[str]:
    return [field for field in tool.args_schema.model_fields if _TENANCY.search(field)]


def _modules():
    """Import every product's `max_tools`, yielding the ones that load."""
    import products

    for module in pkgutil.iter_modules(products.__path__):
        name = f"products.{module.name}.backend.max_tools"
        try:
            yield importlib.import_module(name)
        except ModuleNotFoundError as error:
            # The product has no tools, or it has some and one of its own imports
            # is missing — worth telling apart, so only the first is silent.
            if getattr(error, "name", "") != name:
                logger.warning("max_tools.import_failed", module=name, error=str(error))
        except Exception as error:
            if module.name in UNPORTED:
                logger.info("max_tools.unported", module=name)
            else:
                logger.warning("max_tools.import_failed", module=name, error=str(error))


def tools_in(module) -> dict[str, type[MaxTool]]:
    """The tools one module declares, minus any that ask the model for a tenant."""
    found: dict[str, type[MaxTool]] = {}
    for value in vars(module).values():
        # Declared here, rather than imported into here, so a tool is counted
        # once no matter how many modules mention it.
        if not isinstance(value, type) or not issubclass(value, MaxTool) or value is MaxTool:
            continue
        if value.__module__ != module.__name__:
            continue

        leaked = _tenancy_fields(value)
        if leaked:
            logger.error("max_tools.tenancy_in_schema", tool=value.name, fields=leaked)
            continue
        found[value.name] = value
    return found


@cache
def tools() -> dict[str, type[MaxTool]]:
    """Every registered tool, by the name the model calls it by."""
    found: dict[str, type[MaxTool]] = {}
    for module in _modules():
        for name, tool in tools_in(module).items():
            if name in found:
                logger.error("max_tools.duplicate_name", tool=name, module=module.__name__)
                continue
            found[name] = tool
    return found


def definitions() -> list[dict]:
    """Every tool as an OpenAI-dialect `tools=` array."""
    return [tool.definition() for tool in tools().values()]


def run(name: str, arguments: dict, *, team, user=None, context=None, config=None, approved: bool = False):
    """Run one tool for `team`, returning its `(content, artifact)`.

    Raises `MaxToolError` for a call the model can be told about — an unknown
    tool, arguments that do not fit the schema, access it does not have, an
    unapproved dangerous operation. Anything else is the tool failing, and is
    left to the caller to log.
    """
    tool = tools().get(name)
    if tool is None:
        raise MaxToolError(f"There is no tool called {name!r}.")
    return tool(team=team, user=user, context=context, config=config).run(arguments, approved=approved)
