"""Provide the `systemPrompt` for a Insights AI sandbox Run.

The value is a true suffix on Claude Code's own system prompt. The sandbox runs Claude Code, so
its built-in prompt supplies the base identity, tools, and capabilities; Insights AI only adds the
layer in ``prompt.py`` on top. To get suffix (not override) behavior, the value is sent as the
``{ type: "preset", preset: "claude_code", append }`` object: the agent-server's ``buildSystemPrompt``
keeps Claude Code's preset and appends our text (plus its own ``APPENDED_INSTRUCTIONS``), whereas a
bare string would replace the preset entirely. Project context, groups, billing, and core memory are
reachable via the Insights MCP server, so they are not duplicated here; per-turn context is delivered
separately via the ``<insights_context>`` wrapper.

The service is pure over its inputs — no side effects.
"""

from typing import Literal

from typing_extensions import TypedDict

from products.insights_ai.backend.helpers import BaseSandboxService
from products.insights_ai.backend.services.system_prompt.prompt import POSTFN_AI_SYSTEM_PROMPT


class ClaudeCodeSystemPrompt(TypedDict):
    """The ACP ``systemPrompt`` object that keeps Claude Code's built-in prompt and appends ours.

    Mirrors the Claude Agent SDK's preset shape. The agent-server's ``buildSystemPrompt`` takes the
    ``append`` branch for this object form (a suffix); a bare string would override the preset.
    """

    type: Literal["preset"]
    preset: Literal["claude_code"]
    append: str


class PromptService(BaseSandboxService):
    """Provide the systemPrompt suffix for a Insights AI sandbox Run. Stateless over its inputs."""

    def build(self) -> ClaudeCodeSystemPrompt:
        """Return the Insights AI systemPrompt as a Claude Code preset-plus-append suffix.

        Called once at Run creation. The returned object goes into
        ``clientConnection.newSession({ _meta: { systemPrompt } })``; the sandbox appends ``append``
        after Claude Code's own system prompt rather than replacing it.
        """
        return {"type": "preset", "preset": "claude_code", "append": POSTFN_AI_SYSTEM_PROMPT}
