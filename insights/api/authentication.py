from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.views import redirect_to_login
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_http_methods

import structlog
from loginas.utils import is_impersonated_session, restore_original_login
from social_core.exceptions import AuthConnectionError, AuthFailed, AuthMissingParameter
from social_django.strategy import DjangoStrategy
from social_django.views import auth

from insights.event_usage import report_user_logged_in
from insights.helpers.user_devices import has_valid_known_device_cookie
from insights.models import User
from insights.models.activity_logging import signal_handlers  # noqa: F401
from insights.tasks.email import login_from_new_device_notification
from insights.utils import get_instance_available_sso_providers, get_ip_address, get_short_user_agent

logger = structlog.get_logger("insights.auth")


@require_http_methods(["POST"])
def logout(request):
    request.session.pop("reauth", None)

    if is_impersonated_session(request):
        impersonated_user_pk = request.user.pk
        restore_original_login(request)
        return redirect(f"/admin/insights/user/{impersonated_user_pk}/change/")

    auth_logout(request)

    next_url = request.POST.get("next")
    if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
        return redirect_to_login(next_url, login_url=settings.LOGIN_URL)

    return redirect(settings.LOGIN_URL)


def sso_login(request: HttpRequest, backend: str) -> HttpResponse:
    # The one known `connect_from` value is "insights_code" - what PH Code uses when linking GH profile to Insights user
    connect_from = (request.GET.get("connect_from") or "").strip()
    if not connect_from:
        # This is the default case - for regular login, we flush the session (log out)
        request.session.flush()
    else:
        # For linking a social provider, we keep the session and set the next URL to /account-connected/github-login
        # (see frontend AccountConnected). QueryDict must be copied before mutation (GET is often immutable).
        query_dict = request.GET.copy()
        query_dict["next"] = (
            f"/account-connected/github-login?{urlencode({'provider': backend, 'connect_from': connect_from})}"
        )
        request.GET = query_dict  # type: ignore[assignment]  # ty: ignore[invalid-assignment]

    sso_providers = get_instance_available_sso_providers()

    if backend not in sso_providers:
        return redirect("/login?error_code=invalid_sso_provider")

    if not sso_providers[backend]:
        return redirect("/login?error_code=improperly_configured_sso")

    try:
        return auth(request, backend)
    except (AuthFailed, AuthMissingParameter, AuthConnectionError) as e:
        # AuthConnectionError covers an unreachable IdP or a TLS cert that fails during OIDC discovery -
        # it's a sibling of AuthFailed (not a subclass), so it would otherwise surface as an unhandled 500.
        logger.warning("SSO login failed, redirecting to login page", exc_info=e)
        return redirect("/login?error_code=improperly_configured_sso")


def social_login_notification(
    strategy: DjangoStrategy, backend, user: User | None = None, is_new: bool = False, **kwargs
):
    """Final pipeline step to notify on OIDC login"""
    if not user:
        return

    if strategy.session_get("reauth") == "true":
        return

    # Trigger notification and event only on login
    if not is_new:
        report_user_logged_in(user, social_provider=getattr(backend, "name", ""))

        request = strategy.request
        if not has_valid_known_device_cookie(request, user):
            short_user_agent = get_short_user_agent(request)
            ip_address = get_ip_address(request)
            backend_name = getattr(backend, "name", "")
            login_from_new_device_notification.delay(
                user.id, timezone.now(), short_user_agent, ip_address, backend_name
            )
