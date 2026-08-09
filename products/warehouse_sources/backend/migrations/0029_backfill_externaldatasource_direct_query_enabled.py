import time

from django.db import migrations

BATCH_SIZE = 2000


def forwards(apps, schema_editor):
    ExternalDataSource = apps.get_model("warehouse_sources", "ExternalDataSource")
    # 0028 defaulted every row to True. Opt existing synced sources out so the capability gate only
    # lights up sources a user explicitly enables; direct sources keep True. Batch so we never hold
    # row locks across the whole table at once — updated rows fall out of the filter, advancing the loop.
    while True:
        batch_ids = list(
            ExternalDataSource.objects.filter(access_method="warehouse", direct_query_enabled=True).values_list(
                "id", flat=True
            )[:BATCH_SIZE]
        )
        if not batch_ids:
            break
        ExternalDataSource.objects.filter(id__in=batch_ids).update(direct_query_enabled=False)
        time.sleep(0.1)


class Migration(migrations.Migration):
    dependencies = [
        ("warehouse_sources", "0028_externaldatasource_direct_query_enabled"),
        # `access_method` is filtered on below, and it is `data_warehouse` that adds it:
        # `insights_externaldatasource` is shaped by both apps' chains, and nothing orders
        # them against each other, so on a fresh install this ran first and died at
        # `column insights_externaldatasource.access_method does not exist`. Every database
        # that already ran this had the column by then, which is why only a fresh build sees
        # it. Naming the migration that adds the column is the ordering.
        ("data_warehouse", "0026_externaldatasource_access_method"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop, elidable=True),
    ]
