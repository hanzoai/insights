from django.db import migrations


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("data_modeling", "0014_node_dag_fk"),
    ]

    operations = [
        migrations.RunSQL(
            sql='CREATE INDEX CONCURRENTLY IF NOT EXISTS "insights_datamodelingedge_dag_fk_id_af85451c" ON "insights_datamodelingedge" ("dag_fk_id");',
            reverse_sql='DROP INDEX CONCURRENTLY IF EXISTS "insights_datamodelingedge_dag_fk_id_af85451c";',
        ),
        migrations.RunSQL(
            sql='CREATE INDEX CONCURRENTLY IF NOT EXISTS "insights_datamodelingnode_dag_fk_id_a152d589" ON "insights_datamodelingnode" ("dag_fk_id");',
            reverse_sql='DROP INDEX CONCURRENTLY IF EXISTS "insights_datamodelingnode_dag_fk_id_a152d589";',
        ),
    ]
