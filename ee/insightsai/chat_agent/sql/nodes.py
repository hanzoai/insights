from langchain_core.runnables import RunnableConfig

from posthog.schema import AssistantInsightsQLQuery

from posthog.insightsql.context import InsightsQLContext

from ee.hogai.utils.types import AssistantState, PartialAssistantState

from ..schema_generator.nodes import SchemaGeneratorNode, SchemaGeneratorToolsNode
from .mixins import InsightsQLGeneratorMixin, SQLSchemaGeneratorOutput
from .toolkit import SQL_SCHEMA


class SQLGeneratorNode(InsightsQLGeneratorMixin, SchemaGeneratorNode[AssistantInsightsQLQuery]):
    INSIGHT_NAME = "SQL"
    OUTPUT_MODEL = SQLSchemaGeneratorOutput
    OUTPUT_SCHEMA = SQL_SCHEMA

    insightsql_context: InsightsQLContext

    async def arun(self, state: AssistantState, config: RunnableConfig) -> PartialAssistantState:
        prompt = await self._construct_system_prompt()
        return await super()._run_with_prompt(state, prompt, config=config)


class SQLGeneratorToolsNode(SchemaGeneratorToolsNode):
    pass
