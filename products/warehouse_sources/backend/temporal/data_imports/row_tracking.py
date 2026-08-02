import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from django.conf import settings

from structlog.types import FilteringBoundLogger

from insights.exceptions_capture import capture_exception
from insights.redis import get_async_client

if TYPE_CHECKING:
    from products.warehouse_sources.backend.models.external_data_source import ExternalDataSource


def _get_hash_key(team_id: int) -> str:
    return f"insights:data_warehouse_row_tracking:{team_id}"


@asynccontextmanager
async def _get_redis():
    """Returns an async Redis client for row tracking operations."""
    redis = None
    try:
        if not settings.DATA_WAREHOUSE_REDIS_HOST or not settings.DATA_WAREHOUSE_REDIS_PORT:
            raise Exception(
                "Missing env vars for dwh row tracking: DATA_WAREHOUSE_REDIS_HOST or DATA_WAREHOUSE_REDIS_PORT"
            )

        redis = get_async_client(f"redis://{settings.DATA_WAREHOUSE_REDIS_HOST}:{settings.DATA_WAREHOUSE_REDIS_PORT}/")
        await redis.ping()
    except Exception as e:
        capture_exception(e)

    yield redis


async def setup_row_tracking(team_id: int, schema_id: uuid.UUID | str) -> None:
    async with _get_redis() as redis:
        if not redis:
            return

        await redis.hset(_get_hash_key(team_id), str(schema_id), 0)
        await redis.expire(_get_hash_key(team_id), 60 * 60 * 24 * 7)  # 7 day expire


async def increment_rows(team_id: int, schema_id: uuid.UUID | str, rows: int) -> None:
    async with _get_redis() as redis:
        if not redis:
            return

        await redis.hincrby(_get_hash_key(team_id), str(schema_id), rows)


async def decrement_rows(team_id: int, schema_id: uuid.UUID | str, rows: int) -> None:
    async with _get_redis() as redis:
        if not redis:
            return

        if not await redis.hexists(_get_hash_key(team_id), str(schema_id)):
            return

        value = await redis.hget(_get_hash_key(team_id), str(schema_id))
        if not value:
            return

        value_int = int(value)
        if value_int - rows < 0:
            await redis.hset(_get_hash_key(team_id), str(schema_id), 0)
        else:
            await redis.hincrby(_get_hash_key(team_id), str(schema_id), -rows)


async def finish_row_tracking(team_id: int, schema_id: uuid.UUID | str) -> None:
    async with _get_redis() as redis:
        if not redis:
            return

        await redis.hdel(_get_hash_key(team_id), str(schema_id))


async def get_rows(team_id: int, schema_id: uuid.UUID | str) -> int:
    async with _get_redis() as redis:
        if not redis:
            return 0

        if await redis.hexists(_get_hash_key(team_id), str(schema_id)):
            value = await redis.hget(_get_hash_key(team_id), str(schema_id))
            if value:
                return int(value)

        return 0


async def get_all_rows_for_team(team_id: int) -> int:
    async with _get_redis() as redis:
        if not redis:
            return 0

        pairs = await redis.hgetall(_get_hash_key(team_id))
        return sum(int(v) for v in pairs.values())


# To be removed after 2025-11-06
dwh_pricing_free_period_start = datetime(2025, 10, 29, 0, 0, 0, tzinfo=UTC)
dwh_pricing_free_period_end = datetime(2025, 11, 6, 0, 0, 0, tzinfo=UTC)


async def will_hit_billing_limit(team_id: int, source: "ExternalDataSource", logger: FilteringBoundLogger) -> bool:
    """Whether this sync would take the org past its billed row allowance.

    Always False: row allowances were read from the billing service, which this fork does not
    carry, so there is no limit for a sync to hit. This is what the function already returned,
    since the enterprise import it needed was never available.
    """
    return False
