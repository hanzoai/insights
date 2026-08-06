import dataclasses
from typing import Optional

from insights.models.activity_logging.activity_log import ActivityContextBase


@dataclasses.dataclass(frozen=True)
class EndpointContext(ActivityContextBase):
    id: Optional[int] = None
    version: Optional[int] = None
