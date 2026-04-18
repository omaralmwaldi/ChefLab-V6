from django.db import models


class Recipe(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        FINAL = "final", "Final"

    name_en = models.CharField(max_length=255)
    name_ar = models.CharField(max_length=255, blank=True)
    sku = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="recipes",
        null=True,
        blank=True,
    )
    unit = models.CharField(max_length=50, blank=True)
    net_weight = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="recipes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_en


class RecipeSection(models.Model):
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="sections",
    )
    title_en = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255, blank=True)
    instructions = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    allowed_roles = models.ManyToManyField("accounts.Role", related_name="recipe_sections")

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.recipe.name_en} - {self.title_en}"


class SectionIngredient(models.Model):
    section = models.ForeignKey(
        RecipeSection,
        on_delete=models.CASCADE,
        related_name="ingredients",
    )
    ingredient = models.ForeignKey(
        "ingredients.Ingredient",
        on_delete=models.PROTECT,
        related_name="section_ingredients",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.section.title_en} - {self.ingredient.name_en}"

