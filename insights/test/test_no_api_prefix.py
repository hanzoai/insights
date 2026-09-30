"""The API is /v1/ only: nothing routes under /api/, and /api/ answers the JSON 404."""

from django.test import SimpleTestCase
from django.urls import Resolver404, get_resolver, resolve

from parameterized import parameterized

# Identifiers, not API surface: released Wizard and Raycast builds send these exact
# URLs as their OAuth client_id, and OAuthApplication rows are keyed by the string.
FROZEN = {"api/oauth/wizard/client-metadata", "api/oauth/raycast/client-metadata"}


def _patterns(resolver, prefix=""):
    for p in resolver.url_patterns:
        text = prefix + str(p.pattern)
        if hasattr(p, "url_patterns"):
            yield from _patterns(p, text)
        else:
            yield text, p


def _not_found():
    """The view an unknown API path resolves to, whatever decorates it."""
    return resolve("/v1/no-such-route-anywhere").func


class TestNoApiPrefix(SimpleTestCase):
    def test_no_route_lives_under_api(self):
        wall = _not_found()
        offenders = [
            text
            for text, p in _patterns(get_resolver())
            if text.lstrip("^").startswith("api")
            and text.lstrip("^").rstrip("$") not in FROZEN
            and p.callback is not wall
        ]
        self.assertEqual(offenders, [])

    @parameterized.expand([("/api/projects/1/insights/",), ("/api",), ("/api/users/@me/",)])
    def test_api_answers_the_api_404(self, path):
        try:
            match = resolve(path)
        except Resolver404:
            self.fail(f"{path} fell through to nothing; it must answer the JSON 404")
        self.assertIs(match.func, _not_found(), f"{path} resolved to {match.func.__name__}")
