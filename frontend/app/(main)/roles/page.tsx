"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { rolesApi } from "@/lib/api";
import type { Role } from "@/lib/auth";
import { isArabicLocale } from "@/lib/locale";

type RoleForm = Omit<Role, "id">;
type RolePermissionKey =
  | "can_access_dashboard"
  | "can_access_recipes"
  | "can_create_recipe"
  | "can_access_draft_recipe"
  | "can_manage_ingredients"
  | "can_manage_categories"
  | "can_manage_roles";

const defaultForm: RoleForm = {
  name_en: "",
  name_ar: "",
  can_access_dashboard: false,
  can_access_recipes: false,
  can_create_recipe: false,
  can_access_draft_recipe: false,
  can_manage_ingredients: false,
  can_manage_categories: false,
  can_manage_roles: false,
};

const permissionFields: RolePermissionKey[] = [
  "can_access_dashboard",
  "can_access_recipes",
  "can_create_recipe",
  "can_access_draft_recipe",
  "can_manage_ingredients",
  "can_manage_categories",
  "can_manage_roles",
];

export default function RolesPage() {
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tPermissions = useTranslations("permissions");
  const isArabic = isArabicLocale(locale);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<RoleForm>(defaultForm);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RoleForm>(defaultForm);

  async function loadRoles() {
    try {
      const { data } = await rolesApi.list();
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await rolesApi.create(form);
      setForm(defaultForm);
      await loadRoles();
    } catch {
      setError("Failed to create role.");
    }
  }

  function startEdit(role: Role) {
    setEditingRoleId(role.id);
    setEditForm({
      name_en: role.name_en,
      name_ar: role.name_ar,
      can_access_dashboard: role.can_access_dashboard,
      can_access_recipes: role.can_access_recipes,
      can_create_recipe: role.can_create_recipe,
      can_access_draft_recipe: role.can_access_draft_recipe,
      can_manage_ingredients: role.can_manage_ingredients,
      can_manage_categories: role.can_manage_categories,
      can_manage_roles: role.can_manage_roles,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRoleId) return;
    setError("");
    try {
      await rolesApi.update(editingRoleId, editForm);
      setEditingRoleId(null);
      await loadRoles();
    } catch {
      setError("Failed to update role.");
    }
  }

  async function handleDelete(roleId: number) {
    if (!window.confirm("Delete this role?")) return;
    setError("");
    try {
      await rolesApi.delete(roleId);
      await loadRoles();
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(detail || "Failed to delete role.");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{tNav("roles")}</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleCreate} className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 font-medium">Create role</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            placeholder="English name"
            value={form.name_en}
            onChange={(e) => setForm((prev) => ({ ...prev, name_en: e.target.value }))}
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            placeholder="Arabic name"
            value={form.name_ar}
            onChange={(e) => setForm((prev) => ({ ...prev, name_ar: e.target.value }))}
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {permissionFields.map((permissionKey) => (
            <label key={permissionKey} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form[permissionKey]}
                onChange={(e) => setForm((prev) => ({ ...prev, [permissionKey]: e.target.checked }))}
              />
              {tPermissions(permissionKey)}
            </label>
          ))}
        </div>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          {tCommon("create")}
        </button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-500">{tCommon("loading")}</p>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="rounded-lg border bg-white p-4 shadow-sm">
              {editingRoleId === role.id ? (
                <form onSubmit={handleUpdate}>
                  <div className="mb-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={editForm.name_en}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name_en: e.target.value }))}
                      required
                      className="rounded border border-gray-300 px-3 py-2"
                    />
                    <input
                      value={editForm.name_ar}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name_ar: e.target.value }))}
                      required
                      className="rounded border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div className="mb-4 grid gap-2 sm:grid-cols-2">
                    {permissionFields.map((permissionKey) => (
                      <label key={permissionKey} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm[permissionKey]}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, [permissionKey]: e.target.checked }))
                          }
                        />
                        {tPermissions(permissionKey)}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                    >
                      {tCommon("save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRoleId(null)}
                      className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      {tCommon("cancel")}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {isArabic && role.name_ar ? role.name_ar : role.name_en}
                    </p>
                    <p className="text-sm text-gray-500">{isArabic ? role.name_en : role.name_ar}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                      {permissionFields
                        .filter((permissionKey) => role[permissionKey])
                        .map((permissionKey) => (
                          <span key={permissionKey} className="rounded bg-gray-100 px-2 py-1">
                            {tPermissions(permissionKey)}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(role)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {tCommon("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(role.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      {tCommon("delete")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {!loading && roles.length === 0 ? <p className="text-gray-500">No roles found.</p> : null}
      </div>
    </div>
  );
}
