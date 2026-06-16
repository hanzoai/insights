import os

from django.apps import AppConfig
from django.conf import settings

import structlog
import hanzo_insights
from asgiref.sync import async_to_sync
from hanzo_insights.client import Client

from insights.git import get_git_branch, get_git_commit_short
from insights.tasks.tasks import sync_all_organization_available_product_features
from insights.utils import get_instance_region, get_machine_id, initialize_self_capture_api_token, str_to_bool

logger = structlog.get_logger(__name__)


class InsightsConfig(AppConfig):
    name = "insights"
    label = "insights"
    verbose_name = "Insights"

    def ready(self):
        self._setup_lazy_admin()
        hanzo_insights.api_key = "sTMFPsFhdP1Ssg"
        hanzo_insights.personal_api_key = os.environ.get("INSIGHTS_PERSONAL_API_KEY")
        hanzo_insights.poll_interval = 90
        hanzo_insights.enable_exception_autocapture = True
        hanzo_insights.log_captured_exceptions = True
        hanzo_insights.super_properties = {
            "region": get_instance_region(),
            "service": settings.OTEL_SERVICE_NAME,
            "environment": os.getenv("OTEL_SERVICE_ENVIRONMENT"),
        }

        if str_to_bool(os.environ.get("TEMPORAL_DISABLE_EXCEPTION_VARIABLE_CAPTURE", "false")):
            hanzo_insights.capture_exception_code_variables = False
        else:
            hanzo_insights.capture_exception_code_variables = True

        if settings.E2E_TESTING:
            hanzo_insights.api_key = "hi_ex7Mnvi4DqeB6xSQoXU1UVPzAmUIpiciRKQQXGGTYQO"
            hanzo_insights.personal_api_key = None
        elif settings.TEST or os.environ.get("OPT_OUT_CAPTURE", False):
            hanzo_insights.disabled = True
        elif settings.DEBUG:
            # In dev, analytics is by default turned to self-capture, i.e. data going into this very instance of Insights
            # Due to ASGI's workings, we can't query for the right project API key in this `ready()` method
            # Instead, we configure self-capture with `self_capture_wrapper()` in insights/asgi.py - see that file
            # Self-capture for WSGI is initialized here
            hanzo_insights.disabled = True
            logger.info(
                "insights_config_ready",
                settings_debug=settings.DEBUG,
                server_gateway_interface=settings.SERVER_GATEWAY_INTERFACE,
            )
            if settings.SERVER_GATEWAY_INTERFACE == "WSGI":
                async_to_sync(initialize_self_capture_api_token)()

            # log development server launch to insights
            if os.getenv("RUN_MAIN") == "true":
                # Sync all organization.available_product_features once on launch, in case plans changed
                sync_all_organization_available_product_features()

                # NOTE: This has to be created as a separate client so that the "capture" call doesn't lock in the properties
                phcloud_client = Client(hanzo_insights.api_key)

                phcloud_client.capture(
                    distinct_id=get_machine_id(),
                    event="development server launched",
                    properties={"git_rev": get_git_commit_short(), "git_branch": get_git_branch()},
                )
        # load feature flag definitions if not already loaded
        if not hanzo_insights.disabled and hanzo_insights.feature_flag_definitions() is None:
            hanzo_insights.load_feature_flags()

        from insights.async_migrations.setup import setup_async_migrations

        if settings.SKIP_ASYNC_MIGRATIONS_SETUP:
            logger.warning("Skipping async migrations setup. This is unsafe in production!")
        else:
            setup_async_migrations()

        from insights.api.file_system import registrations as file_system_registrations
        from insights.tasks.insights_functions import queue_sync_insights_function_templates

        # Skip during tests since we handle this in conftest.py
        if not settings.TEST:
            queue_sync_insights_function_templates()

        file_system_registrations.register_core_file_system_types()

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

            # Override only the essential methods that trigger loading
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

        # Don't use lazy loading in tests and migrations
        if not settings.TEST and "migrate" not in sys.argv and "test" not in sys.argv:
            admin.site._registry = LazyAdminRegistry()
