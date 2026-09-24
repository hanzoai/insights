"""Every insights API path is /v1/. Nothing serves /api/, and nothing calls it.

Served: no URL pattern begins with `api`, and every path under /api/ resolves
to the JSON 404. Called: no source file names a path that begins with `api/`
or `/api/` on this app, in the frontend or the backend.

The only /api/ paths in source are other services' own routes, listed by file
below with the service they address.
"""

import re
from pathlib import Path

from django.test import SimpleTestCase
from django.urls import URLPattern, URLResolver, get_resolver, resolve

from insights.api import api_not_found

ROOT = Path(__file__).resolve().parents[2]

# A path literal that begins with api/ or /api/: not a segment of a longer path
# or of a host URL, and not a module path such as api/team.py.
CALL = re.compile(r"(?<![\w.\-/])/?api/(?![\w/]*\.py\b)")

SOURCES = {
    ".py": ["insights", "products", "common"],
    ".html": ["insights/templates", "frontend"],
    ".ts": ["frontend/src", "products", "common", "playwright"],
    ".tsx": ["frontend/src", "products", "common", "playwright"],
    ".js": ["frontend/src", "frontend/public", "products", "common", "playwright"],
    ".mjs": ["frontend/src", "products", "common", "playwright"],
}

SKIP_DIRS = {"node_modules", "dist", "migrations", "__pycache__", ".venv"}

# Other services' /api/ routes, which this app addresses as their owners serve
# them: file -> (the service, the text that names the route, or None for every
# match in the file).
OTHER_SERVICES: dict[str, tuple[str, str | None]] = {
    "insights/tasks/commerce_billing.py": ("commerce usage API", None),
    "insights/cdp/templates/customerio/template_customerio.py": ("Customer.io", None),
    "products/desktop_recordings/backend/services/recall_client.py": ("Recall.ai", None),
    "products/error_tracking/backend/api/git_provider_file_link_resolver.py": ("GitLab", None),
    "insights/models/integration.py": ("GitLab", None),
    "insights/temporal/data_imports/sources/zendesk/zendesk.py": ("Zendesk", None),
    "insights/temporal/data_imports/sources/zendesk/settings.py": ("Zendesk", None),
    "products/customer_analytics/frontend/queries/ZendeskTicketsQuery.tsx": ("Zendesk", "replace('/api/v2', '')"),
    "frontend/src/scenes/feature-flags/FeatureFlagCodeOptions.tsx": ("hanzo.ai docs", "${DOC_BASE_URL}api/flags"),
}


def _patterns(resolver: URLResolver, prefix: str = ""):
    for entry in resolver.url_patterns:
        route = prefix + str(entry.pattern)
        if isinstance(entry, URLResolver):
            yield from _patterns(entry, route)
        elif isinstance(entry, URLPattern):
            yield route, entry.callback


def _source_files():
    for suffix, dirs in SOURCES.items():
        for d in dirs:
            base = ROOT / d
            if not base.exists():
                continue
            for path in base.rglob(f"*{suffix}"):
                if SKIP_DIRS.intersection(path.parts):
                    continue
                yield path


class TestNoApiPrefix(SimpleTestCase):
    def test_no_route_begins_with_api(self):
        served = [
            route
            for route, callback in _patterns(get_resolver())
            if re.match(r"\^?/?api\b", route) and callback is not api_not_found
        ]
        assert served == []

    def test_every_api_path_is_a_404(self):
        for path in ["/api/users/@me/", "/api/projects/1/insights/", "/api/billing/", "/api/schema/", "/api"]:
            assert resolve(path).func is api_not_found, path

    def test_v1_serves_the_api(self):
        assert resolve("/v1/users/@me/").func is not api_not_found
        assert resolve("/v1/schema/").url_name == "schema"

    def test_no_source_calls_api(self):
        calls = []
        for path in _source_files():
            rel = path.relative_to(ROOT).as_posix()
            if rel == "insights/test/test_no_api_prefix.py":
                continue
            _service, needle = OTHER_SERVICES.get(rel, ("", ""))
            if needle is None:
                continue
            try:
                text = path.read_text()
            except UnicodeDecodeError:
                continue
            for n, line in enumerate(text.splitlines(), 1):
                if CALL.search(line) and not (needle and needle in line):
                    calls.append(f"{rel}:{n}: {line.strip()[:120]}")
        assert calls == [], "\n".join(calls[:50])
