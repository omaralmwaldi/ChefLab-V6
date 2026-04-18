from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from accounts.permissions import CanAccessRecipes, has_permission

from .models import Recipe
from .serializers import RecipeReadSerializer, RecipeWriteSerializer


class RecipeListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, CanAccessRecipes]

    def get_queryset(self):
        queryset = Recipe.objects.select_related("created_by").prefetch_related(
            "sections__allowed_roles",
            "sections__ingredients__ingredient",
        )
        status_filter = self.request.query_params.get("status")
        can_access_draft = has_permission(self.request.user, "can_access_draft_recipe")

        if status_filter in {Recipe.Status.DRAFT, Recipe.Status.FINAL}:
            if status_filter == Recipe.Status.DRAFT and not can_access_draft:
                raise PermissionDenied("You do not have permission to access draft recipes.")
            queryset = queryset.filter(status=status_filter)
        elif not can_access_draft:
            queryset = queryset.exclude(status=Recipe.Status.DRAFT)

        return queryset.order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return RecipeWriteSerializer
        return RecipeReadSerializer

    def create(self, request, *args, **kwargs):
        if not has_permission(request.user, "can_create_recipe"):
            raise PermissionDenied("You do not have permission to create recipes.")
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        recipe = serializer.save()
        read_serializer = RecipeReadSerializer(recipe, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class RecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, CanAccessRecipes]

    def get_queryset(self):
        return Recipe.objects.select_related("created_by").prefetch_related(
            "sections__allowed_roles",
            "sections__ingredients__ingredient",
        )

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return RecipeWriteSerializer
        return RecipeReadSerializer

    def get_object(self):
        instance = super().get_object()
        if (
            instance.status == Recipe.Status.DRAFT
            and not has_permission(self.request.user, "can_access_draft_recipe")
        ):
            raise PermissionDenied("You do not have permission to access draft recipes.")
        return instance

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        if instance.status == Recipe.Status.FINAL:
            raise PermissionDenied("Final recipes cannot be updated.")
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        recipe = serializer.save()
        read_serializer = RecipeReadSerializer(recipe, context={"request": request})
        return Response(read_serializer.data)
