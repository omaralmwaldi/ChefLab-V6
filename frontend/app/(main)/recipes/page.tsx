"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { recipesApi } from "@/lib/api";
import { isArabicLocale } from "@/lib/locale";

type Recipe = {
  id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  category_name?: string;
  unit?: string;
  net_weight?: number | null;
  status: "draft" | "final";
  created_by_email?: string;
};

export default function RecipesPage() {
  const router = useRouter();
  const locale = useLocale();
  const tRecipes = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const isArabic = isArabicLocale(locale);
  const [statusFilter, setStatusFilter] = useState<"draft" | "final">("draft");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadRecipes(filter: "draft" | "final") {
    setError("");
    setLoading(true);
    try {
      const { data } = await recipesApi.list(filter);
      setRecipes(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setError("Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes(statusFilter);
  }, [statusFilter]);

  async function handleCreateDraft() {
    setCreating(true);
    setError("");
    try {
      const { data } = await recipesApi.create({ name_en: "Untitled Recipe" });
      router.push(`/recipes/${data.id}/edit`);
    } catch {
      setError("Failed to create draft recipe.");
      setCreating(false);
    }
  }

  async function handleDelete(recipeId: number) {
    if (!window.confirm("Delete this recipe?")) return;
    setError("");
    try {
      await recipesApi.delete(recipeId);
      await loadRecipes(statusFilter);
    } catch {
      setError("Failed to delete recipe.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{tRecipes("title")}</h1>
        <button
          type="button"
          disabled={creating}
          onClick={handleCreateDraft}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? `${tCommon("create")}...` : tRecipes("createRecipe")}
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("draft")}
          className={
            statusFilter === "draft"
              ? "rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
              : "rounded border border-gray-300 px-3 py-1.5 text-sm"
          }
        >
          {tRecipes("draft")}
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("final")}
          className={
            statusFilter === "final"
              ? "rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
              : "rounded border border-gray-300 px-3 py-1.5 text-sm"
          }
        >
          {tRecipes("final")}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">{tCommon("loading")}</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-500">No recipes found.</p>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const isFinal = recipe.status === "final";
            return (
              <div key={recipe.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {isArabic && recipe.name_ar ? recipe.name_ar : recipe.name_en}
                    </p>
                    {recipe.name_ar ? (
                      <p className="text-sm text-gray-500">{isArabic ? recipe.name_en : recipe.name_ar}</p>
                    ) : null}
                    <p className="text-sm text-gray-500">
                      {tRecipes("sku")}: {recipe.sku} · {tRecipes("status")}:{" "}
                      {recipe.status === "draft" ? tRecipes("draft") : tRecipes("final")}
                      {recipe.category_name ? ` · ${tRecipes("category")}: ${recipe.category_name}` : ""}
                      {recipe.unit ? ` · ${tRecipes("unit")}: ${recipe.unit}` : ""}
                      {recipe.net_weight != null ? ` · ${tRecipes("netWeight")}: ${recipe.net_weight}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/recipes/${recipe.id}/view`)}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {tRecipes("viewRecipe")}
                    </button>
                    <button
                      type="button"
                      disabled={isFinal}
                      onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
                      className={
                        isFinal
                          ? "cursor-not-allowed text-sm text-gray-400"
                          : "text-sm text-blue-600 hover:underline"
                      }
                    >
                      {tCommon("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(recipe.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      {tCommon("delete")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
