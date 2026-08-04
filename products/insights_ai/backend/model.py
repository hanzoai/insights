"""The chat model a product tool reaches for, and the error it raises on bad output.

Tools that ask a model for structured output use `MaxChatOpenAI`. It is a
`ChatOpenAI` pointed at the Hanzo AI gateway with this deployment's own IAM
bearer — the same seam `assistant.py` uses, so there is one way to reach a model
from this product and not a second one.
"""

from __future__ import annotations

from typing import Any

from django.conf import settings

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_openai import ChatOpenAI

from insights import iam


class PydanticOutputParserException(ValueError):
    """A model wrote something the schema would not accept.

    Carries both halves because the tools that raise it feed them back into the
    next attempt: the output so the model can see what it wrote, the message so
    it can see what was wrong with it.
    """

    def __init__(self, llm_output: str, validation_message: str):
        super().__init__(f"{validation_message}, occurred at:\n```\n{llm_output}\n```")
        self.llm_output = llm_output
        self.validation_message = validation_message


_CONTEXT_TEMPLATE = """You are in the project "{project}" of the {organization} organization.
The project's timezone is {timezone}."""


class MaxChatOpenAI(ChatOpenAI):
    """A chat model on the Hanzo gateway, told which project it is working in.

    `user` and `team` say who the generation is for. `billable` records that the
    call is chargeable work; the gateway meters by the IAM identity presenting
    the token, so this marks intent rather than deciding the charge.
    """

    user: Any = None
    team: Any = None
    billable: bool = False
    inject_context: bool = True

    def __init__(self, **kwargs):
        # Raises IamUnavailable rather than sending an unauthenticated request.
        kwargs.setdefault("base_url", f"{settings.HANZO_API_URL}/v1")
        kwargs.setdefault("api_key", iam.service_token())
        super().__init__(**kwargs)

    def _with_context(self, messages: list[BaseMessage]) -> list[BaseMessage]:
        """The messages, prefixed with which project this is, when asked for."""
        if not self.inject_context or self.team is None:
            return messages
        return [
            SystemMessage(
                content=_CONTEXT_TEMPLATE.format(
                    project=self.team.name,
                    organization=self.team.organization.name,
                    timezone=self.team.timezone,
                )
            ),
            *messages,
        ]

    def _generate(self, messages, *args, **kwargs):
        return super()._generate(self._with_context(messages), *args, **kwargs)

    async def _agenerate(self, messages, *args, **kwargs):
        return await super()._agenerate(self._with_context(messages), *args, **kwargs)
