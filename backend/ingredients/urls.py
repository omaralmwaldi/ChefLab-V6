from django.urls import path

from . import views

urlpatterns = [
    path("", views.IngredientListCreateView.as_view(), name="ingredient-list-create"),
    path("<int:pk>/", views.IngredientDetailView.as_view(), name="ingredient-detail"),
]
