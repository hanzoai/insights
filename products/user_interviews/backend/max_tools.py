from typing import Any

from django.conf import settings

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from products.insights_ai.backend.max_tool import MaxTool
from products.insights_ai.backend.model import MaxChatOpenAI

from .models import UserInterview


class AnalyzeUserInterviewsArgs(BaseModel):
    analysis_angle: str = Field(
        description="How to analyze the interviews based on user's question (e.g. 'Find common pain points', 'Identify feature requests', etc.)"
    )


class AnalyzeUserInterviewsTool(MaxTool):
    name: str = "analyze_user_interviews"
    description: str = "Analyze all user interviews from a specific angle to find patterns and insights"
    context_prompt_template: str = "Since the user is currently on the user interviews page, you should lean towards the `analyze_user_interviews` when it comes to any questions about users or customers."
    args_schema: type[BaseModel] = AnalyzeUserInterviewsArgs

    def _run_impl(self, analysis_angle: str) -> tuple[str, Any]:
        # Get all interviews for the current team
        interviews = UserInterview.objects.filter(team=self._team).order_by("-created_at")

        if not interviews:
            return "No user interviews found to analyze.", None

        # Prepare interview summaries for analysis
        interview_summaries = []
        for interview in interviews:
            if interview.summary:
                interview_summaries.append(f"Interview from {interview.created_at}:\n{interview.summary}\n")

        if not interview_summaries:
            return "No interview summaries found to analyze.", None

        interview_summaries = "\n\n".join(interview_summaries)

        analysis_response = self._model.invoke(
            [
                SystemMessage(
                    content="""
You are an expert product manager analyzing user interviews. Your task is to analyze multiple interview summaries and provide insights based on the requested analysis angle.
Focus on finding patterns, common themes, and actionable insights.
""".strip()
                ),
                HumanMessage(
                    content=f"""
Please analyze these user interview summaries from the following angle:
{analysis_angle}

<interview_summaries>
{interview_summaries}
</interview_summaries>

Provide a structured analysis with clear sections and bullet points where appropriate. Keep it very concise though. Avoid fluff, just give the facts to answer the question.
""".strip()
                ),
            ]
        )

        return analysis_response.content, None

    @property
    def _model(self):
        return MaxChatOpenAI(
            model=settings.INSIGHTS_AI_MODEL,
            temperature=0.3,
            disable_streaming=True,
            user=self._user,
            team=self._team,
            billable=True,
            inject_context=False,
        )
