import { hasPermission, isAuthenticated, type Permissions } from "@/lib/auth";

type RouteRule = {
  matcher: RegExp;
  permission: keyof Permissions;
};

const routeRules: RouteRule[] = [
  { matcher: /^\/dashboard$/, permission: "can_access_dashboard" },
  { matcher: /^\/recipes(\/.*)?$/, permission: "can_access_recipes" },
  { matcher: /^\/ingredients$/, permission: "can_manage_ingredients" },
  { matcher: /^\/categories$/, permission: "can_manage_categories" },
  { matcher: /^\/roles$/, permission: "can_manage_roles" },
  { matcher: /^\/users(\/.*)?$/, permission: "can_manage_roles" },
];

export function canAccessPath(pathname: string): boolean {
  if (!isAuthenticated()) return false;
  const rule = routeRules.find((item) => item.matcher.test(pathname));
  if (!rule) return true;
  return hasPermission(rule.permission);
}

export function getDefaultAuthorizedPath(): string {
  if (hasPermission("can_access_dashboard")) return "/dashboard";
  if (hasPermission("can_access_recipes")) return "/recipes";
  if (hasPermission("can_manage_ingredients")) return "/ingredients";
  if (hasPermission("can_manage_categories")) return "/categories";
  if (hasPermission("can_manage_roles")) return "/roles";
  return "/login";
}
