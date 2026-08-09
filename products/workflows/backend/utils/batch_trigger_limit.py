from django.conf import settings


def get_flow_batch_trigger_limit(team_id: int) -> int:
    if team_id in settings.Flow_BATCH_TRIGGER_ELEVATED_TEAM_IDS:
        return settings.Flow_BATCH_TRIGGER_LIMIT_ELEVATED
    return settings.Flow_BATCH_TRIGGER_LIMIT
