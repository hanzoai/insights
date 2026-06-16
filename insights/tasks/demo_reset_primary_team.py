from django.db import transaction

from insights.demo.matrix import MatrixManager
from insights.demo.products import HedgeboxMatrix


def demo_reset_primary_team() -> None:
    matrix = HedgeboxMatrix()
    manager = MatrixManager(matrix)
    with transaction.atomic():
        manager.reset_primary()
