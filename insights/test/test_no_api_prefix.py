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

# Other services' routes, which this app addresses as their owners serve them.
OTHER_SERVICES = {
    "insights/plugins/plugin_server_api.py": "insights-plugin CDP API",
    "insights/storage/recordings/block_storage.py": "insights-plugin recording API",
    "insights/tasks/commerce_billing.py": "commerce usage API",
    "insights/cdp/templates/customerio/template_customerio.py": "Customer.io",
    "products/desktop_recordings/backend/services/recall_client.py": "Recall.ai",
    "products/error_tracking/backend/api/git_provider_file_link_resolver.py": "GitLab",
    "insights/models/integration.py": "GitLab",
    "insights/temporal/data_imports/sources/zendesk/zendesk.py": "Zendesk",
    "insights/temporal/data_imports/sources/zendesk/settings.py": "Zendesk",
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
            if rel in OTHER_SERVICES or rel == "insights/test/test_no_api_prefix.py":
                continue
            try:
                text = path.read_text()
            except UnicodeDecodeError:
                continue
            for n, line in enumerate(text.splitlines(), 1):
                if CALL.search(line):
                    calls.append(f"{rel}:{n}: {line.strip()[:120]}")
        assert calls == [], "\n".join(calls[:50])
