"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { rolesApi, usersApi, type UserManagementUser } from "@/lib/api";
import type { Role } from "@/lib/auth";
import { isArabicLocale } from "@/lib/locale";

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const tUsers = useTranslations("users");
  const tCommon = useTranslations("common");
  const isArabic = isArabicLocale(locale);
  const userId = Number(params?.id);

  const [user, setUser] = useState<UserManagementUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const [userRes, rolesRes] = await Promise.all([usersApi.get(userId), rolesApi.list()]);
        setUser(userRes.data);
        setUsername(userRes.data.username || "");
        setFirstName(userRes.data.first_name || "");
        setLastName(userRes.data.last_name || "");
        setEmail(userRes.data.email || "");
        setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
        setSelectedRoleIds((userRes.data.roles ?? []).map((role) => role.id));
      } catch {
        setError("Failed to load user.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  function toggleRole(roleId: number) {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError("");
    setSaving(true);
    try {
      await usersApi.update(userId, {
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
        role_ids: selectedRoleIds,
      });
      router.push("/users");
    } catch {
      setError("Failed to update user.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;
  if (!user) return <p className="text-red-600">{error || "User not found."}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{tUsers("editUser")}</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSave} className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            placeholder={tUsers("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            type="email"
            placeholder={tUsers("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            placeholder={tUsers("firstName")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            placeholder={tUsers("lastName")}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {tUsers("password")} ({tUsers("newPasswordHint")})
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tUsers("newPasswordHint")}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <h2 className="mb-2 text-sm font-medium text-gray-700">{tUsers("assignRoles")}</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <label key={role.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedRoleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
              {isArabic && role.name_ar ? role.name_ar : role.name_en}
            </label>
          ))}
          {roles.length === 0 ? <p className="text-sm text-gray-500">{tUsers("noRoles")}</p> : null}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? `${tCommon("save")}...` : tCommon("save")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/users")}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            {tCommon("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
