from typing import Any, Optional, TypedDict

from django.http.request import HttpRequest
from django.http.response import JsonResponse

import structlog
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response

from insights.datastore.query_tagging import get_query_tags
from insights.cloud_utils import is_cloud
from insights.exceptions_capture import capture_exception

logger = structlog.get_logger(__name__)


class RequestParsingError(Exception):
    pass


class UnspecifiedCompressionFallbackParsingError(Exception):
    pass


class QuotaLimitExceeded(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = "quota_limit_exceeded"
    default_detail = "Your organization reached its billing limit for this resource. Increase the limits in Billing settings, or ask an org admin to do so."


class EnterpriseFeatureException(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = "payment_required"

    def __init__(self, feature: Optional[str] = None) -> None:
        super().__init__(
            detail=(
                f"{feature.capitalize().replace('_', ' ') if feature else 'This feature'} is part of the premium Insights offering. "
                + (
                    "To use it, subscribe to Insights Cloud with a generous free tier."
                    if is_cloud()
                    else "Self-hosted licenses are no longer available for purchase. Please contact sales@hanzo.ai to discuss options."
                )
            )
        )


class PaidFeatureException(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = "payment_required"

    def __init__(self, feature: Optional[str] = None) -> None:
        feature_name = feature.capitalize().replace("_", " ") if feature else "This feature"
        super().__init__(detail=f"{feature_name} requires a paid Insights plan. Please upgrade to access this feature.")


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "conflict"


class DatabaseSchemaUnavailable(APIException):
    # The schema request backs the SQL editor's table list, so a bare 500 leaves the sidebar looking
    # like an empty project. A stable code lets the client tell "we couldn't read your schema" apart
    # from any other server error.
    status_code = 503
    default_detail = "Couldn't load your project's schema. Try again, and if it keeps happening contact support."
    default_code = "database_schema_unavailable"


class DatastoreAtCapacity(APIException):
    status_code = 503
    default_detail = (
        "Queries are a little too busy right now. We're working to free up resources. Please try again later."
    )


class DatastoreEstimatedQueryExecutionTimeTooLong(APIException):
    status_code = 512  # Custom error code
    default_detail = "Estimated query execution time is too long. Try reducing its scope by changing the time range."


class DatastoreQuerySizeExceeded(APIException):
    default_detail = "Query size exceeded."


class DatastoreQueryTimeOut(APIException):
    status_code = 504
    default_detail = "Query has hit the max execution time before completing. See our docs for how to improve your query performance. You may need to materialize."


class DatastoreQueryMemoryLimitExceeded(APIException):
    # Custom code in the actionable-validation family (400/512/513) the frontend routes to the
    # "problem with this query" panel. Distinct from 512 (query-too-slow) so an out-of-memory
    # failure is never mistaken for a timeout on either the client or in status-based alerting.
    status_code = 513
    # Stable machine-readable code so the frontend can recognise out-of-memory failures without
    # matching on the (translatable, changeable) detail copy. Keep in sync with the frontend
    # DATASTORE_MEMORY_LIMIT_ERROR_CODE constant.
    default_code = "datastore_memory_limit_exceeded"
    default_detail = "This query ran out of memory before it could finish, usually because it's scanning too much data. Try a shorter date range or narrower filters, or see our docs for more ways to speed it up: https://hanzo.ai/docs/product-analytics/troubleshooting#how-do-i-speed-up-my-insights-and-queries"
    # True only when Datastore hit this query's own memory ceiling, meaning a retry will fail
    # the same way. Server-wide and per-user limits are transient cluster pressure.
    is_per_query_limit = False


class ExceptionContext(TypedDict):
    request: HttpRequest


def exception_reporting(exception: Exception, context: ExceptionContext) -> Optional[str]:
    """
    Determines which exceptions to report and sends them to error tracking.
    Used through drf-exceptions-script
    """
    if not isinstance(exception, APIException):
        tags = get_query_tags().model_dump(exclude_none=True)
        logger.exception(exception, path=context["request"].path, **tags)
        return capture_exception(exception)
    return None


def generate_exception_response(
    endpoint: str,
    detail: Any,
    code: str = "invalid",
    type: str = "validation_error",
    attr: Optional[str] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> JsonResponse:
    """
    Generates a friendly JSON error response in line with drf-exceptions-script for endpoints not under DRF.
    """

    # Importing here because this module is loaded before Django settings are configured,
    # and statshog relies on those being ready
    from statshog.defaults.django import statsd

    statsd.incr(
        f"insights_cloud_raw_endpoint_exception",
        tags={"endpoint": endpoint, "code": code, "type": type, "attr": attr},
    )
    return JsonResponse({"type": type, "code": code, "detail": detail, "attr": attr}, status=status_code)


def exception_handler(exc: Exception, context: ExceptionContext) -> Optional[Response]:
    """
    Wraps drf-exceptions-script and, on 401, advertises the OAuth protected resource
    metadata document via WWW-Authenticate per RFC 9728, so that MCP-style agents
    can bootstrap from a stock 401.
    """
    # Imported lazily: exceptions_hog calls a non-lazy gettext at module import time,
    # which raises AppRegistryNotReady when insights.exceptions is imported during
    # manage.py bootstrap (before Django apps are loaded).
    from exceptions_hog import exception_handler as _exceptions_hog_handler

    # Imported lazily to avoid pulling settings into module import.
    from insights.utils import absolute_uri

    response = _exceptions_hog_handler(exc, context)
    if response is not None and response.status_code == status.HTTP_401_UNAUTHORIZED:
        # A view may pin its own challenge (e.g. the skills marketplace git endpoints, which
        # git clients can only satisfy with Basic — they cannot complete a Bearer/OAuth flow).
        view_challenge = getattr(context.get("view"), "www_authenticate_challenge", None)
        if view_challenge:
            # Strip CR/LF defensively — this is a view-supplied value, so never let it inject
            # additional response headers even if a future view derives it from request data.
            response["WWW-Authenticate"] = view_challenge.replace("\r", "").replace("\n", "")
        else:
            # Pin to SITE_URL rather than request.build_absolute_uri(): with permissive
            # ALLOWED_HOSTS, the Host header can otherwise steer the discovery hint to an
            # attacker-controlled origin.
            metadata_url = absolute_uri("/.well-known/oauth-protected-resource")
            response["WWW-Authenticate"] = f'Bearer resource_metadata="{metadata_url}"'
    return response
