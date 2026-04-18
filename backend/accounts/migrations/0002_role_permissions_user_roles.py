from django.db import migrations, models


def copy_user_role_to_many_to_many(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for user in User.objects.exclude(role_id=None):
        user.roles.add(user.role_id)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="role",
            old_name="name",
            new_name="name_en",
        ),
        migrations.AddField(
            model_name="role",
            name="name_ar",
            field=models.CharField(default="", max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="role",
            name="can_access_dashboard",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="role",
            name="can_access_recipes",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="role",
            name="can_manage_categories",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="role",
            name="can_manage_ingredients",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="role",
            name="can_manage_roles",
            field=models.BooleanField(default=False),
        ),
        migrations.RemoveField(
            model_name="role",
            name="description",
        ),
        migrations.AddField(
            model_name="user",
            name="roles",
            field=models.ManyToManyField(blank=True, related_name="users", to="accounts.role"),
        ),
        migrations.RunPython(copy_user_role_to_many_to_many, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="user",
            name="role",
        ),
    ]
