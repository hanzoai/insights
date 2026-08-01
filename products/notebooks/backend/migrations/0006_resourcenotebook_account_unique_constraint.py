from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("notebooks", "0005_resourcenotebook_account_indexes"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE "insights_resourcenotebook" ADD CONSTRAINT "insights_resourcenotebook_notebook_id_group_id_acc_7a017f67_uniq"
                UNIQUE USING INDEX "insights_resourcenotebook_notebook_id_group_id_acc_7a017f67_uniq"; -- existing-table-constraint-ignore
            """,
            reverse_sql="""
                ALTER TABLE "insights_resourcenotebook" DROP CONSTRAINT IF EXISTS "insights_resourcenotebook_notebook_id_group_id_acc_7a017f67_uniq";
            """,
        ),
    ]
