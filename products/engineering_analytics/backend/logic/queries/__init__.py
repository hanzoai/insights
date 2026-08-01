"""InsightsQL queries for engineering_analytics.

Each module embeds the curated query builders (``backend/logic/views``) as
subqueries via ``_curated`` and runs them with ``execute_insightsql_query`` — the
product reads its data privately, never registering a global InsightsQL view. The raw
``github_*`` warehouse tables are named only inside those curated builders;
everything returned here is shaped into canonical contract types.
"""
