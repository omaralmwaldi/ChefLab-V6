"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Recipe = {
  id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  status: string;
};

export default function DraftRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadDrafts = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/recipes");
      const items = (data?.results ?? data) as Recipe[];
      const drafts = (Array.isArray(items) ? items : []).filter(
        (r) => r.status === "draft",
      );
      setRecipes(drafts);
    } catch {
      setError("Failed to load draft recipes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this draft recipe?")) return;
    setActionError("");
    setBusyId(id);
    try {
      await api.delete(`/recipes/${id}/`);
      await loadDrafts();
    } catch {
      setActionError("Could not delete recipe.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSendRequest(id: number) {
    setActionError("");
    setBusyId(id);
    try {
      await api.post(`/recipes/${id}/send-request/`);
      await loadDrafts();
    } catch {
      setActionError("Could not send request.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Draft Recipes</h1>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {actionError && <p className="mb-2 text-sm text-red-600">{actionError}</p>}

      {recipes.length === 0 ? (
        <p className="text-gray-500">No draft recipes.</p>
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {r.name_en}{" "}
                  <span className="text-xs text-gray-500">({r.sku})</span>
                </p>
                {r.name_ar && (
                  <p className="text-sm text-gray-500">{r.name_ar}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => router.push(`/recipes/${r.id}/edit`)}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => handleDelete(r.id)}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => handleSendRequest(r.id)}
                  className="text-sm text-gray-800 hover:underline disabled:opacity-50"
                >
                  Send Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
