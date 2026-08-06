import json

from opentelemetry import trace
from rest_framework import request, response, viewsets
from rest_framework.exceptions import ValidationError

from insights.insightsql.database.schema.sessions import (
    get_lazy_session_table_properties,
    get_lazy_session_table_values,
)

from insights.api.routing import TeamAndOrgViewSetMixin
from insights.api.utils import action
from insights.rate_limit import DatastoreBurstRateThrottle, DatastoreSustainedRateThrottle
from insights.utils import convert_property_value, flatten

tracer = trace.get_tracer(__name__)


class SessionViewSet(
    TeamAndOrgViewSetMixin,
    viewsets.ViewSet,
):
    scope_object = "query"
    throttle_classes = [DatastoreBurstRateThrottle, DatastoreSustainedRateThrottle]
    scope_object_read_actions = ["property_definitions", "values"]

    @action(methods=["GET"], detail=False)
    def values(self, request: request.Request, **kwargs) -> response.Response:
        with tracer.start_as_current_span("session_api_property_values") as span:
            team = self.team

            key = request.GET.get("key")
            search_term = request.GET.get("value")

            if not key:
                raise ValidationError(detail=f"Key not provided")

            span.set_attribute("team_id", team.pk)
            span.set_attribute("property_key", key)
            span.set_attribute("has_search_term", search_term is not None)

            result = get_lazy_session_table_values(key, search_term=search_term, team=team)

            span.set_attribute("result_count", len(result))

            flattened = []
            for value in result:
                try:
                    # Try loading as json for dicts or arrays
                    flattened.append(json.loads(value[0]))
                except json.decoder.JSONDecodeError:
                    flattened.append(value[0])
            return response.Response([{"name": convert_property_value(value)} for value in flatten(flattened)])

    @action(methods=["GET"], detail=False)
    def property_definitions(self, request: request.Request, **kwargs) -> response.Response:
        search = request.GET.get("search")

        # unlike e.g. event properties, there's a very limited number of session properties,
        # so we can just return them all
        results = get_lazy_session_table_properties(search)
        return response.Response(
            {
                "count": len(results),
                "results": results,
            }
        )
