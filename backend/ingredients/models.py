from django.db import models


class Ingredient(models.Model):
    """
    Ingredient master data. Linked to recipes via RecipeIngredient (M:N).
    Unit is stored here; RecipeIngredient stores only quantity.
    """

    name_en = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=50, unique=True)
    unit = models.CharField(max_length=50, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_en
