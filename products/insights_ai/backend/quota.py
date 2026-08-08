"""Insights AI credit quota.

AI credits were metered by the billing service, which this fork does not carry, so no team is ever
over budget. Kept as the single seam callers ask, so the answer lives in one place.

The spend half is real and stays: `insights.tasks.usage_report.get_teams_with_ai_credits_used_in_period`
totals what each team spent on `$ai_billable` generations. What left with the billing service is the
budget to compare that total against — it came with the plan, and
`Organization.available_product_features` records why nothing here sells one.

Callers gate on this before spending tokens and already fail open on a lookup error, so a False here
reads to them exactly as "asked, and the team is under budget".
"""


def is_team_over_ai_credit_budget(team_api_token: str) -> bool:
    """Whether a team has spent past its AI credit budget. Always False."""
    return False
