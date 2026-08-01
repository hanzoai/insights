import os

from django.apps import AppConfig
from django.conf import settings

import structlog
import hanzo_insights
from asgiref.sync import async_to_sync
from hanzo_insights.client import Client

from insights.git import get_git_branch, get_git_commit_short
from insights.utils import (
    _build_flag_provider,
    get_available_timezones_with_offsets,
    get_instance_region,
    get_machine_id,
    initialize_self_capture_api_token,
    str_to_bool,
)

logger = structlog.get_logger(__name__)


class InsightsConfig(AppConfig):
    name = "insights"
    verbose_name = "Insights"

    def ready(self):
        # Route all JSONField (jsonb) decode through orjson before any query runs.
        if settings.JSONFIELD_ORJSON_DECODE:
            from insights.helpers.orjson_jsonfield import apply as apply_orjson_jsonfield  # noqa: PLC0415

            apply_orjson_jsonfield()

        import insights.storage.team_access_cache_signal_handlers  # noqa: F401
        from insights.storage.gateway_credential_signal_handlers import (
            connect_signal_handlers as connect_gateway_credential_signal_handlers,
        )
        from insights.storage.team_llm_gateway_policy_signal_handlers import connect_signal_handlers

        connect_signal_handlers()
        connect_gateway_credential_signal_handlers()

        # Connect core signal receivers at app-population. They used to wire in as an import
        # side effect of viewset modules; with the lazy API router those no longer load at
        # django.setup(), so a process that never builds the router (celery, temporal, migrate,
        # shell) would lose them. They live in dedicated import-light modules — never wire
        # ready() through an API module, even one that looks light today.
        import insights.storage.checks  # noqa: F401, PLC0415
        import insights.caching.organization_serializer_cache  # noqa: F401, PLC0415
        import insights.models.activity_logging.signal_handlers  # noqa: F401, PLC0415

        if settings.COMMAND_EXEC_AUDIT_ENABLED:
            from insights.security.command_exec_audit import install as install_command_exec_audit  # noqa: PLC0415

            install_command_exec_audit()

        self._setup_lazy_admin()
        self._prewarm_timezone_offsets_cache()
        hanzo_insights.api_key = "sTMFPsFhdP1Ssg"  # ty: ignore[invalid-assignment]
        # Fall back to DEV_API_KEY in debug so feature flags work locally without manual env setup.
        # DEV_API_KEY lives in ee/settings.py — getattr returns None in OSS mode.
        hanzo_insights.personal_api_key = os.environ.get(
            "POSTFN_PERSONAL_API_KEY",
            getattr(settings, "DEV_API_KEY", None) if settings.DEBUG else None,
        )
        hanzo_insights.poll_interval = 90  # ty: ignore[invalid-assignment]
        hanzo_insights.enable_exception_autocapture = True  # ty: ignore[invalid-assignment]
        hanzo_insights.log_captured_exceptions = True  # ty: ignore[invalid-assignment]
        hanzo_insights.super_properties = {  # ty: ignore[invalid-assignment]
            "region": get_instance_region(),
            "service": settings.OTEL_SERVICE_NAME,
            "environment": os.getenv("OTEL_SERVICE_ENVIRONMENT"),
        }
        hanzo_insights._use_ai_lane = True  # ty: ignore[invalid-assignment]
        hanzo_insights._enable_multimodal_capture = True  # ty: ignore[invalid-assignment]

        # Config for the SDK's `client.metrics` API. The pinned SDK version predates
        # the metrics API and ignores this attr; once hanzo_insights is bumped to
        # >=7.23 it's picked up by setup(), so metrics get a real service.name
        # instead of 'unknown_service'.
        hanzo_insights.metrics = {  # ty: ignore[invalid-assignment]
            # Same fallback as the OTel trace resource (otel_instrumentation.py) —
            # metrics and traces from one process must share a service identity.
            "service_name": settings.OTEL_SERVICE_NAME or "insights-django-default",
            "service_version": os.getenv("COMMIT_SHA"),
            "environment": os.getenv("OTEL_SERVICE_ENVIRONMENT"),
        }

        if str_to_bool(os.environ.get("TEMPORAL_DISABLE_EXCEPTION_VARIABLE_CAPTURE", "false")):
            hanzo_insights.capture_exception_code_variables = False
        else:
            hanzo_insights.capture_exception_code_variables = True  # ty: ignore[invalid-assignment]

        if settings.E2E_TESTING:
            hanzo_insights.api_key = "phc_ex7Mnvi4DqeB6xSQoXU1UVPzAmUIpiciRKQQXGGTYQO"  # ty: ignore[invalid-assignment]
            hanzo_insights.personal_api_key = None
        elif settings.TEST or os.environ.get("OPT_OUT_CAPTURE", False):
            hanzo_insights.disabled = True  # ty: ignore[invalid-assignment]
        elif settings.DEBUG:
            # In dev, analytics is by default turned to self-capture, i.e. data going into this very instance of Insights
            # Due to ASGI's workings, we can't query for the right project token in this `ready()` method
            # Instead, we configure self-capture with `self_capture_wrapper()` in insights/asgi.py - see that file
            # Self-capture for WSGI is initialized here
            hanzo_insights.disabled = True  # ty: ignore[invalid-assignment]
            logger.info(
                "insights_config_ready",
                settings_debug=settings.DEBUG,
                server_gateway_interface=settings.SERVER_GATEWAY_INTERFACE,
            )
            if settings.SERVER_GATEWAY_INTERFACE == "WSGI":
                async_to_sync(initialize_self_capture_api_token)()

            # log development server launch to insights
            if os.getenv("RUN_MAIN") == "true":
                # insights.tasks.__init__ is a celery autoimport aggregator: importing any
                # submodule loads every task module. Keep that off django.setup() for all
                # processes; celery workers get it via autodiscover_tasks().
                from insights.tasks.tasks import sync_all_organization_available_product_features  # noqa: PLC0415

                # Sync all organization.available_product_features once on launch, in case plans changed
                sync_all_organization_available_product_features()

                # NOTE: This has to be created as a separate client so that the "capture" call doesn't lock in the properties
                phcloud_client = Client(hanzo_insights.api_key)

                phcloud_client.capture(
                    distinct_id=get_machine_id(),
                    event="development server launched",
                    properties={"git_rev": get_git_commit_short(), "git_branch": get_git_branch()},
                )
        # Use HyperCache to provide flag definitions instead of per-process API polling.
        # Falls back to the SDK's emergency API fetch (via personal_api_key) only when
        # the cache is cold. In E2E testing personal_api_key is None, so a cold cache
        # will result in no flag definitions being loaded — which is acceptable there.
        if not hanzo_insights.disabled:
            hanzo_insights.flag_definition_cache_provider = _build_flag_provider()  # ty: ignore[invalid-assignment]

        # load feature flag definitions if not already loaded
        if not hanzo_insights.disabled and hanzo_insights.feature_flag_definitions() is None:
            hanzo_insights.load_feature_flags()

        from insights.async_migrations.setup import setup_async_migrations

        if settings.SKIP_ASYNC_MIGRATIONS_SETUP:
            logger.warning("Skipping async migrations setup. This is unsafe in production!")
        else:
            setup_async_migrations()

        from insights.api.file_system import registrations as file_system_registrations

        from products.cdp.backend.tasks.insights_functions import queue_sync_insights_function_templates

        # Skip during tests since we handle this in conftest.py
        # Skip during collectstatic (STATIC_COLLECTION=1 in Dockerfile) — no Redis available at build time
        if not settings.TEST and not settings.STATIC_COLLECTION:
            queue_sync_insights_function_templates()

        file_system_registrations.register_core_file_system_types()

    def _prewarm_timezone_offsets_cache(self):
        # The pytz walk in get_available_timezones_with_offsets is hourly-cached but
        # the cache is per-process. Without pre-warming, every fresh pod pays ~580ms
        # on its first preflight (the home view). Run it once at startup so the cache
        # is hot before any request lands. Skip during tests / static collection where
        # this would just slow setup with no benefit.
        if settings.TEST or settings.STATIC_COLLECTION:
            return
        try:
            get_available_timezones_with_offsets()
        except Exception:
            logger.warning("prewarm_timezone_offsets_cache_failure", exc_info=True)

    def _setup_lazy_admin(self):
        """Set up lazy loading of admin classes to avoid importing all at startup."""
        import sys

        from django.contrib import admin

        class LazyAdminRegistry(dict):
            """Lazy admin registry that loads admin on first access."""

            _loaded = False

            def _ensure_loaded(self):
                if not self._loaded:
                    from insights.admin import register_all_admin

                    self._loaded = True
                    register_all_admin()

            # `dict.items()`, `dict.values()`, and `dict.keys()` iterate the
            # underlying storage at the C level — they DO NOT call `__iter__`
            # or `__getitem__`. Django admin's `AdminSite.get_urls()` and
            # `_build_app_dict()` use `self._registry.items()` /
            # `self._registry.values()`, so without explicit overrides the
            # lazy load never fires from those code paths and admin URLs /
            # sidebar entries silently come back empty.
            #
            # Read methods are listed out explicitly rather than wrapped via
            # metaprogramming. The set is small, exhaustive against what
            # Django's admin actually calls, and grep-friendly. Wrapping
            # every dict method via `__getattribute__` or a class-time loop
            # would also have to carefully skip the write methods
            # (`__setitem__`, `__delitem__`) that `register_all_admin()`
            # depends on, plus our own `_ensure_loaded` / `_loaded` — adding
            # recursion footguns without removing real boilerplate.
            def __getitem__(self, key):
                self._ensure_loaded()
                return super().__getitem__(key)

            def __iter__(self):
                self._ensure_loaded()
                return super().__iter__()

            def __len__(self):
                self._ensure_loaded()
                return super().__len__()

            def __contains__(self, key):
                self._ensure_loaded()
                return super().__contains__(key)

            def keys(self):
                self._ensure_loaded()
                return super().keys()

            def values(self):
                self._ensure_loaded()
                return super().values()

            def items(self):
                self._ensure_loaded()
                return super().items()

            def get(self, key, default=None):
                self._ensure_loaded()
                return super().get(key, default)

        # Don't use lazy loading in tests and migrations
        if not settings.TEST and "migrate" not in sys.argv and "test" not in sys.argv:
            # Wrap the existing _registry rather than overwriting it. With
            # `SimpleAdminConfig` the dict is normally empty here (Django's
            # autodiscover is deferred to inside `register_all_admin()`), but
            # a third-party `AppConfig.ready()` could populate it before
            # `InsightsConfig.ready()` runs. The dict-copy constructor preserves
            # any such entries and only adds lazy-load semantics on top.
            admin.site._registry = LazyAdminRegistry(admin.site._registry)

        # Install the OAuth sidebar regrouping override eagerly. It must wrap
        # `get_app_list` before the first admin request — if it were installed
        # from inside `register_all_admin()` it would only land mid-call, after
        # the original method had already started executing.
        from insights.admin import install_admin_app_list_overrides

        install_admin_app_list_overrides()
