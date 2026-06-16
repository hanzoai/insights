import dagster


from . import resources

defs = dagster.Definitions(
    assets=[job_switchers_to_clay, plo_base_targets, qualify_signals, plo_qualified_to_clay],
    jobs=[job_switchers_job, plo_job],
    schedules=[job_switchers_daily_schedule, plo_daily_schedule],
    resources=resources,
)
