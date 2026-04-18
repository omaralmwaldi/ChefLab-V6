"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { rolesApi, usersApi } from "@/lib/api";
import type { Role } from "@/lib/auth";
import { isArabicLocale } from "@/lib/locale";

export default function CreateUserPage() {
  const router = useRouter();
  const locale = useLocale();
  const tUsers = useTranslations("users");
  const tCommon = useTranslations("common");
  const isArabic = isArabicLocale(locale);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await rolesApi.list();
        setRoles(Array.isArray(data) ? data : []);
      } catch {
        setError("Failed to load roles.");
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, []);

  function toggleRole(roleId: number) {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await usersApi.create({
        username: username.trim(),
        password,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        roles: selectedRoleIds,
      });
      router.push("/users");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? JSON.stringify((err as { response?: { data?: unknown } }).response?.data)
          : "Failed to create user.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{tUsers("createUser")}</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            placeholder={tUsers("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            type="password"
            placeholder={tUsers("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          <input
            type="email"
            placeholder={tUsers("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded border border-gray-300 px-3 py-2 sm:col-span-2"
          />
        </div>

        <h2 className="mb-2 text-sm font-medium text-gray-700">{tUsers("assignRoles")}</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {loadingRoles ? (
            <p className="text-sm text-gray-500">{tCommon("loading")}</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-gray-500">{tUsers("noRoles")}</p>
          ) : (
            roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                />
                {isArabic && role.name_ar ? role.name_ar : role.name_en}
              </label>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? `${tCommon("create")}...` : tUsers("createUser")}
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
