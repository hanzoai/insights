"""Enrichment provider interface.

The interface keeps the enrichment core provider-agnostic. This fork ships no
firmographic provider: the only implementation looked companies up through an
enterprise-licensed client that is not carried here, so a domain lookup has no
source and `enrich_organization` has no caller from the signup workflow. The seam
stays because the Clay bridge and the scoring path are built on it.
"""

import abc
import dataclasses
from typing import Any, Optional

from products.growth.backend.enrichment.fields import EnrichmentFields


@dataclasses.dataclass
class ProviderLookup:
    """One provider lookup: the transformed fields plus the raw response kept for the archive.

    `fields` is None on a not-found. `raw_payload` is the provider's verbatim response for the
    company, or None when the provider returns nothing at all for a miss.
    """

    fields: Optional[EnrichmentFields]
    raw_payload: Optional[dict[str, Any]]


class EnrichmentProvider(abc.ABC):
    """Looks up firmographic enrichment for a single company by domain."""

    name: str

    @abc.abstractmethod
    async def enrich_by_domain(self, domain: str) -> ProviderLookup:
        """Return the fields and raw payload for a domain; fields is None when not found.

        Raises on operational failure (network, provider outage) so the caller can retry
        and alert, rather than conflating an outage with a genuine not-found.
        """
