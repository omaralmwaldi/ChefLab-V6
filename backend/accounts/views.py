from rest_framework import generics
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenObtainPairSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create user. Returns user data (no tokens)."""
    serializer_class = RegisterSerializer



class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — email + password. Returns access & refresh tokens."""
    serializer_class = CustomTokenObtainPairSerializer
