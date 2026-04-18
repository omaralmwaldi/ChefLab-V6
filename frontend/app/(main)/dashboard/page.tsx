"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const tNav = useTranslations("nav");
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{tNav("dashboard")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/recipes"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="font-medium text-gray-800">{tNav("recipes")}</h2>
          <p className="mt-1 text-sm text-gray-500">Create and manage draft/final recipes with sections.</p>
        </Link>
        <Link
          href="/ingredients"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="font-medium text-gray-800">{tNav("ingredients")}</h2>
          <p className="mt-1 text-sm text-gray-500">Manage ingredients (name, SKU, unit, cost).</p>
        </Link>
        <Link
          href="/categories"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="font-medium text-gray-800">{tNav("categories")}</h2>
          <p className="mt-1 text-sm text-gray-500">Manage recipe categories.</p>
        </Link>
      </div>
    </div>
  );
}
