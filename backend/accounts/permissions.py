from rest_framework.permissions import BasePermission

from .models import Role


def has_permission(user, permission_name: str) -> bool:
    """Return True if user has at least one role with permission enabled."""
    if not user or not user.is_authenticated:
        return False
    if not permission_name:
        return False
    if user.is_superuser:
        return True
    if permission_name not in {field.name for field in Role._meta.fields}:
        return False
    return user.roles.filter(**{permission_name: True}).exists()


class RequiresRolePermission(BasePermission):
    """
    Generic DRF permission based on role boolean flags.
    Set `required_permission` in subclasses.
    """

    required_permission: str = ""

    def has_permission(self, request, view):
        return has_permission(request.user, self.required_permission)


class CanAccessDashboard(RequiresRolePermission):
    required_permission = "can_access_dashboard"


class CanAccessRecipes(RequiresRolePermission):
    required_permission = "can_access_recipes"


class CanCreateRecipe(RequiresRolePermission):
    required_permission = "can_create_recipe"


class CanAccessDraftRecipe(RequiresRolePermission):
    required_permission = "can_access_draft_recipe"


class CanManageIngredients(RequiresRolePermission):
    required_permission = "can_manage_ingredients"


class CanManageCategories(RequiresRolePermission):
    required_permission = "can_manage_categories"


class CanManageRoles(RequiresRolePermission):
    required_permission = "can_manage_roles"
