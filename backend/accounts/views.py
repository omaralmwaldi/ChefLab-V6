from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from recipes.models import Recipe, RecipeSection

from .models import Role
from .permissions import CanManageRoles
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    RoleSerializer,
    UserCreateSerializer,
    UserManagementSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create user. Returns user data (no tokens)."""
    serializer_class = RegisterSerializer



class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — email + password. Returns access & refresh tokens."""
    serializer_class = CustomTokenObtainPairSerializer


class RoleListCreateView(generics.ListCreateAPIView):
    queryset = Role.objects.all().order_by("name_en")
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if role.users.exists():
            return Response(
                {"detail": "Cannot delete a role assigned to users."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent deleting roles that are tied to recipe records/sections.
        if Recipe.objects.filter(created_by__roles=role).exists() or RecipeSection.objects.filter(
            allowed_roles=role
        ).exists():
            return Response(
                {"detail": "Cannot delete role used in recipe sections."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageRoles]
    queryset = (
        get_user_model()
        .objects.all()
        .prefetch_related("roles")
        .order_by("id")
    )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserManagementSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]
    queryset = get_user_model().objects.all().prefetch_related("roles")
