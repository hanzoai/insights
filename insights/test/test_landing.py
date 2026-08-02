from django.test import Client

from insights.test.base import APIBaseTest


class TestLandingPage(APIBaseTest):
    """`/` is the app when signed in, the marketing landing when not.

    Anonymous `/` used to fall through to the catch-all and bounce straight to
    SSO, so the product had no public face: an unauthenticated visitor could
    only ever see a login screen.
    """

    def test_anonymous_root_renders_the_landing_page(self):
        response = Client().get("/")
        assert response.status_code == 200, f"expected the landing page, got {response.status_code}"
        assert "landing.html" in [t.name for t in response.templates]

    def test_anonymous_root_does_not_redirect_to_login(self):
        response = Client().get("/", follow=False)
        assert response.status_code != 302, "anonymous / must not bounce to SSO"

    def test_landing_ctas_point_at_surfaces_that_work(self):
        body = Client().get("/").content.decode()
        # Plans leave for the canonical pricing page on purpose: /api/billing is
        # not served by this app, so an in-app funnel would dead-end.
        assert "https://hanzo.ai/pricing" in body
        assert "https://github.com/hanzoai/insights" in body
        assert 'href="/login"' in body
        assert "/api/billing" not in body

    def test_landing_ships_no_third_party_assets(self):
        """Third-party CDNs are refused in prod and fail SILENTLY — a font that
        never loads leaves the page in system-ui with nothing in the logs."""
        body = Client().get("/").content.decode()
        for host in ("fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net", "unpkg.com", "cloudflare.com"):
            assert host not in body, f"third-party asset host {host} would be blocked in prod"

    def test_signed_in_root_still_serves_the_app(self):
        response = self.client.get("/")
        assert response.status_code == 200
        names = [t.name for t in response.templates]
        assert "landing.html" not in names, "a signed-in user must get the app, not marketing"

    def test_signed_in_root_is_unchanged_by_the_split(self):
        """The authenticated branch delegates to the same `home` view as before."""
        assert self.client.get("/").status_code == self.client.get("/project/1").status_code
