"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { categoriesApi, recipesApi } from "@/lib/api";
import { isArabicLocale } from "@/lib/locale";

type Category = { id: number; name_en: string; name_ar?: string };

export default function CreateRecipePage() {
  const router = useRouter();
  const locale = useLocale();
  const tRecipes = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const isArabic = isArabicLocale(locale);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("");
  const [netWeight, setNetWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await categoriesApi.list();
        const list = Array.isArray(data?.results) ? data.results : data;
        setCategories(Array.isArray(list) ? list : []);
      } catch {
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await recipesApi.create({
        name_en: nameEn.trim() || "Untitled Recipe",
        name_ar: nameAr || undefined,
        sku: sku || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        unit: unit || undefined,
        net_weight: netWeight ? Number(netWeight) : undefined,
      });
      router.push(`/recipes/${data.id}/edit`);
    } catch {
      setError("Failed to create recipe.");
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{tRecipes("createRecipe")}</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleCreate} className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="English Name"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="Arabic Name"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU (leave empty for auto)"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {isArabic && category.name_ar ? category.name_ar : category.name_en}
              </option>
            ))}
          </select>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            type="number"
            step="0.01"
            value={netWeight}
            onChange={(e) => setNetWeight(e.target.value)}
            placeholder="Net Weight"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? `${tCommon("create")}...` : tRecipes("createDraft")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/recipes")}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            {tCommon("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
