from django.db import migrations, models


class Migration(migrations.Migration):
    """Add the column `insights.User.credentials_reviewed_at` has always declared.

    The field is read on every path that loads a User — Django selects all
    concrete fields — so while the column is absent, `User.objects.first()`
    raises ProgrammingError and every authenticated request fails, not only the
    ones about credentials.
    """

    dependencies = [
        ("insights", "0005_user_integration_and_push_token"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="credentials_reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
