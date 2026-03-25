"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, categoriesApi, ingredientsApi, recipesApi } from "@/lib/api";
import InstructionsEditor from "@/components/InstructionsEditor";

type Category = { id: number; name_en: string };
type Ingredient = { id: number; name_en: string; sku: string; unit?: string };

type IngredientRow = { ingredient_id: number; quantity: string };

export default function CreateRecipePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const [name_en, setNameEn] = useState("");
  const [name_ar, setNameAr] = useState("");
  const [sku, setSku] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [storage_unit, setStorageUnit] = useState("");
  const [net_weight, setNetWeight] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rows, setRows] = useState<IngredientRow[]>([{ ingredient_id: 0, quantity: "" }]);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, ingRes] = await Promise.all([
          categoriesApi.list(),
          ingredientsApi.list(),
        ]);
        setCategories(catRes.data.results ?? catRes.data);
        setIngredients(ingRes.data.results ?? ingRes.data);
        const firstCat = (catRes.data.results ?? catRes.data)?.[0];
        if (firstCat && !category_id) setCategoryId(String(firstCat.id));
      } catch {
        setError("Failed to load categories or ingredients.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    setError("");
    setSubmitLoading(true);
    const payload = {
      name_en,
      name_ar: name_ar || undefined,
      sku,
      category_id: Number(category_id),
      storage_unit: storage_unit || undefined,
      net_weight: net_weight ? Number(net_weight) : undefined,
      instructions: instructions || undefined,
      ingredients: rows
        .filter((r) => r.ingredient_id > 0)
        .map((r) => ({
          ingredient_id: r.ingredient_id,
          quantity: r.quantity ? Number(r.quantity) : undefined,
        })),
    };
    if (payload.ingredients.length === 0) {
      setError("Add at least one ingredient.");
      setSubmitLoading(false);
      return;
    }
    try {
      const { data } = await recipesApi.create(payload);
      const recipeId = data?.id;
      if (recipeId) {
        await api.post(`/recipes/${recipeId}/send-request/`);
      }
      router.push("/review-recipes?created=1");
    } catch (err: unknown) {
      const d = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: Record<string, unknown> } }).response?.data
        : undefined;
      if (d && typeof d === "object") {
        const msg = typeof d.detail === "string" ? d.detail : JSON.stringify(d);
        setError(msg);
      } else setError("Failed to create recipe.");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const catList = Array.isArray(categories) ? categories : [];
  const ingList = Array.isArray(ingredients) ? ingredients : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Create Recipe</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-8">
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
                  <option key={c.id} value={c.id}>{c.name_en}</option>
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
          <h2 className="mb-4 font-medium">Ingredients</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left text-sm font-medium">Ingredient</th>
                <th className="pb-2 text-left text-sm font-medium">Quantity</th>
                <th className="pb-2 text-left text-sm font-medium">Unit</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const selectedIng = ingList.find((ing) => ing.id === row.ingredient_id);
                const unitLabel = selectedIng?.unit ? selectedIng.unit : "—";
                return (
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
                    <td className="py-2 text-sm text-gray-600">{unitLabel}</td>
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
                );
              })}
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
          <h2 className="mb-4 font-medium">Instructions</h2>
          <p className="mb-2 text-sm text-gray-500">Use the editor to write preparation steps (HTML from Tiptap).</p>
          <InstructionsEditor
            value={instructions}
            onChange={setInstructions}
            placeholder="Write preparation instructions..."
          />
        </section>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitLoading}
            className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitLoading ? "Creating..." : "Create recipe"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/review-recipes")}
            className="rounded border border-gray-300 px-6 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
