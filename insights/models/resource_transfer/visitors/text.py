from django.db import models

from insights.models.resource_transfer.visitors.base import ResourceTransferVisitor


class TextVisitor(ResourceTransferVisitor, kind="Text", excluded_fields=["last_modified_at"], user_facing=False):
    @classmethod
    def get_model(cls) -> type[models.Model]:
        from products.dashboards.backend.models.dashboard_tile import Text

        return Text
