import typing
import dataclasses
from datetime import UTC, datetime

from structlog.contextvars import bind_contextvars
from temporalio import activity

from insights.temporal.common.logger import get_logger

LOGGER = get_logger(__name__)


@dataclasses.dataclass
class CheckBillingLimitsActivityInputs:
    team_id: int
    job_id: str

    @property
    def properties_to_log(self) -> dict[str, typing.Any]:
        return {
            "team_id": self.team_id,
            "job_id": self.job_id,
        }


# To be removed after 2025-11-06
dwh_pricing_free_period_start = datetime(2025, 10, 29, 0, 0, 0, tzinfo=UTC)
dwh_pricing_free_period_end = datetime(2025, 11, 6, 0, 0, 0, tzinfo=UTC)


@activity.defn
def check_billing_limits_activity(inputs: CheckBillingLimitsActivityInputs) -> bool:
    """Whether this sync should stop because the team is over its synced-rows quota.

    Quotas are set and enforced by the billing service, an enterprise feature this fork
    does not carry, so no team has a rows-synced limit to exceed and no sync is cancelled
    on billing grounds. The activity stays because the import workflow gates on it.
    """
    bind_contextvars(team_id=inputs.team_id)
    return False
