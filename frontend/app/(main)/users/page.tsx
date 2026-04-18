"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usersApi, type UserManagementUser } from "@/lib/api";
import { isArabicLocale } from "@/lib/locale";

export default function UsersPage() {
  const router = useRouter();
  const locale = useLocale();
  const tUsers = useTranslations("users");
  const tCommon = useTranslations("common");
  const isArabic = isArabicLocale(locale);
  const [users, setUsers] = useState<UserManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const { data } = await usersApi.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDelete(userId: number) {
    if (!window.confirm("Delete this user?")) return;
    setError("");
    try {
      await usersApi.delete(userId);
      await loadUsers();
    } catch {
      setError("Failed to delete user.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{tUsers("title")}</h1>
        <button
          type="button"
          onClick={() => router.push("/users/create")}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {tUsers("createUser")}
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">{tCommon("loading")}</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") || "No name"}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-sm text-gray-500">Username: {user.username}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    {(user.roles ?? []).map((role) => (
                      <span key={role.id} className="rounded bg-gray-100 px-2 py-1">
                        {isArabic && role.name_ar ? role.name_ar : role.name_en}
                      </span>
                    ))}
                    {(user.roles ?? []).length === 0 ? (
                      <span className="rounded bg-gray-100 px-2 py-1">{tUsers("noRoles")}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/users/${user.id}/edit`)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {tCommon("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    {tCommon("delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
