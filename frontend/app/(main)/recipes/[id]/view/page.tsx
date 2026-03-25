"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

type RecipeIngredient = {
  ingredient_id: number;
  ingredient_name?: string;
  quantity: string | number | null;
  unit?: string;
};

type Recipe = {
  id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  category_id: number;
  category_name?: string;
  storage_unit: string;
  net_weight: string | number | null;
  instructions: string;
  status?: string;
  ingredients?: RecipeIngredient[];
};

export default function ShowRequestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<"reject" | "finalize" | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get(`/recipes/${id}/`);
        setRecipe(data as Recipe);
      } catch {
        setError("Failed to load recipe.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handlePrint() {
    window.print();
  }

  async function handleReject() {
    if (!id) return;
    const confirmed = window.confirm("Reject this recipe and send it back to draft?");
    if (!confirmed) return;
    setError("");
    setActionLoading("reject");
    try {
      await api.post(`/review/${id}/reject/`);
      router.push("/review-recipes");
    } catch {
      setError("Failed to reject recipe.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFinalize() {
    if (!id) return;
    const confirmed = window.confirm("Finalize this recipe?");
    if (!confirmed) return;
    setError("");
    setActionLoading("finalize");
    try {
      await api.post(`/review/${id}/finalize/`);
      router.push("/review-recipes");
    } catch {
      setError("Failed to finalize recipe.");
    } finally {
      setActionLoading(null);
    }
  }

  const backHref =
    recipe?.status === "final"
      ? "/final-recipes"
      : recipe?.status === "draft"
        ? "/draft-recipes"
        : "/review-recipes";

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error && !recipe) return <p className="text-red-600">{error}</p>;
  if (!recipe) return null;

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const isReview = recipe.status === "review";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">
        {isReview ? "Show Request" : "Recipe details"}
      </h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="print-area text-gray-900 print:text-black">
        {/* Print: only recipe fields (labels + values); no card chrome */}
        <section className="mb-8 rounded-lg border bg-white p-6 shadow-sm print:mb-6 print:border-0 print:bg-transparent print:p-0 print:shadow-none print:rounded-none">
          <h2 className="mb-4 font-medium print:hidden">Recipe Information</h2>
          <dl className="grid gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-3">
            <div>
              <dt className="text-sm text-gray-500 print:text-gray-800 print:font-semibold">Name (EN)</dt>
              <dd className="font-medium text-gray-900 print:mt-0.5">{recipe.name_en}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 print:text-gray-800 print:font-semibold">Name (AR)</dt>
              <dd className="font-medium text-gray-900 print:mt-0.5">{recipe.name_ar || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 print:text-gray-800 print:font-semibold">SKU</dt>
              <dd className="font-medium text-gray-900 print:mt-0.5">{recipe.sku}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 print:text-gray-800 print:font-semibold">Category</dt>
              <dd className="font-medium text-gray-900 print:mt-0.5">
                {recipe.category_name ?? recipe.category_id ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 print:text-gray-800 print:font-semibold">Storage unit</dt>
              <dd className="font-medium text-gray-900 print:mt-0.5">{recipe.storage_unit || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 print:text-gray-800 print:font-semibold">Net weight</dt>
              <dd className="font-medium text-gray-900 print:mt-0.5">{recipe.net_weight ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="mb-8 rounded-lg border bg-white p-6 shadow-sm print:mb-6 print:border-0 print:bg-transparent print:p-0 print:shadow-none print:rounded-none">
          <h2 className="mb-4 font-medium print:mb-2 print:text-base print:font-semibold">Ingredients</h2>
          {ingredients.length === 0 ? (
            <p className="text-gray-500">No ingredients.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left text-sm font-medium">Ingredient</th>
                  <th className="pb-2 text-left text-sm font-medium">Quantity</th>
                  <th className="pb-2 text-left text-sm font-medium">Unit</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ri, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{ri.ingredient_name ?? "—"}</td>
                    <td className="py-2">{ri.quantity ?? "—"}</td>
                    <td className="py-2">{ri.unit || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mb-8 rounded-lg border bg-white p-6 shadow-sm print:mb-0 print:border-0 print:bg-transparent print:p-0 print:shadow-none print:rounded-none">
          <h2 className="mb-4 font-medium print:mb-2 print:text-base print:font-semibold">Instructions</h2>
          <div
            className="prose prose-sm max-w-none text-gray-800 print:max-w-none"
            dangerouslySetInnerHTML={{
              __html: recipe.instructions || '<p class="text-gray-500">No instructions.</p>',
            }}
          />
        </section>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded border border-gray-300 bg-white px-6 py-2 font-medium text-gray-800 hover:bg-gray-50"
        >
          Print
        </button>
        {isReview ? (
          <>
            <button
              type="button"
              onClick={handleReject}
              disabled={!!actionLoading}
              className="rounded border border-red-300 bg-white px-6 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {actionLoading === "reject" ? "Rejecting..." : "Reject"}
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              disabled={!!actionLoading}
              className="rounded bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading === "finalize" ? "Finalizing..." : "Finalize"}
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="rounded border border-gray-300 px-6 py-2 hover:bg-gray-50"
        >
          {recipe.status === "final"
            ? "Back to Final Recipes"
            : recipe.status === "draft"
              ? "Back to Draft Recipes"
              : "Back to Review Recipes"}
        </button>
      </div>
    </div>
  );
}
