from django.db import models


class Recipe(models.Model):
    """
    Recipe: belongs to one Category and one User (author). N:1 with both.
    Instructions store HTML from Tiptap editor.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        REVIEW = "review", "Review"
        FINAL = "final", "Final"

    name_en = models.CharField(max_length=200)
    name_ar = models.CharField(max_length=200, blank=True)
    sku = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="recipes",
    )
    storage_unit = models.CharField(max_length=50, blank=True)
    net_weight = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    instructions = models.TextField(blank=True)  # HTML from Tiptap
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="recipes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_en


class RecipeIngredient(models.Model):
    """
    Join table: Recipe M:N Ingredient. One quantity per (recipe, ingredient).
    Unique (recipe, ingredient) prevents duplicate ingredients in a recipe.
    Unit comes from Ingredient.unit.
    """
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="recipe_ingredients",
    )
    ingredient = models.ForeignKey(
        "ingredients.Ingredient",
        on_delete=models.CASCADE,
        related_name="recipe_ingredients",
    )
    quantity = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["recipe", "ingredient"],
                name="unique_recipe_ingredient",
            )
        ]

    def __str__(self):
        return f"{self.recipe.name_en} — {self.ingredient.name_en}"


class ReviewRequest(models.Model):
    """
    Recipe review workflow: one Recipe, requested by one User, reviewed by one User.
    N:1 with Recipe; N:1 with User (requested_by and reviewed_by).
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="review_requests",
    )
    requested_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="review_requests_requested",
    )
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="review_requests_reviewed",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    comments = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Review #{self.pk} — {self.recipe.name_en} ({self.status})"
