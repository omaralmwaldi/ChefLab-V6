"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Recipe = {
  id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  status: string;
};

export default function ReviewRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("created") === "1") {
      setSuccess("Recipe created and sent for review.");
      window.history.replaceState({}, "", "/review-recipes");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/recipes");
        const items = (data?.results ?? data) as Recipe[];
        const reviewItems = (Array.isArray(items) ? items : []).filter(
          (r) => r.status === "review",
        );
        setRecipes(reviewItems);
      } catch {
        setError("Failed to load review recipes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Review Recipes</h1>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-2 text-sm text-green-600">{success}</p>}

      {recipes.length === 0 ? (
        <p className="text-gray-500">No recipes awaiting review.</p>
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm"
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
              <div>
                <button
                  type="button"
                  onClick={() => router.push(`/recipes/${r.id}/view`)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Show Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

