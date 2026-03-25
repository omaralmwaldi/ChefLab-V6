"use client";

import { useEffect, useState } from "react";
import { categoriesApi } from "@/lib/api";

type Category = {
  id: number;
  name_en: string;
  name_ar: string;
};

export default function CategoriesPage() {
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name_en: "", name_ar: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name_en: "", name_ar: "" });

  async function load() {
    try {
      const { data } = await categoriesApi.list();
      setList(data.results ?? data);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await categoriesApi.create({ name_en: form.name_en, name_ar: form.name_ar || undefined });
      setForm({ name_en: "", name_ar: "" });
      load();
    } catch {
      setError("Create failed.");
    }
  }

  function startEdit(item: Category) {
    setEditingId(item.id);
    setEditForm({ name_en: item.name_en, name_ar: item.name_ar || "" });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId == null) return;
    setError("");
    try {
      await categoriesApi.update(editingId, editForm);
      setEditingId(null);
      load();
    } catch {
      setError("Update failed.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    setError("");
    try {
      await categoriesApi.delete(id);
      load();
    } catch {
      setError("Delete failed.");
    }
  }

  const items = Array.isArray(list) ? list : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Categories</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleCreate} className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 font-medium">Add category</h2>
        <div className="flex gap-4">
          <input
            placeholder="Name (EN)"
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            placeholder="Name (AR)"
            value={form.name_ar}
            onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
            className="rounded border border-gray-300 px-3 py-2"
          />
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Add
          </button>
        </div>
      </form>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-4 text-gray-500">Loading...</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Name (EN)</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Name (AR)</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  {editingId === item.id ? (
                    <>
                      <td colSpan={2} className="px-4 py-2">
                        <form onSubmit={handleUpdate} className="flex gap-2">
                          <input
                            value={editForm.name_en}
                            onChange={(e) => setEditForm((f) => ({ ...f, name_en: e.target.value }))}
                            className="rounded border px-2 py-1"
                          />
                          <input
                            value={editForm.name_ar}
                            onChange={(e) => setEditForm((f) => ({ ...f, name_ar: e.target.value }))}
                            className="rounded border px-2 py-1"
                          />
                          <button type="submit" className="rounded bg-green-600 px-2 py-1 text-white text-sm">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded bg-gray-400 px-2 py-1 text-white text-sm">Cancel</button>
                        </form>
                      </td>
                      <td />
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{item.name_en}</td>
                      <td className="px-4 py-2">{item.name_ar || "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => startEdit(item)} className="mr-2 text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && items.length === 0 && (
          <p className="p-4 text-gray-500">No categories yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
