"""Where the HTTP API is mounted, and the one function that says a path that way.

The host is already api.*, so `/api/` on the path said the same thing twice. `/v1/` is
the mount. `/api/` is the older spelling, still on the wire from released CLI builds and
personal-API-key holders; `insights.middleware.ApiRewriteMiddleware` rewrites it once, at
the edge, so routing, CORS, gzip, rate limits and the impersonation guards below it only
ever see one spelling.

Deliberately free of imports: the ASGI wrapper in products/tasks reaches for `canonical`
above Django's middleware, and should not drag a middleware module in to get it.
"""

# Two paths keep saying /api/ because they are identifiers, not API surface: released
# Wizard and Raycast builds send these exact URLs as their OAuth client_id, and
# OAuthApplication rows are looked up by that string (insights/api/oauth/views.py). A
# client_id is public and permanent, so it cannot follow the mount.
FROZEN_PATHS = frozenset(
    {
        "/api/oauth/wizard/client-metadata",
        "/api/oauth/raycast/client-metadata",
    }
)


def canonical(path: str) -> str:
    """`/api/…` said the one way, `/v1/…`. Every other path comes back unchanged.

    The whole `/api` prefix moves, not just `/api/`, so `/apifoo` lands on `/v1foo` and
    still meets the API 404 wall in urls.py rather than falling through to the SPA.
    """
    if not path.startswith("/api") or path.rstrip("/") in FROZEN_PATHS:
        return path
    return "/v1" + path[len("/api") :]
