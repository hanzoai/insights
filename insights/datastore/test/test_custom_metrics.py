from collections.abc import Iterator

import pytest
from insights.test.base import reset_datastore_database

from insights.datastore.cluster import DatastoreCluster, Query, get_cluster
from insights.datastore.custom_metrics import MetricsClient


@pytest.fixture
def cluster(django_db_setup) -> Iterator[DatastoreCluster]:
    reset_datastore_database()
    try:
        yield get_cluster()
    finally:
        reset_datastore_database()


def test_custom_metrics_counters(cluster: DatastoreCluster) -> None:
    metrics = MetricsClient(cluster)

    query = Query(
        "SELECT name, type, labels, value FROM custom_metrics WHERE name = %(name)s",
        {"name": "example"},
    )

    metrics.increment("example").result()
    assert cluster.any_host(query).result() == [
        ("example", "counter", {}, 1.0),
    ]

    metrics.increment("example", value=2).result()
    assert cluster.any_host(query).result() == [
        ("example", "counter", {}, 3.0),
    ]

    metrics.increment("example", labels={"a": "1"}).result()
    assert cluster.any_host(query).result() == [
        ("example", "counter", {}, 3.0),
        ("example", "counter", {"a": "1"}, 1.0),
    ]
