"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { clearAuth, hasPermission, type Permissions } from "@/lib/auth";
import LanguageToggle from "@/components/LanguageToggle";

const links: { href: string; labelKey: string; permission: keyof Permissions }[] = [
  { href: "/dashboard", labelKey: "dashboard", permission: "can_access_dashboard" },
  { href: "/recipes", labelKey: "recipes", permission: "can_access_recipes" },
  { href: "/ingredients", labelKey: "ingredients", permission: "can_manage_ingredients" },
  { href: "/categories", labelKey: "categories", permission: "can_manage_categories" },
  { href: "/roles", labelKey: "roles", permission: "can_manage_roles" },
  { href: "/users", labelKey: "users", permission: "can_manage_roles" },
];

export default function Nav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const visibleLinks = links.filter((link) => hasPermission(link.permission));
  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-800">
          {t("brand")}
        </Link>
        <ul className="flex items-center gap-6">
          {visibleLinks.map(({ href, labelKey }) => (
            <li key={href}>
              <Link
                href={href}
                className={
                  pathname === href
                    ? "font-medium text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }
              >
                {t(labelKey)}
              </Link>
            </li>
          ))}
          <li>
            <LanguageToggle />
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t("logout")}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
