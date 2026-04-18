from django.db import migrations, models
import django.db.models.deletion


def backfill_sections(apps, schema_editor):
    Recipe = apps.get_model("recipes", "Recipe")
    RecipeIngredient = apps.get_model("recipes", "RecipeIngredient")
    RecipeSection = apps.get_model("recipes", "RecipeSection")
    SectionIngredient = apps.get_model("recipes", "SectionIngredient")
    Role = apps.get_model("accounts", "Role")

    all_role_ids = list(Role.objects.values_list("id", flat=True))

    section_by_recipe = {}
    for recipe in Recipe.objects.all():
        section = RecipeSection.objects.create(
            recipe=recipe,
            title="Main Section",
            instructions=getattr(recipe, "instructions", "") or "",
            order=1,
        )
        if all_role_ids:
            section.allowed_roles.set(all_role_ids)
        section_by_recipe[recipe.id] = section

    for row in RecipeIngredient.objects.select_related("ingredient", "recipe"):
        section = section_by_recipe.get(row.recipe_id)
        if not section:
            continue
        SectionIngredient.objects.create(
            section=section,
            ingredient_id=row.ingredient_id,
            quantity=row.quantity,
            unit=getattr(row.ingredient, "unit", "") or "",
        )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_role_name_en"),
        ("ingredients", "0001_initial"),
        ("recipes", "0002_alter_recipe_net_weight_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="recipe",
            old_name="author",
            new_name="created_by",
        ),
        migrations.RenameField(
            model_name="recipe",
            old_name="name_en",
            new_name="title",
        ),
        migrations.AlterField(
            model_name="recipe",
            name="status",
            field=models.CharField(
                choices=[("draft", "Draft"), ("final", "Final")],
                default="draft",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="RecipeSection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("instructions", models.TextField(blank=True)),
                ("order", models.PositiveIntegerField(default=1)),
                (
                    "recipe",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sections",
                        to="recipes.recipe",
                    ),
                ),
            ],
            options={"ordering": ["order", "id"]},
        ),
        migrations.CreateModel(
            name="SectionIngredient",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("unit", models.CharField(blank=True, max_length=50)),
                (
                    "ingredient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="section_ingredients",
                        to="ingredients.ingredient",
                    ),
                ),
                (
                    "section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ingredients",
                        to="recipes.recipesection",
                    ),
                ),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.AddField(
            model_name="recipesection",
            name="allowed_roles",
            field=models.ManyToManyField(related_name="recipe_sections", to="accounts.role"),
        ),
        migrations.RunPython(backfill_sections, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="recipe",
            name="category",
        ),
        migrations.RemoveField(
            model_name="recipe",
            name="instructions",
        ),
        migrations.RemoveField(
            model_name="recipe",
            name="name_ar",
        ),
        migrations.RemoveField(
            model_name="recipe",
            name="net_weight",
        ),
        migrations.RemoveField(
            model_name="recipe",
            name="storage_unit",
        ),
        migrations.DeleteModel(
            name="RecipeIngredient",
        ),
    ]
