from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_role_name_en"),
    ]

    operations = [
        migrations.AddField(
            model_name="role",
            name="can_access_draft_recipe",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="role",
            name="can_create_recipe",
            field=models.BooleanField(default=False),
        ),
    ]
