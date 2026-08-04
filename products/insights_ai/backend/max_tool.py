"""The contract a product tool implements, and the runtime that invokes it.

A product tool lives in `products/<product>/backend/max_tools.py`, subclasses
`MaxTool`, declares its arguments as a pydantic model, and implements one of
`_run_impl` / `_arun_impl` returning `(content, artifact)`. `content` is the text
the model reads back; `artifact` is the structured half, for a caller that has a
screen to put it on. `registry.py` finds these and turns them into an
OpenAI-dialect `tools=` array.

TENANCY. `team` is a required keyword argument, supplied by the caller from the
authenticated request. It is never a tool argument: arguments are validated
through `args_schema` before the tool sees them, and `registry.py` refuses to
expose any tool whose schema declares a team, project or organization, so there
is nothing the model can say that moves the work to another project.

This is deliberately not a LangChain `BaseTool`. The assistant's loop speaks the
OpenAI dialect directly (see `assistant.py`), so a tool needs a JSON schema and a
callable, and the graph scaffolding that `BaseTool` exists to serve would be
weight with nothing standing on it.
"""

from __future__ import annotations

import re
import json
from functools import cached_property
from typing import Any

import structlog
from asgiref.sync import async_to_sync, sync_to_async
from pydantic import BaseModel, ValidationError

from insights.rbac.user_access_control import UserAccessControl

logger = structlog.get_logger(__name__)


class MaxToolError(Exception):
    """A failure the model is meant to read and act on, rather than a bug."""


class MaxToolAccessDenied(MaxToolError):
    """The user may not reach the resource this tool works on."""

    def __init__(self, resource: str, required_level: str):
        self.resource = resource
        self.required_level = required_level
        super().__init__(f"You do not have {required_level} access to {resource}.")


class MaxToolApprovalRequired(MaxToolError):
    """The tool judged this call dangerous and nobody has approved it."""

    def __init__(self, preview: str):
        self.preview = preview
        super().__init__(preview)


# `{{`/`}}` are literal braces, `{name}` is a placeholder; anything else is left
# alone, so a template may quote JSON without every brace becoming a hole.
_PLACEHOLDER = re.compile(r"\{\{|\}\}|\{([A-Za-z_][A-Za-z0-9_]*)\}")


class MaxTool:
    # Set by every subclass. `context_prompt_template` is optional: it renders
    # what the user has on screen into the prompt that offers this tool.
    name: str
    description: str
    args_schema: type[BaseModel]
    context_prompt_template: str | None = None

    def __init__(
        self,
        *,
        team,
        user=None,
        context: dict[str, Any] | None = None,
        config: dict[str, Any] | None = None,
    ) -> None:
        self._team = team
        self._user = user
        # What the caller's screen exposes. Tools read it with `.get`, so an
        # absent key is a tool that works with less rather than one that raises.
        self._context = context or {}
        self._config = config or {"configurable": {}}

    @property
    def context(self) -> dict[str, Any]:
        return self._context

    @cached_property
    def user_access_control(self) -> UserAccessControl:
        return UserAccessControl(user=self._user, team=self._team)

    # ---- what a subclass overrides -------------------------------------------------

    def get_required_resource_access(self) -> list[tuple[str, str]]:
        """`(resource, level)` pairs the user must hold before this tool runs."""
        return []

    async def is_dangerous_operation(self, *args, **kwargs) -> bool:
        """Whether this particular call needs a person to approve it first."""
        return False

    async def format_dangerous_operation_preview(self, *args, **kwargs) -> str:
        """What that person would be approving."""
        return f"Execute {self.name}"

    def _run_impl(self, *args, **kwargs) -> tuple[str, Any]:
        raise NotImplementedError

    async def _arun_impl(self, *args, **kwargs) -> tuple[str, Any]:
        raise NotImplementedError

    # ---- the runtime ---------------------------------------------------------------

    @classmethod
    def definition(cls) -> dict:
        """This tool as one entry of an OpenAI-dialect `tools=` array."""
        return {
            "type": "function",
            "function": {
                "name": cls.name,
                "description": (cls.description or "").strip(),
                "parameters": cls.args_schema.model_json_schema(),
            },
        }

    def render_context_prompt(self) -> str | None:
        """The tool's context template filled in from `context`, or None if it has none.

        A missing key renders as "None" rather than raising: the template
        describes a screen the caller may not be on, and a prompt with a hole in
        it is worth more than a turn that fails.
        """
        template = self.context_prompt_template
        if not template:
            return None

        values = {
            key: json.dumps(value) if isinstance(value, dict | list) else value for key, value in self._context.items()
        }

        def substitute(match: re.Match) -> str:
            if match.group(0) == "{{":
                return "{"
            if match.group(0) == "}}":
                return "}"
            key = match.group(1)
            if key not in values:
                logger.warning("max_tool.context_key_missing", tool=self.name, key=key)
            return str(values.get(key))

        return _PLACEHOLDER.sub(substitute, template)

    def _validated(self, arguments: dict[str, Any]) -> dict[str, Any]:
        """The model's arguments, as the schema says they must look.

        Anything the schema does not declare is dropped here, which is what keeps
        a tool's reachable inputs to the ones its author wrote down.
        """
        try:
            model = self.args_schema(**arguments)
        except ValidationError as error:
            raise MaxToolError(f"Invalid arguments for {self.name}: {error}") from error
        return {field: getattr(model, field) for field in type(model).model_fields}

    def _check_access(self) -> None:
        required = self.get_required_resource_access()
        if not required:
            return
        # An access check with nobody to check is not a pass.
        if self._user is None:
            raise MaxToolAccessDenied(required[0][0], required[0][1])
        for resource, level in required:
            if not self.user_access_control.check_access_level_for_resource(resource, level):  # type: ignore[arg-type]
                raise MaxToolAccessDenied(resource, level)

    def _overrides(self, method: str) -> bool:
        """Whether the subclass implements `method`, rather than inheriting the stub.

        Asking the class is what decides which of the two impls runs. Catching
        NotImplementedError would work until an impl raised one of its own.
        """
        return getattr(type(self), method) is not getattr(MaxTool, method)

    async def arun(self, arguments: dict[str, Any], *, approved: bool = False) -> tuple[str, Any]:
        """Run this tool for its team. Returns `(content, artifact)`."""
        kwargs = self._validated(arguments)
        await sync_to_async(self._check_access)()
        await self._check_dangerous(kwargs, approved=approved)

        if self._overrides("_arun_impl"):
            return await self._arun_impl(**kwargs)
        if self._overrides("_run_impl"):
            return await sync_to_async(self._run_impl)(**kwargs)
        raise NotImplementedError(f"{type(self).__name__} implements neither _run_impl nor _arun_impl")

    def run(self, arguments: dict[str, Any], *, approved: bool = False) -> tuple[str, Any]:
        """`arun` for a caller with no event loop, which is what the assistant is."""
        kwargs = self._validated(arguments)
        self._check_access()
        async_to_sync(self._check_dangerous)(kwargs, approved=approved)

        if self._overrides("_run_impl"):
            return self._run_impl(**kwargs)
        if self._overrides("_arun_impl"):
            return async_to_sync(self._arun_impl)(**kwargs)
        raise NotImplementedError(f"{type(self).__name__} implements neither _run_impl nor _arun_impl")

    async def _check_dangerous(self, kwargs: dict[str, Any], *, approved: bool) -> None:
        """Stop before a dangerous call that nobody approved.

        There is no interrupt-and-resume channel here, so an unapproved
        dangerous call raises with its preview instead of running. The caller
        decides how to ask, and passes `approved=True` once it has an answer.
        """
        if approved or not await self.is_dangerous_operation(**kwargs):
            return
        raise MaxToolApprovalRequired(await self.format_dangerous_operation_preview(**kwargs))
