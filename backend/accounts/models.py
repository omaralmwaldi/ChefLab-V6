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
    """User role (e.g. author, reviewer, admin)."""

    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    """
    Custom user: one Role per user (N:1 with Role).
    Email used for login.
    """

    username = models.CharField(max_length=150, blank=True, null=True, unique=False)
    email = models.EmailField(unique=True)
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="users",
        null=True,
        blank=True,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
