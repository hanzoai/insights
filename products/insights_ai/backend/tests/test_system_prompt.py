from insights.test.base import APIBaseTest

from products.insights_ai.backend.services.system_prompt.prompt import POSTFN_AI_SYSTEM_PROMPT
from products.insights_ai.backend.services.system_prompt.service import ClaudeCodeSystemPrompt, PromptService


class TestInsightsAISystemPrompt(APIBaseTest):
    def _build(self) -> ClaudeCodeSystemPrompt:
        return PromptService(self.team, self.user).build()

    def test_build_returns_preset_append_suffix(self):
        # The object form makes the agent-server append to Claude Code's prompt (a suffix), rather
        # than the bare-string form, which would replace it.
        assert self._build() == {
            "type": "preset",
            "preset": "claude_code",
            "append": POSTFN_AI_SYSTEM_PROMPT,
        }

    def test_includes_core_sections(self):
        prompt = self._build()["append"]
        assert "# Insights AI" in prompt
        assert "# Insights MCP" in prompt
        assert "# Insights Products" in prompt
        assert "# Tone and style" in prompt
        assert "# Context blocks" in prompt
        # The MCP is reachable through its single entry point.
        assert "mcp__insights__exec" in prompt
        # The trusted/untrusted context tags the frontend wraps messages with.
        assert "<insights_trusted_context>" in prompt
        assert "<insights_untrusted_context>" in prompt
        assert "AI observability** (also called AIO, LLM analytics, or LLMA)" in prompt

    def test_does_not_inject_groups_billing_core_memory_or_project_context(self):
        prompt = self._build()["append"]
        # These are reachable via the MCP server, so they are not duplicated in the system prompt.
        assert "<groups>" not in prompt
        assert "<billing_context>" not in prompt
        assert "<core_memory>" not in prompt
        assert "<project_context>" not in prompt
