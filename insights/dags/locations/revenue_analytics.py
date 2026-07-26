import dagster

from products.revenue_analytics.dags import exchange_rate

from . import resources

defs = dagster.Definitions(
    assets=[
        exchange_rate.daily_exchange_rates,
        exchange_rate.hourly_exchange_rates,
        exchange_rate.daily_exchange_rates_in_datastore,
        exchange_rate.hourly_exchange_rates_in_datastore,
    ],
    jobs=[
        exchange_rate.daily_exchange_rates_job,
        exchange_rate.hourly_exchange_rates_job,
    ],
    schedules=[
        exchange_rate.daily_exchange_rates_schedule,
        exchange_rate.hourly_exchange_rates_schedule,
    ],
    resources=resources,
)
