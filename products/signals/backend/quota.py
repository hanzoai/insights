"""Signals credit quota enforcement.

Signals credits were metered by the billing service, which this fork does not carry, so no team
is ever over quota. Kept as the single seam callers ask, so the answer lives in one place.
"""


def is_team_signals_quota_limited(team_api_token: str) -> bool:
    """Whether a team is currently over its Signals credits quota. Always False."""
    return False
