from django.urls import path

from . import views

urlpatterns = [
    path("", views.RecipeListView.as_view(), name="recipe-list"),
    path("<int:pk>/", views.RecipeDetailView.as_view(), name="recipe-detail"),
    path(
        "<int:pk>/send-request/",
        views.SendRequestView.as_view(),
        name="recipe-send-request",
    ),
    path("<int:pk>/reject/", views.RejectView.as_view(), name="recipe-reject"),
    path("<int:pk>/finalize/", views.FinalizeView.as_view(), name="recipe-finalize"),
]
