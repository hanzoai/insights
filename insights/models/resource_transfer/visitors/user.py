from django.db import models

from insights.models.resource_transfer.visitors.base import ResourceTransferVisitor


class UserVisitor(ResourceTransferVisitor, kind="User", immutable=True, user_facing=False):
    @classmethod
    def get_model(cls) -> type[models.Model]:
        from insights.models import User

        return User
