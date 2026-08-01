from urllib.parse import urlparse


def resolve_mcp_url(*, sandbox_mcp_url: str | None, site_url: str | None) -> str | None:
    if sandbox_mcp_url:
        return sandbox_mcp_url
    if not site_url:
        return None

    hostname = urlparse(site_url).hostname or ""
    if hostname in ("app.hanzo.ai", "us.hanzo.ai"):
        return "https://mcp.hanzo.ai/mcp"
    if hostname == "eu.hanzo.ai":
        return "https://mcp-eu.hanzo.ai/mcp"
    if hostname == "app.dev.insights.dev":
        return "https://mcp.dev.insights.dev/mcp"
    if hostname in ("localhost", "127.0.0.1"):
        return "http://host.docker.internal:8787/mcp"

    return None
