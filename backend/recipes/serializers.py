from rest_framework import serializers

from accounts.models import Role
from categories.models import Category
from ingredients.models import Ingredient

from .models import Recipe, RecipeSection, SectionIngredient
from .utils import generate_unique_sku


class SectionIngredientWriteSerializer(serializers.Serializer):
    ingredient_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)

    def validate_ingredient_id(self, value):
        if not Ingredient.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Ingredient not found.")
        return value


class SectionIngredientReadSerializer(serializers.ModelSerializer):
    ingredient_id = serializers.IntegerField(source="ingredient.id", read_only=True)
    ingredient_name = serializers.CharField(source="ingredient.name_en", read_only=True)

    class Meta:
        model = SectionIngredient
        fields = ["id", "ingredient_id", "ingredient_name", "quantity", "unit"]


class RecipeSectionWriteSerializer(serializers.Serializer):
    title_en = serializers.CharField(max_length=255)
    title_ar = serializers.CharField(max_length=255, required=False, allow_blank=True)
    instructions = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=False)
    allowed_roles = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    ingredients = SectionIngredientWriteSerializer(many=True, required=False)

    def validate_allowed_roles(self, value):
        role_ids = list(dict.fromkeys(value))
        roles_count = Role.objects.filter(id__in=role_ids).count()
        if roles_count != len(role_ids):
            raise serializers.ValidationError("Some selected roles do not exist.")
        return role_ids


class RecipeSectionReadSerializer(serializers.ModelSerializer):
    allowed_roles = serializers.SerializerMethodField()
    ingredients = SectionIngredientReadSerializer(many=True, read_only=True)

    class Meta:
        model = RecipeSection
        fields = [
            "id",
            "title_en",
            "title_ar",
            "instructions",
            "order",
            "allowed_roles",
            "ingredients",
        ]

    def get_allowed_roles(self, obj):
        return [
            {"id": role.id, "name_en": role.name_en, "name_ar": role.name_ar}
            for role in obj.allowed_roles.all()
        ]


class RecipeReadSerializer(serializers.ModelSerializer):
    created_by = serializers.IntegerField(source="created_by.id", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    category_id = serializers.IntegerField(source="category.id", read_only=True)
    category_name = serializers.CharField(source="category.name_en", read_only=True)
    sections = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            "id",
            "name_en",
            "name_ar",
            "sku",
            "category_id",
            "category_name",
            "unit",
            "net_weight",
            "status",
            "created_by",
            "created_by_email",
            "created_at",
            "sections",
        ]

    def get_sections(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        section_queryset = obj.sections.prefetch_related("allowed_roles", "ingredients__ingredient")
        if not user or not user.is_authenticated:
            return []

        if user == obj.created_by:
            visible_sections = section_queryset
        else:
            visible_sections = section_queryset.filter(allowed_roles__in=user.roles.all()).distinct()

        return RecipeSectionReadSerializer(visible_sections, many=True).data


class RecipeWriteSerializer(serializers.Serializer):
    name_en = serializers.CharField(max_length=255, required=False, allow_blank=True)
    name_ar = serializers.CharField(max_length=255, required=False, allow_blank=True)
    sku = serializers.CharField(max_length=50, required=False, allow_blank=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    unit = serializers.CharField(max_length=50, required=False, allow_blank=True)
    net_weight = serializers.FloatField(required=False, allow_null=True)
    sections = RecipeSectionWriteSerializer(many=True, required=False)
    finalize = serializers.BooleanField(required=False, default=False, write_only=True)

    def _build_default_section(self):
        all_role_ids = list(Role.objects.values_list("id", flat=True))
        if not all_role_ids:
            raise serializers.ValidationError({"sections": ["At least one role must exist to create a section."]})

        return [
            {
                "title_en": "Main Section",
                "title_ar": "",
                "instructions": "",
                "order": 1,
                "allowed_roles": all_role_ids,
                "ingredients": [],
            }
        ]

    def _save_sections(self, recipe, sections_data):
        RecipeSection.objects.filter(recipe=recipe).delete()

        for idx, section_data in enumerate(sections_data, start=1):
            allowed_role_ids = section_data.pop("allowed_roles")
            ingredients_data = section_data.pop("ingredients", [])
            order_value = section_data.get("order") or idx

            section = RecipeSection.objects.create(
                recipe=recipe,
                title_en=section_data["title_en"],
                title_ar=section_data.get("title_ar", ""),
                instructions=section_data.get("instructions", ""),
                order=order_value,
            )
            section.allowed_roles.set(allowed_role_ids)

            for ingredient_item in ingredients_data:
                ingredient = Ingredient.objects.get(pk=ingredient_item["ingredient_id"])
                SectionIngredient.objects.create(
                    section=section,
                    ingredient=ingredient,
                    quantity=ingredient_item.get("quantity"),
                    unit=ingredient.unit or "",
                )

    def create(self, validated_data):
        request = self.context["request"]
        sections_data = validated_data.pop("sections", None) or self._build_default_section()
        name_en = validated_data.get("name_en") or "Untitled Recipe"
        sku = validated_data.get("sku") or generate_unique_sku(Recipe)

        category = None
        if "category_id" in validated_data and validated_data.get("category_id") is not None:
            category = Category.objects.get(pk=validated_data["category_id"])

        recipe = Recipe.objects.create(
            name_en=name_en,
            name_ar=validated_data.get("name_ar", ""),
            sku=sku,
            category=category,
            unit=validated_data.get("unit", ""),
            net_weight=validated_data.get("net_weight"),
            status=Recipe.Status.DRAFT,
            created_by=request.user,
        )
        self._save_sections(recipe, sections_data)
        return recipe

    def update(self, instance, validated_data):
        sections_data = validated_data.pop("sections", None)
        finalize = validated_data.pop("finalize", False)

        if "name_en" in validated_data and validated_data["name_en"] != "":
            instance.name_en = validated_data["name_en"]
        if "name_ar" in validated_data:
            instance.name_ar = validated_data["name_ar"]
        if "unit" in validated_data:
            instance.unit = validated_data["unit"]
        if "net_weight" in validated_data:
            instance.net_weight = validated_data["net_weight"]

        if "category_id" in validated_data:
            category_id = validated_data["category_id"]
            instance.category = Category.objects.get(pk=category_id) if category_id else None

        if "sku" in validated_data:
            candidate_sku = validated_data["sku"]
            instance.sku = candidate_sku or generate_unique_sku(Recipe)

        if finalize:
            instance.status = Recipe.Status.FINAL

        instance.save()

        if sections_data is not None:
            self._save_sections(instance, sections_data)

        return instance

    def validate_sku(self, value):
        if value == "":
            return value

        queryset = Recipe.objects.filter(sku=value)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Recipe with this SKU already exists.")
        return value

    def validate_category_id(self, value):
        if value is None:
            return value
        if not Category.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Category not found.")
        return value
