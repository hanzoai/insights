import pytest
from insights.test.base import run_datastore_statement_in_parallel

from datastore_driver.errors import ServerException


def test_run_datastore_statement_in_parallel_propagates_errors():
    with pytest.raises(ServerException):
        run_datastore_statement_in_parallel(["SELECT invalid syntax!!!"])
