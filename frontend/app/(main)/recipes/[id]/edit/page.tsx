"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { categoriesApi, ingredientsApi, recipesApi, rolesApi } from "@/lib/api";
import InstructionsEditor from "@/components/InstructionsEditor";

type Role = { id: number; name_en: string; name_ar: string };
type Ingredient = { id: number; name_en: string; sku: string; unit?: string };
type Category = { id: number; name_en: string };

type SectionIngredient = {
  ingredient_id: number;
  quantity: string;
  unit: string;
};

type SectionForm = {
  title_en: string;
  title_ar: string;
  instructions: string;
  order: number;
  allowed_roles: number[];
  ingredients: SectionIngredient[];
};

type RecipeResponse = {
  id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  category_id?: number;
  unit?: string;
  net_weight?: number | null;
  status: "draft" | "final";
  sections: Array<{
    id: number;
    title_en: string;
    title_ar: string;
    instructions: string;
    order: number;
    allowed_roles: Array<{ id: number; name_en: string; name_ar: string }>;
    ingredients: Array<{ ingredient_id: number; quantity: string | number | null; unit: string }>;
  }>;
};

const emptySection = (order: number): SectionForm => ({
  title_en: "",
  title_ar: "",
  instructions: "",
  order,
  allowed_roles: [],
  ingredients: [{ ingredient_id: 0, quantity: "", unit: "" }],
});

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const recipeId = Number(params?.id);

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("");
  const [netWeight, setNetWeight] = useState("");
  const [status, setStatus] = useState<"draft" | "final">("draft");

  const [sections, setSections] = useState<SectionForm[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ingredientMap = useMemo(() => new Map(ingredients.map((item) => [item.id, item])), [ingredients]);
  const isFinal = status === "final";

  useEffect(() => {
    if (!recipeId) return;

    (async () => {
      try {
        const [recipeRes, rolesRes, ingredientsRes, categoriesRes] = await Promise.all([
          recipesApi.get(recipeId),
          rolesApi.list(),
          ingredientsApi.list(),
          categoriesApi.list(),
        ]);

        const recipe = recipeRes.data as RecipeResponse;
        setNameEn(recipe.name_en || "");
        setNameAr(recipe.name_ar || "");
        setSku(recipe.sku || "");
        setCategoryId(recipe.category_id ? String(recipe.category_id) : "");
        setUnit(recipe.unit || "");
        setNetWeight(recipe.net_weight == null ? "" : String(recipe.net_weight));
        setStatus(recipe.status || "draft");

        const mappedSections = (recipe.sections || []).map((section, index) => ({
          title_en: section.title_en || "",
          title_ar: section.title_ar || "",
          instructions: section.instructions || "",
          order: section.order || index + 1,
          allowed_roles: (section.allowed_roles || []).map((role) => role.id),
          ingredients:
            section.ingredients?.length > 0
              ? section.ingredients.map((item) => ({
                  ingredient_id: item.ingredient_id,
                  quantity: item.quantity == null ? "" : String(item.quantity),
                  unit: item.unit || "",
                }))
              : [{ ingredient_id: 0, quantity: "", unit: "" }],
        }));

        setSections(mappedSections.length ? mappedSections : [emptySection(1)]);
        setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);

        const ingredientsData = Array.isArray(ingredientsRes.data?.results)
          ? ingredientsRes.data.results
          : ingredientsRes.data;
        setIngredients(Array.isArray(ingredientsData) ? ingredientsData : []);

        const categoriesData = Array.isArray(categoriesRes.data?.results)
          ? categoriesRes.data.results
          : categoriesRes.data;
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch {
        setError("Failed to load recipe data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [recipeId]);

  function updateSection(index: number, patch: Partial<SectionForm>) {
    setSections((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function addSection() {
    setSections((current) => [...current, emptySection(current.length + 1)]);
  }

  function removeSection(index: number) {
    setSections((current) =>
      current.filter((_, i) => i !== index).map((section, i) => ({ ...section, order: i + 1 })),
    );
  }

  function toggleRole(sectionIndex: number, roleId: number) {
    const section = sections[sectionIndex];
    const hasRole = section.allowed_roles.includes(roleId);
    updateSection(sectionIndex, {
      allowed_roles: hasRole
        ? section.allowed_roles.filter((id) => id !== roleId)
        : [...section.allowed_roles, roleId],
    });
  }

  function updateIngredient(sectionIndex: number, ingredientIndex: number, patch: Partial<SectionIngredient>) {
    const section = sections[sectionIndex];
    const nextIngredients = [...section.ingredients];
    const updated = { ...nextIngredients[ingredientIndex], ...patch };

    if (patch.ingredient_id !== undefined) {
      const selectedIngredient = ingredientMap.get(patch.ingredient_id);
      updated.unit = selectedIngredient?.unit || "";
    }

    nextIngredients[ingredientIndex] = updated;
    updateSection(sectionIndex, { ingredients: nextIngredients });
  }

  function addIngredient(sectionIndex: number) {
    const section = sections[sectionIndex];
    updateSection(sectionIndex, {
      ingredients: [...section.ingredients, { ingredient_id: 0, quantity: "", unit: "" }],
    });
  }

  function removeIngredient(sectionIndex: number, ingredientIndex: number) {
    const section = sections[sectionIndex];
    updateSection(sectionIndex, {
      ingredients: section.ingredients.filter((_, i) => i !== ingredientIndex),
    });
  }

  async function submitRecipe(finalize: boolean) {
    if (!recipeId) return;
    setError("");

    if (!nameEn.trim()) {
      setError("English Name is required.");
      return;
    }

    for (const section of sections) {
      if (!section.title_en.trim()) {
        setError("Each section must have an English title.");
        return;
      }
      if (section.allowed_roles.length === 0) {
        setError("Each section must have at least one role.");
        return;
      }
    }

    setSaving(true);
    try {
      await recipesApi.update(recipeId, {
        name_en: nameEn,
        name_ar: nameAr,
        sku: sku || undefined,
        category_id: categoryId ? Number(categoryId) : null,
        unit: unit || "",
        net_weight: netWeight ? Number(netWeight) : null,
        finalize,
        sections: sections.map((section, index) => ({
          title_en: section.title_en,
          title_ar: section.title_ar,
          instructions: section.instructions,
          order: index + 1,
          allowed_roles: section.allowed_roles,
          ingredients: section.ingredients
            .filter((item) => item.ingredient_id > 0)
            .map((item) => ({
              ingredient_id: item.ingredient_id,
              quantity: item.quantity ? Number(item.quantity) : undefined,
            })),
        })),
      });
      router.push("/recipes");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "Failed to save recipe.";
      setError(msg || "Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Edit Recipe</h1>
      <p className="mb-4 text-sm text-gray-500">Current status: {status}</p>
      {isFinal ? (
        <p className="mb-4 text-sm text-amber-700">Final recipes are read-only and cannot be updated.</p>
      ) : null}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="English Name"
            className="rounded border border-gray-300 px-3 py-2"
            disabled={isFinal}
          />
          <input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="Arabic Name"
            className="rounded border border-gray-300 px-3 py-2"
            disabled={isFinal}
          />
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU (leave empty for auto)"
            className="rounded border border-gray-300 px-3 py-2"
            disabled={isFinal}
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
            disabled={isFinal}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_en}
              </option>
            ))}
          </select>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit"
            className="rounded border border-gray-300 px-3 py-2"
            disabled={isFinal}
          />
          <input
            type="number"
            step="0.01"
            value={netWeight}
            onChange={(e) => setNetWeight(e.target.value)}
            placeholder="Net Weight"
            className="rounded border border-gray-300 px-3 py-2"
            disabled={isFinal}
          />
        </div>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={addSection}
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
          disabled={isFinal}
        >
          Add Section
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <input
                value={section.title_en}
                onChange={(e) => updateSection(sectionIndex, { title_en: e.target.value })}
                placeholder="Section English Title"
                className="rounded border border-gray-300 px-3 py-2"
                disabled={isFinal}
              />
              <input
                value={section.title_ar}
                onChange={(e) => updateSection(sectionIndex, { title_ar: e.target.value })}
                placeholder="Section Arabic Title"
                className="rounded border border-gray-300 px-3 py-2"
                disabled={isFinal}
              />
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Allowed roles (required)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={section.allowed_roles.includes(role.id)}
                      onChange={() => toggleRole(sectionIndex, role.id)}
                      disabled={isFinal}
                    />
                    {role.name_en}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Ingredients</p>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left text-sm font-medium">Item</th>
                    <th className="pb-2 text-left text-sm font-medium">Quantity</th>
                    <th className="pb-2 text-left text-sm font-medium">Unit</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {section.ingredients.map((item, ingredientIndex) => (
                    <tr key={ingredientIndex} className="border-b">
                      <td className="py-2">
                        <select
                          value={item.ingredient_id}
                          onChange={(e) =>
                            updateIngredient(sectionIndex, ingredientIndex, {
                              ingredient_id: Number(e.target.value),
                            })
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2"
                          disabled={isFinal}
                        >
                          <option value={0}>Select ingredient</option>
                          {ingredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name_en} ({ingredient.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateIngredient(sectionIndex, ingredientIndex, { quantity: e.target.value })}
                          className="w-full rounded border border-gray-300 px-3 py-2"
                          disabled={isFinal}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          value={item.unit}
                          readOnly
                          className="w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600"
                        />
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeIngredient(sectionIndex, ingredientIndex)}
                          className="text-red-600 hover:underline disabled:text-gray-400"
                          disabled={isFinal}
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
                onClick={() => addIngredient(sectionIndex)}
                className="mt-3 rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
                disabled={isFinal}
              >
                + Add ingredient
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Instructions</p>
              <InstructionsEditor
                value={section.instructions}
                onChange={(html) => updateSection(sectionIndex, { instructions: html })}
                placeholder="Write section instructions..."
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => removeSection(sectionIndex)}
                className="text-sm text-red-600 hover:underline disabled:text-gray-400"
                disabled={sections.length === 1 || isFinal}
              >
                Remove section
              </button>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving || isFinal}
          onClick={() => submitRecipe(true)}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          disabled={saving || isFinal}
          onClick={() => submitRecipe(false)}
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}
