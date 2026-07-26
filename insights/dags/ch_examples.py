import dagster

from insights.datastore.client import sync_execute  # noqa


class DatastoreConfig(dagster.Config):
    result_path: str = "/tmp/datastore_version.txt"


@dagster.asset
def get_datastore_version(config: DatastoreConfig) -> dagster.MaterializeResult:
    version = sync_execute("SELECT version()")[0][0]
    with open(config.result_path, "w") as f:
        f.write(version)

    return dagster.MaterializeResult(metadata={"version": version})


@dagster.asset(deps=[get_datastore_version])
def print_datastore_version(config: DatastoreConfig):
    with open(config.result_path) as f:
        print(f.read())  # noqa

    return dagster.MaterializeResult(metadata={"version": config.result_path})
