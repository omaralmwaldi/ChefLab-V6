from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Role
from .permissions import has_permission


User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = [
            "id",
            "name_en",
            "name_ar",
            "can_access_dashboard",
            "can_access_recipes",
            "can_create_recipe",
            "can_access_draft_recipe",
            "can_manage_ingredients",
            "can_manage_categories",
            "can_manage_roles",
        ]


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation."""

    roles = RoleSerializer(many=True, read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "roles", "permissions"]
        read_only_fields = ["id", "username", "email", "roles", "permissions"]

    def get_permissions(self, obj):
        return {
            "can_access_dashboard": has_permission(obj, "can_access_dashboard"),
            "can_access_recipes": has_permission(obj, "can_access_recipes"),
            "can_create_recipe": has_permission(obj, "can_create_recipe"),
            "can_access_draft_recipe": has_permission(obj, "can_access_draft_recipe"),
            "can_manage_ingredients": has_permission(obj, "can_manage_ingredients"),
            "can_manage_categories": has_permission(obj, "can_manage_categories"),
            "can_manage_roles": has_permission(obj, "can_manage_roles"),
        }


class UserManagementSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        source="roles",
        many=True,
        queryset=Role.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password", "roles", "role_ids"]
        read_only_fields = ["id", "roles"]

    def validate_username(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        queryset = User.objects.filter(username=value)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Username must be unique.")
        return value

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required.")
        queryset = User.objects.filter(email=value)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Email must be unique.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        return user


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, allow_blank=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    roles = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Role.objects.all(),
        required=False,
    )

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username must be unique.")
        return value

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email must be unique.")
        return value

    def create(self, validated_data):
        username = validated_data["username"]
        password = validated_data["password"]
        email = validated_data["email"]
        roles = validated_data.get("roles", [])
        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")

        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        if roles:
            user.roles.set(roles)
        return user


class RegisterSerializer(serializers.ModelSerializer):
    """Registration: email, password, optional name fields."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    SimpleJWT login serializer.

    Since our User model sets USERNAME_FIELD = "email",
    SimpleJWT already expects: { "email": "...", "password": "..." }.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data