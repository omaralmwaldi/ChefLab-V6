const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const USER_KEY = "current_user";

export type Role = {
  id: number;
  name_en: string;
  name_ar: string;
  can_access_dashboard: boolean;
  can_access_recipes: boolean;
  can_create_recipe: boolean;
  can_access_draft_recipe: boolean;
  can_manage_ingredients: boolean;
  can_manage_categories: boolean;
  can_manage_roles: boolean;
};

export type Permissions = {
  can_access_dashboard: boolean;
  can_access_recipes: boolean;
  can_create_recipe: boolean;
  can_access_draft_recipe: boolean;
  can_manage_ingredients: boolean;
  can_manage_categories: boolean;
  can_manage_roles: boolean;
};

export type AuthUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: Role[];
  permissions?: Permissions;
};

export function setTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function setSession(access: string, refresh: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  setTokens(access, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function derivePermissionsFromRoles(user: AuthUser | null): Permissions {
  const roles = user?.roles ?? [];
  return {
    can_access_dashboard: roles.some((role) => role.can_access_dashboard),
    can_access_recipes: roles.some((role) => role.can_access_recipes),
    can_create_recipe: roles.some((role) => role.can_create_recipe),
    can_access_draft_recipe: roles.some((role) => role.can_access_draft_recipe),
    can_manage_ingredients: roles.some((role) => role.can_manage_ingredients),
    can_manage_categories: roles.some((role) => role.can_manage_categories),
    can_manage_roles: roles.some((role) => role.can_manage_roles),
  };
}

export function getCurrentPermissions(): Permissions {
  const user = getCurrentUser();
  if (user?.permissions) {
    return user.permissions;
  }
  return derivePermissionsFromRoles(user);
}

export function hasPermission(permissionName: keyof Permissions): boolean {
  return getCurrentPermissions()[permissionName];
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
