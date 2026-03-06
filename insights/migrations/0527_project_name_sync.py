# Created manually

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("insights", "0526_remoteconfig")]

    operations = [
        migrations.RunSQL(
            """
            UPDATE insights_project AS proj
            SET name = team.name
            FROM insights_team AS team
            WHERE proj.id = team.project_id AND proj.name != team.name""",
            reverse_sql=migrations.RunSQL.noop,
            elidable=True,
        ),
    ]
