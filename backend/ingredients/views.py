from rest_framework import generics, permissions

from accounts.permissions import CanManageIngredients
from .models import Ingredient
from .serializers import IngredientSerializer


class IngredientListCreateView(generics.ListCreateAPIView):
    """GET: list ingredients. POST: create ingredient."""
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageIngredients]


class IngredientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET: retrieve. PUT/PATCH: update. DELETE: delete."""
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageIngredients]
