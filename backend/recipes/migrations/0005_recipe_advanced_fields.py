from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0001_initial"),
        ("recipes", "0004_alter_recipe_title"),
    ]

    operations = [
        migrations.RenameField(
            model_name="recipe",
            old_name="title",
            new_name="name_en",
        ),
        migrations.AddField(
            model_name="recipe",
            name="category",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="recipes",
                to="categories.category",
            ),
        ),
        migrations.AddField(
            model_name="recipe",
            name="name_ar",
            field=models.CharField(blank=True, default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="recipe",
            name="net_weight",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="recipe",
            name="unit",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.RenameField(
            model_name="recipesection",
            old_name="title",
            new_name="title_en",
        ),
        migrations.AddField(
            model_name="recipesection",
            name="title_ar",
            field=models.CharField(blank=True, default="", max_length=255),
            preserve_default=False,
        ),
    ]
