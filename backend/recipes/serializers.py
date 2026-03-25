from rest_framework import serializers
from ingredients.models import Ingredient
from .models import Recipe, RecipeIngredient


class RecipeIngredientInputSerializer(serializers.Serializer):
    """Validate nested ingredient rows on create/update."""

    ingredient_id = serializers.IntegerField()
    quantity = serializers.DecimalField(
        max_digits=12, decimal_places=4, required=False, allow_null=True
    )

    def validate_ingredient_id(self, value):
        if not Ingredient.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Ingredient not found.")
        return value


class RecipeCreateSerializer(serializers.Serializer):
    """Create recipe with nested ingredients. Validates no duplicate ingredient_id."""

    name_en = serializers.CharField(max_length=200)
    name_ar = serializers.CharField(max_length=200, required=False, allow_blank=True)
    sku = serializers.CharField(max_length=50)
    category_id = serializers.IntegerField()
    storage_unit = serializers.CharField(max_length=50, required=False, allow_blank=True)
    net_weight = serializers.DecimalField(
        max_digits=10, decimal_places=3, required=False, allow_null=True
    )
    instructions = serializers.CharField(required=False, allow_blank=True)
    # ingredients = RecipeIngredientInputSerializer(many=True, write_only=True)

    def validate_sku(self, value):
        if Recipe.objects.filter(sku=value).exists():
            raise serializers.ValidationError("Recipe with this SKU already exists.")
        return value

    def validate_category_id(self, value):
        from categories.models import Category

        if not Category.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Category not found.")
        return value

    def validate_ingredients(self, value):
        if not value:
            raise serializers.ValidationError("At least one ingredient is required.")
        seen = set()
        for item in value:
            iid = item.get("ingredient_id")
            if iid in seen:
                raise serializers.ValidationError(
                    "Duplicate ingredient_id in ingredients list."
                )
            seen.add(iid)
        return value

    def create(self, validated_data):
        from categories.models import Category

        ingredients_data = validated_data.pop("ingredients")
        category = Category.objects.get(pk=validated_data["category_id"])
        validated_data.pop("category_id")
        recipe = Recipe.objects.create(
            category=category,
            author=self.context["request"].user,
            **validated_data,
        )
        for item in ingredients_data:
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient_id=item["ingredient_id"],
                quantity=item.get("quantity"),
            )
        return recipe


class RecipeIngredientReadSerializer(serializers.ModelSerializer):
    """Read representation of a recipe ingredient (for response)."""

    ingredient_id = serializers.IntegerField(source="ingredient.id")
    ingredient_name = serializers.CharField(source="ingredient.name_en", read_only=True)
    unit = serializers.CharField(source="ingredient.unit", read_only=True, allow_blank=True)

    class Meta:
        model = RecipeIngredient
        fields = ["ingredient_id", "ingredient_name", "quantity", "unit"]


class RecipeReadSerializer(serializers.ModelSerializer):
    """Read-only recipe with nested ingredients, category name, instructions (HTML)."""

    category_id = serializers.IntegerField(source="category.id", read_only=True)
    category_name = serializers.CharField(source="category.name_en", read_only=True)
    ingredients = RecipeIngredientReadSerializer(
        source="recipe_ingredients", many=True, read_only=True
    )

    class Meta:
        model = Recipe
        fields = [
            "id",
            "name_en",
            "name_ar",
            "sku",
            "category_id",
            "category_name",
            "storage_unit",
            "net_weight",
            "instructions",
            "status",
            "author",
            "created_at",
            "ingredients",
        ]


class RecipeUpdateSerializer(serializers.ModelSerializer):
    """Update recipe fields and ingredients."""

    category_id = serializers.IntegerField(required=False)
    ingredients = RecipeIngredientInputSerializer(many=True, required=False)

    class Meta:
        model = Recipe
        fields = [
            "name_en",
            "name_ar",
            "sku",
            "category_id",
            "storage_unit",
            "net_weight",
            "instructions",
            "ingredients",
        ]

    def validate_sku(self, value):
        qs = Recipe.objects.filter(sku=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Recipe with this SKU already exists.")
        return value

    def validate_category_id(self, value):
        if value is None:
            return value
        from categories.models import Category

        if not Category.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Category not found.")
        return value

    def validate_ingredients(self, value):
        if value is None:
            return value
        seen = set()
        for item in value:
            iid = item.get("ingredient_id")
            if iid in seen:
                raise serializers.ValidationError(
                    "Duplicate ingredient_id in ingredients list."
                )
            seen.add(iid)
        return value

    def update(self, instance, validated_data):
        from categories.models import Category

        ingredients_data = validated_data.pop("ingredients", None)
        category_id = validated_data.pop("category_id", None)

        if category_id is not None:
            instance.category = Category.objects.get(pk=category_id)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ingredients_data is not None:
            RecipeIngredient.objects.filter(recipe=instance).delete()
            for item in ingredients_data:
                RecipeIngredient.objects.create(
                    recipe=instance,
                    ingredient_id=item["ingredient_id"],
                    quantity=item.get("quantity"),
                )

        return instance
