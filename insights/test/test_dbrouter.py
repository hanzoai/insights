from insights.test.base import BaseTest

from insights.dbrouter import ReplicaRouter
from insights.models.team import Team
from insights.models.user import User


class TestReplicaRouter(BaseTest):
    def test_opted_in_models_are_replica_routed(self) -> None:
        router = ReplicaRouter(["User"])

        self.assertEqual(router.db_for_write(User), "default")

        self.assertEqual(router.db_for_read(User), "replica")
        self.assertEqual(router.db_for_read(Team), "default")  # not opted in = not routed
