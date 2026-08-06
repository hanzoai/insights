import uuid
from typing import cast

import hanzo_insights
from langchain_core.runnables import RunnableConfig
from hanzo_insights.ai.langchain.callbacks import CallbackHandler
from rest_framework import status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response

from insights.api.documentation import _FallbackSerializer, extend_schema
from insights.api.routing import TeamAndOrgViewSetMixin
from insights.models.user import User


class FixInsightsQLViewSet(TeamAndOrgViewSetMixin, viewsets.ModelViewSet):
    scope_object = "INTERNAL"
    serializer_class = _FallbackSerializer

    @extend_schema(operation_id="fix_insightsql_list")
    def list(self, request: Request, *args, **kwargs) -> Response:
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def create(self, request: Request, *args, **kwargs) -> Response:
        from products.data_warehouse.backend.facade.api import InsightsQLQueryFixerTool

        query = request.data.get("query", None)
        error = request.data.get("error", "")

        if query is None:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"message": "No query provided"},
            )

        trace_id = f"fix_insightsql_query_{uuid.uuid4()}"
        user = cast(User, request.user)

        config: RunnableConfig = {
            "configurable": {
                "contextual_tools": {
                    "fix_insightsql_query": {
                        "insightsql_query": query,
                        "error_message": error,
                    }
                },
                "team": self.team,
                "user": user,
                "trace_id": trace_id,
                "distinct_id": user.distinct_id,
            },
            "callbacks": (
                [CallbackHandler(hanzo_insights.default_client, distinct_id=user.distinct_id, trace_id=trace_id)]
                if hanzo_insights.default_client
                else None
            ),
        }

        result = InsightsQLQueryFixerTool(
            team=self.team, user=user, config=config, tool_call_id="fix_insightsql_query_tool_call_id"
        ).invoke({})

        if result is None or (isinstance(result, str) and len(result) == 0):
            return Response({"trace_id": trace_id, "error": "Could not fix the query"}, status=400)

        return Response({"query": result, "trace_id": trace_id}, status=200)
