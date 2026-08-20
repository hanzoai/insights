from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase

from parameterized import parameterized

from insights.middleware import ApiRewriteMiddleware
from insights.mount import canonical


class TestCanonical(SimpleTestCase):
    @parameterized.expand(
        [
            ("api path", "/api/projects/1/insights/", "/v1/projects/1/insights/"),
            ("bare prefix", "/api", "/v1"),
            # Not just /api/: unknown paths have to keep landing on the `^v1.+` wall in
            # urls.py, which answers JSON, rather than falling through to the SPA's HTML.
            ("unknown api-ish path", "/apifoo", "/v1foo"),
            ("already canonical", "/v1/projects/1/", "/v1/projects/1/"),
            ("not the api", "/static/insights.js", "/static/insights.js"),
            ("shares a prefix but is not the api", "/apiary/", "/v1ary/"),
            # Released Wizard and Raycast builds send these as their OAuth client_id and
            # OAuthApplication rows are keyed by the string, so rewriting them would 404
            # the document those clients authenticate against.
            ("frozen wizard client_id", "/api/oauth/wizard/client-metadata", "/api/oauth/wizard/client-metadata"),
            ("frozen raycast client_id", "/api/oauth/raycast/client-metadata", "/api/oauth/raycast/client-metadata"),
            ("frozen, trailing slash", "/api/oauth/wizard/client-metadata/", "/api/oauth/wizard/client-metadata/"),
        ]
    )
    def test_canonical(self, _name, path, expected):
        self.assertEqual(canonical(path), expected)

    def test_canonical_is_idempotent(self):
        once = canonical("/api/projects/1/")
        self.assertEqual(canonical(once), once)


class TestApiRewriteMiddleware(SimpleTestCase):
    def _run(self, path):
        seen = {}

        def get_response(request):
            seen["path"] = request.path
            seen["path_info"] = request.path_info
            seen["meta"] = request.META["PATH_INFO"]
            return HttpResponse("ok")

        ApiRewriteMiddleware(get_response)(RequestFactory().get(path))
        return seen

    def test_all_three_path_fields_move_together(self):
        # Resolution reads path_info and logging reads path; if they disagree the request
        # is routed as one path and reported as another.
        self.assertEqual(self._run("/api/projects/1/"), dict.fromkeys(("path", "path_info", "meta"), "/v1/projects/1/"))

    def test_a_frozen_path_is_left_alone(self):
        seen = self._run("/api/oauth/wizard/client-metadata")
        self.assertEqual(seen["path"], "/api/oauth/wizard/client-metadata")
