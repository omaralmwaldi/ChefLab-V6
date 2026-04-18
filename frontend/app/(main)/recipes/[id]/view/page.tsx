"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { recipesApi } from "@/lib/api";
import { isArabicLocale } from "@/lib/locale";

type RecipeSection = {
  id: number;
  title_en: string;
  title_ar: string;
  instructions: string;
  ingredients: Array<{
    id: number;
    ingredient_id: number;
    ingredient_name: string;
    quantity: string | number | null;
    unit: string;
  }>;
};

type Recipe = {
  id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  category_name?: string;
  unit?: string;
  net_weight?: number | null;
  status: "draft" | "final";
  sections: RecipeSection[];
};

export default function ViewRecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const tRecipes = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const isArabic = isArabicLocale(locale);
  const recipeId = Number(params?.id);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!recipeId) return;
    (async () => {
      try {
        const { data } = await recipesApi.get(recipeId);
        setRecipe(data as Recipe);
      } catch {
        setError("Failed to load recipe.");
      } finally {
        setLoading(false);
      }
    })();
  }, [recipeId]);

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;
  if (!recipe) return <p className="text-red-600">{error || "Recipe not found."}</p>;

  return (
    <div className="recipe-print-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-semibold">{tRecipes("viewRecipe")}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            {tRecipes("print")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/recipes")}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            {tCommon("back")}
          </button>
        </div>
      </div>

      <section className="mb-6 rounded-lg border bg-white p-6 shadow-sm recipe-print-section">
        <h2 className="mb-4 text-lg font-medium">{tRecipes("recipeInformation")}</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500">{tRecipes("englishName")}</dt>
            <dd className="font-medium">{recipe.name_en}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{tRecipes("arabicName")}</dt>
            <dd className="font-medium">{recipe.name_ar || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{tRecipes("sku")}</dt>
            <dd className="font-medium">{recipe.sku}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{tRecipes("category")}</dt>
            <dd className="font-medium">{recipe.category_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{tRecipes("unit")}</dt>
            <dd className="font-medium">{recipe.unit || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{tRecipes("netWeight")}</dt>
            <dd className="font-medium">{recipe.net_weight ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {(recipe.sections || []).map((section) => (
        <section key={section.id} className="mb-6 rounded-lg border bg-white p-6 shadow-sm recipe-print-section">
          <h3 className="mb-1 text-lg font-medium">
            {isArabic && section.title_ar ? section.title_ar : section.title_en}
          </h3>
          {section.title_ar ? (
            <p className="mb-4 text-sm text-gray-500">{isArabic ? section.title_en : section.title_ar}</p>
          ) : null}

          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-gray-700">{tRecipes("ingredients")}</h4>
            {section.ingredients.length === 0 ? (
              <p className="text-sm text-gray-500">{tRecipes("noIngredients")}</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-sm font-medium">Ingredient</th>
                    <th className="py-2 text-left text-sm font-medium">Quantity</th>
                    <th className="py-2 text-left text-sm font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {section.ingredients.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2 text-sm">{item.ingredient_name}</td>
                      <td className="py-2 text-sm">{item.quantity ?? "—"}</td>
                      <td className="py-2 text-sm">{item.unit || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">{tRecipes("instructions")}</h4>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: section.instructions || `<p>${tRecipes("noInstructions")}</p>`,
              }}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
