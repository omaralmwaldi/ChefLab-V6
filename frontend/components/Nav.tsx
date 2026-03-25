"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAuth } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recipes/create", label: "Create Recipe" },
  { href: "/draft-recipes", label: "Draft Recipe" },
  { href: "/review-recipes", label: "Review Recipes" },
  { href: "/final-recipes", label: "Final Recipes" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/categories", label: "Categories" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-800">
          ChefLab
        </Link>
        <ul className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={
                  pathname === href
                    ? "font-medium text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
