
import pytest

import pydantic

from insights.dags.backfill_materialized_column import (
    MaterializationConfig,
    PartitionRange,
    join_mappings,
)


def test_join_mappings():
    assert join_mappings({}) == {}

    assert join_mappings({1: {"a": 1}}) == {"a": {1: 1}}

    # overlapping keys
    assert join_mappings({1: {"a": 1}, 2: {"a": 2}}) == {"a": {1: 1, 2: 2}}

    # non-overlapping keys
    assert join_mappings({1: {"a": 1}, 2: {"b": 2}}) == {"a": {1: 1}, "b": {2: 2}}


def test_partition_range_validation():
    assert set(PartitionRange(lower="202401", upper="202403").iter_ids()) == {"202401", "202402", "202403"}

    with pytest.raises(pydantic.ValidationError):
        PartitionRange(lower="202403", upper="202401")  # lower > upper

    with pytest.raises(pydantic.ValidationError):
        PartitionRange(lower="", upper="202403")

    with pytest.raises(pydantic.ValidationError):
        PartitionRange(lower="202401", upper="")


def test_materialization_config_force_default():
    # Test that force defaults to False
    config = MaterializationConfig(
        table="test_table",
        columns=["test_column"],
        indexes=[],
        partitions=PartitionRange(lower="202401", upper="202403"),
    )
    assert config.force is False


