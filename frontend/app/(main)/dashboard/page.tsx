"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/recipes/create"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="font-medium text-gray-800">Create Recipe</h2>
          <p className="mt-1 text-sm text-gray-500">Add a new recipe with ingredients and instructions.</p>
        </Link>
        <Link
          href="/ingredients"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="font-medium text-gray-800">Ingredients</h2>
          <p className="mt-1 text-sm text-gray-500">Manage ingredients (name, SKU, unit, cost).</p>
        </Link>
        <Link
          href="/categories"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="font-medium text-gray-800">Categories</h2>
          <p className="mt-1 text-sm text-gray-500">Manage recipe categories.</p>
        </Link>
      </div>
    </div>
  );
}
