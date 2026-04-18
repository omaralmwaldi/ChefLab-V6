from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

# this class is for creating nomral user and superuser
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        # required email
        if not email:
            raise ValueError("Email is required")
        # normalize email to lowercase: TEST@GMAIL.COM -> test@gmail.com
        email = self.normalize_email(email) 
        # set default username to email if no username is provided
        extra_fields.setdefault("username", email)
        # create user with email and extra fields
        user = self.model(email=email, **extra_fields)
        # set password for user
        user.set_password(password)
        # save user to database
        user.save(using=self._db)
        # return user
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    """User role with explicit RBAC permissions."""

    name_en = models.CharField(max_length=100, unique=True)
    name_ar = models.CharField(max_length=100)
    can_access_dashboard = models.BooleanField(default=False)
    can_access_recipes = models.BooleanField(default=False)
    can_create_recipe = models.BooleanField(default=False)
    can_access_draft_recipe = models.BooleanField(default=False)
    can_manage_ingredients = models.BooleanField(default=False)
    can_manage_categories = models.BooleanField(default=False)
    can_manage_roles = models.BooleanField(default=False)

    def __str__(self):
        return self.name_en


class User(AbstractUser):
    """
    Custom user: many roles per user (M:N with Role).
    Email used for login.
    """

    username = models.CharField(max_length=150, blank=True, null=True, unique=False)
    email = models.EmailField(unique=True)
    roles = models.ManyToManyField(
        Role,
        related_name="users",
        blank=True,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def has_permission(self, permission_name: str) -> bool:
        """Return True if any assigned role grants the named permission."""
        if not permission_name:
            return False
        if self.is_superuser:
            return True
        return self.roles.filter(**{permission_name: True}).exists()

    def __str__(self):
        return self.email
