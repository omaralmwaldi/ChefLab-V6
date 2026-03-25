from django.db import models


class Category(models.Model):
    """
    Recipe category. Each recipe belongs to one category (N:1 from Recipe).
    """

    name_en = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name_en
