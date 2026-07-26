from datastore_orm import migrations

from insights.models.channel_type.sql import add_missing_channel_types

operations = [
    migrations.RunPython(add_missing_channel_types),
]
