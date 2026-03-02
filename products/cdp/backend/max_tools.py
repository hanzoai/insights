import re
import json
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from posthog.insightsql import errors as insightsql_errors
from posthog.insightsql.ai import (
    DESTINATION_LIMITATIONS_MESSAGE,
    EVENT_PROPERTY_TAXONOMY_MESSAGE,
    EVENT_TAXONOMY_MESSAGE,
    FILTER_TAXONOMY_MESSAGE,
    HOG_EXAMPLE_MESSAGE,
    CUSTOM_FUNCTION_FILTERS_SYSTEM_PROMPT,
    CUSTOM_FUNCTION_INPUTS_SYSTEM_PROMPT,
    HOG_GRAMMAR_MESSAGE,
    IDENTITY_MESSAGE_HOG,
    INPUT_SCHEMA_TYPES_MESSAGE,
    PERSON_TAXONOMY_MESSAGE,
    TRANSFORMATION_LIMITATIONS_MESSAGE,
)
from posthog.insightsql.parser import parse_program

from posthog.cdp.validation import compile_hog

from products.cdp.backend.prompts import (
    CUSTOM_FUNCTION_FILTERS_ASSISTANT_ROOT_SYSTEM_PROMPT,
    CUSTOM_FUNCTION_INPUTS_ASSISTANT_ROOT_SYSTEM_PROMPT,
    HOG_TRANSFORMATION_ASSISTANT_ROOT_SYSTEM_PROMPT,
)

from ee.hogai.chat_agent.schema_generator.parsers import PydanticOutputParserException
from ee.hogai.llm import MaxChatOpenAI
from ee.hogai.tool import MaxTool


class CreateHogTransformationFunctionArgs(BaseModel):
    instructions: str = Field(description="The instructions for what transformation to create.")


class HogTransformationOutput(BaseModel):
    script_code: str


class CreateCustomFunctionFiltersArgs(BaseModel):
    instructions: str = Field(description="The instructions for what filters to create.")


class CustomFunctionFiltersOutput(BaseModel):
    filters: dict


class CreateHogTransformationFunctionTool(MaxTool):
    name: str = "create_hog_transformation_function"  # Must match a value in AssistantTool enum
    description: str = "Write or edit the script code to create your desired function and apply it to the current editor"
    args_schema: type[BaseModel] = CreateHogTransformationFunctionArgs
    context_prompt_template: str = (
        HOG_TRANSFORMATION_ASSISTANT_ROOT_SYSTEM_PROMPT
        + "\n\n"
        + TRANSFORMATION_LIMITATIONS_MESSAGE
        + "\n\n"
        + DESTINATION_LIMITATIONS_MESSAGE
    )

    def _run_impl(self, instructions: str) -> tuple[str, str]:
        current_script_code = self.context.get("current_script_code", "")

        system_content = (
            IDENTITY_MESSAGE_HOG
            + "\n\n<example_script_code>\n"
            + HOG_EXAMPLE_MESSAGE
            + "\n</example_script_code>\n\n"
            + "\n\n<hog_grammar>\n"
            + HOG_GRAMMAR_MESSAGE
            + "\n</hog_grammar>\n\n"
            + "\n\n<current_script_code>\n"
            + current_script_code
            + "\n</current_script_code>"
            + "\n\nReturn ONLY the script code inside <script_code> tags. Do not add any other text or explanation."
        )

        user_content = "Write a Script transformation or tweak the current one to satisfy this request: " + instructions

        messages = [SystemMessage(content=system_content), HumanMessage(content=user_content)]

        final_error: Optional[Exception] = None
        for _ in range(3):
            try:
                result = self._model.invoke(messages)
                parsed_result = self._parse_output(result.content)
                break
            except PydanticOutputParserException as e:
                # Add error feedback to system message for retry
                system_content += f"\n\nAvoid this error: {str(e)}"
                messages[0] = SystemMessage(content=system_content)
                final_error = e
        else:
            raise final_error

        return "```script\n" + parsed_result.script_code + "\n```", parsed_result.script_code

    @property
    def _model(self):
        return MaxChatOpenAI(
            model="gpt-4.1",
            temperature=0.3,
            disable_streaming=True,
            user=self._user,
            team=self._team,
            billable=True,
            inject_context=False,
        )

    def _parse_output(self, output: str) -> HogTransformationOutput:
        match = re.search(r"<script_code>(.*?)</script_code>", output, re.DOTALL)
        if not match:
            # The model may have returned the code without tags, or with markdown
            script_code = re.sub(
                r"^\s*```script\s*\n(.*?)\n\s*```\s*$", r"\1", output, flags=re.DOTALL | re.MULTILINE
            ).strip()
        else:
            script_code = match.group(1).strip()

        if not script_code:
            raise PydanticOutputParserException(
                llm_output=output, validation_message="The model returned an empty script code response."
            )

        try:
            compile_hog(script_code, "transformation")
        except Exception:
            # Try to get a more specific error by parsing directly
            try:
                parse_program(script_code)
            except insightsql_errors.SyntaxError as parse_err:
                raise PydanticOutputParserException(
                    llm_output=script_code,
                    validation_message=f"The Script code failed to compile: {parse_err}",
                )
            raise PydanticOutputParserException(
                llm_output=script_code,
                validation_message="The Script code failed to compile.",
            )

        return HogTransformationOutput(script_code=script_code)


class CreateCustomFunctionFiltersTool(MaxTool):
    name: str = "create_custom_function_filters"  # Must match a value in AssistantTool enum
    description: str = (
        "Create or edit filters for script functions to specify which events and properties trigger the function"
    )
    args_schema: type[BaseModel] = CreateCustomFunctionFiltersArgs
    context_prompt_template: str = CUSTOM_FUNCTION_FILTERS_ASSISTANT_ROOT_SYSTEM_PROMPT

    def _run_impl(self, instructions: str) -> tuple[str, str]:
        current_filters = self.context.get("current_filters", "{}")
        function_type = self.context.get("function_type", "destination")

        system_content = (
            CUSTOM_FUNCTION_FILTERS_SYSTEM_PROMPT
            + f"\n\nCurrent filters: {current_filters}"
            + f"\nFunction type: {function_type}"
            + "\n\n<event_taxonomy>\n"
            + EVENT_TAXONOMY_MESSAGE
            + "\n</event_taxonomy>\n\n"
            + "\n\n<event_property_taxonomy>\n"
            + EVENT_PROPERTY_TAXONOMY_MESSAGE
            + "\n</event_property_taxonomy>\n\n"
            + "\n\n<person_property_taxonomy>\n"
            + PERSON_TAXONOMY_MESSAGE
            + "\n</person_property_taxonomy>\n\n"
            + "\n\n<filter_taxonomy>\n"
            + FILTER_TAXONOMY_MESSAGE
            + "\n</filter_taxonomy>"
        )

        user_content = f"Create filters for this script function: {instructions}"

        messages = [SystemMessage(content=system_content), HumanMessage(content=user_content)]

        final_error: Optional[Exception] = None
        for _ in range(3):
            try:
                result = self._model.invoke(messages)
                parsed_result = self._parse_output(result.content)
                break
            except PydanticOutputParserException as e:
                # Add error feedback to system message for retry
                system_content += f"\n\nAvoid this error: {str(e)}"
                messages[0] = SystemMessage(content=system_content)
                final_error = e
        else:
            raise final_error

        return f"```json\n{json.dumps(parsed_result.filters, indent=2)}\n```", json.dumps(parsed_result.filters)

    @property
    def _model(self):
        return MaxChatOpenAI(
            model="gpt-4.1", temperature=0.3, disable_streaming=True, user=self._user, team=self._team, billable=True
        )

    def _parse_output(self, output: str) -> CustomFunctionFiltersOutput:
        match = re.search(r"<filters>(.*?)</filters>", output, re.DOTALL)
        if not match:
            # The model may have returned the JSON without tags, or with markdown
            json_str = re.sub(
                r"^\s*```json\s*\n(.*?)\n\s*```\s*$", r"\1", output, flags=re.DOTALL | re.MULTILINE
            ).strip()
        else:
            json_str = match.group(1).strip()

        if not json_str:
            raise PydanticOutputParserException(
                llm_output=output, validation_message="The model returned an empty filters response."
            )

        try:
            filters = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise PydanticOutputParserException(
                llm_output=json_str, validation_message=f"The filters JSON failed to parse: {str(e)}"
            )

        return CustomFunctionFiltersOutput(filters=filters)


class CreateCustomFunctionInputsArgs(BaseModel):
    instructions: str = Field(description="The instructions for what inputs to generate or modify.")


class CustomFunctionInputsOutput(BaseModel):
    inputs_schema: list = Field(description="The generated inputs schema for the script function")


class CreateCustomFunctionInputsTool(MaxTool):
    name: str = "create_custom_function_inputs"
    description: str = "Generate or modify input variables for script functions based on the current code and requirements"
    args_schema: type[BaseModel] = CreateCustomFunctionInputsArgs
    context_prompt_template: str = CUSTOM_FUNCTION_INPUTS_ASSISTANT_ROOT_SYSTEM_PROMPT

    def _run_impl(self, instructions: str) -> tuple[str, list]:
        current_inputs_schema = self.context.get("current_inputs_schema", [])
        script_code = self.context.get("script_code", "")

        system_content = (
            CUSTOM_FUNCTION_INPUTS_SYSTEM_PROMPT
            + f"\n\nCurrent script code:\n{script_code}"
            + f"\nCurrent inputs schema:\n{current_inputs_schema}"
            + "\n\n<input_schema_types>\n"
            + INPUT_SCHEMA_TYPES_MESSAGE
            + "\n</input_schema_types>"
        )

        user_content = f"Create or modify the input variables for this function: {instructions}"

        messages = [SystemMessage(content=system_content), HumanMessage(content=user_content)]

        final_error: Optional[Exception] = None
        for _ in range(3):
            try:
                result = self._model.invoke(messages)
                parsed_result = self._parse_output(result.content)
                break
            except PydanticOutputParserException as e:
                system_content += f"\n\nAvoid this error: {str(e)}"
                messages[0] = SystemMessage(content=system_content)
                final_error = e
        else:
            raise final_error

        # Format the output for display
        import json

        formatted_json = json.dumps(parsed_result.inputs_schema, indent=2)
        return f"```json\n{formatted_json}\n```", parsed_result.inputs_schema

    @property
    def _model(self):
        return MaxChatOpenAI(
            model="gpt-4.1", temperature=0.3, disable_streaming=True, user=self._user, team=self._team, billable=True
        )

    def _parse_output(self, output: str) -> CustomFunctionInputsOutput:
        import json

        match = re.search(r"<inputs_schema>(.*?)</inputs_schema>", output, re.DOTALL)
        if not match:
            # Try to find JSON array in the output
            json_match = re.search(r"\[[\s\S]*\]", output)
            if json_match:
                json_str = json_match.group(0)
            else:
                raise PydanticOutputParserException(
                    llm_output=output, validation_message="Could not find inputs_schema in the response."
                )
        else:
            json_str = match.group(1).strip()

        try:
            inputs_schema = json.loads(json_str)
            if not isinstance(inputs_schema, list):
                raise PydanticOutputParserException(
                    llm_output=output, validation_message="Inputs schema must be a list."
                )
        except json.JSONDecodeError as e:
            raise PydanticOutputParserException(
                llm_output=output, validation_message=f"Invalid JSON in inputs schema: {str(e)}"
            )

        return CustomFunctionInputsOutput(inputs_schema=inputs_schema)
