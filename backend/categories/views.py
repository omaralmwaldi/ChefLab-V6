from rest_framework import generics, permissions

from accounts.permissions import CanManageCategories
from .models import Category
from .serializers import CategorySerializer


class CategoryListCreateView(generics.ListCreateAPIView):
    """GET: list categories. POST: create category."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, CanManageCategories]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET: retrieve. PUT/PATCH: update. DELETE: delete."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, CanManageCategories]
