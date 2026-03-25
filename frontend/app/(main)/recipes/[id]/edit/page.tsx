"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, categoriesApi, ingredientsApi } from "@/lib/api";
import InstructionsEditor from "@/components/InstructionsEditor";

type Category = { id: number; name_en: string };
type Ingredient = { id: number; name_en: string; sku: string };

type Recipe = {
  id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  category_id: number;
  storage_unit: string;
  net_weight: string | number | null;
  instructions: string;
  ingredients?: { ingredient_id: number; ingredient_name?: string; quantity: string | number | null }[];
};

type IngredientRow = { ingredient_id: number; quantity: string };

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name_en, setNameEn] = useState("");
  const [name_ar, setNameAr] = useState("");
  const [sku, setSku] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [storage_unit, setStorageUnit] = useState("");
  const [net_weight, setNetWeight] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rows, setRows] = useState<IngredientRow[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [catRes, ingRes, recRes] = await Promise.all([
          categoriesApi.list(),
          ingredientsApi.list(),
          api.get(`/recipes/${id}/`),
        ]);
        const catData = catRes.data.results ?? catRes.data;
        setCategories(catData);
        const ingData = ingRes.data.results ?? ingRes.data;
        setIngredients(ingData);

        const r = recRes.data as Recipe;
        setNameEn(r.name_en);
        setNameAr(r.name_ar || "");
        setSku(r.sku);
        setCategoryId(String(r.category_id));
        setStorageUnit(r.storage_unit || "");
        setNetWeight(r.net_weight ? String(r.net_weight) : "");
        setInstructions(r.instructions || "");
        const initialRows =
          Array.isArray(r.ingredients) && r.ingredients.length
            ? r.ingredients.map((ri) => ({
                ingredient_id: ri.ingredient_id,
                quantity: ri.quantity ? String(ri.quantity) : "",
              }))
            : [];
        setRows(initialRows);
      } catch {
        setError("Failed to load recipe.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function addRow() {
    setRows((r) => [...r, { ingredient_id: 0, quantity: "" }]);
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: "ingredient_id" | "quantity", value: number | string) {
    setRows((r) => {
      const next = [...r];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError("");
    setSaving(true);
    try {
      const filtered = rows.filter((r) => r.ingredient_id > 0);
      const seen = new Set<number>();
      for (const row of filtered) {
        if (seen.has(row.ingredient_id)) {
          setError("Duplicate ingredients are not allowed.");
          setSaving(false);
          return;
        }
        seen.add(row.ingredient_id);
      }

      await api.patch(`/recipes/${id}/`, {
        name_en,
        name_ar: name_ar || undefined,
        sku,
        category_id: category_id ? Number(category_id) : undefined,
        storage_unit: storage_unit || undefined,
        net_weight: net_weight ? Number(net_weight) : undefined,
        instructions: instructions || undefined,
        ingredients: filtered.map((r) => ({
          ingredient_id: r.ingredient_id,
          quantity: r.quantity ? Number(r.quantity) : undefined,
        })),
      });
      router.push("/recipes");
    } catch (err: unknown) {
      const d =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: Record<string, unknown> } }).response
              ?.data
          : undefined;
      if (d && typeof d === "object") {
        const msg = typeof (d as any).detail === "string" ? (d as any).detail : JSON.stringify(d);
        setError(msg);
      } else {
        setError("Failed to update recipe.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const catList = Array.isArray(categories) ? categories : [];
  const ingList = Array.isArray(ingredients) ? ingredients : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Edit Recipe</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-medium">Ingredients</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left text-sm font-medium">Ingredient</th>
                <th className="pb-2 text-left text-sm font-medium">Quantity</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">
                    <select
                      value={row.ingredient_id}
                      onChange={(e) => updateRow(i, "ingredient_id", Number(e.target.value))}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    >
                      <option value={0}>Select ingredient</option>
                      {ingList.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name_en} ({ing.sku})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.0001"
                      value={row.quantity}
                      onChange={(e) => updateRow(i, "quantity", e.target.value)}
                      placeholder="Quantity"
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addRow}
            className="mt-4 rounded border border-gray-300 bg-gray-50 px-4 py-2 text-sm hover:bg-gray-100"
          >
            + Add ingredient
          </button>
        </section>

        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-medium">Recipe information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Name (EN) *</label>
              <input
                value={name_en}
                onChange={(e) => setNameEn(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Name (AR)</label>
              <input
                value={name_ar}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">SKU *</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Category *</label>
              <select
                value={category_id}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="">Select category</option>
                {catList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Storage unit</label>
              <input
                value={storage_unit}
                onChange={(e) => setStorageUnit(e.target.value)}
                placeholder="e.g. piece"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Net weight</label>
              <input
                type="number"
                step="0.001"
                value={net_weight}
                onChange={(e) => setNetWeight(e.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-medium">Instructions</h2>
          <p className="mb-2 text-sm text-gray-500">
            Use the editor to edit preparation steps (HTML from Tiptap).
          </p>
          <InstructionsEditor
            value={instructions}
            onChange={setInstructions}
            placeholder="Update preparation instructions..."
          />
        </section>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/recipes")}
            className="rounded border border-gray-300 px-6 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

