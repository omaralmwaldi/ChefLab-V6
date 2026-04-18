from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("roles/", views.RoleListCreateView.as_view(), name="role-list-create"),
    path("roles/<int:pk>/", views.RoleDetailView.as_view(), name="role-detail"),
    path("users/", views.UserListCreateView.as_view(), name="user-list-create"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user-detail"),
]
