import axios from "axios";
import { clearAuth, type AuthUser, type Role } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (email: string, password: string) =>
    api.post<{ access: string; refresh: string; user: AuthUser }>("/auth/login/", {
      email,
      password,
    }),
  register: (email: string, password: string, first_name?: string, last_name?: string) =>
    api.post("/auth/register/", { email, password, first_name, last_name }),
};

export const rolesApi = {
  list: () => api.get<Role[]>("/auth/roles/"),
  create: (data: Omit<Role, "id">) => api.post<Role>("/auth/roles/", data),
  update: (id: number, data: Partial<Omit<Role, "id">>) => api.put<Role>(`/auth/roles/${id}/`, data),
  delete: (id: number) => api.delete(`/auth/roles/${id}/`),
};

export type UserManagementUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: Role[];
};

export const usersApi = {
  list: () => api.get<UserManagementUser[]>("/users/"),
  create: (data: {
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
    email: string;
    roles: number[];
  }) =>
    api.post<UserManagementUser>("/users/", data),
  get: (id: number) => api.get<UserManagementUser>(`/users/${id}/`),
  update: (
    id: number,
    data: Partial<{
      username: string;
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      role_ids: number[];
    }>,
  ) => api.patch<UserManagementUser>(`/users/${id}/`, data),
  delete: (id: number) => api.delete(`/users/${id}/`),
};

export const ingredientsApi = {
  list: () => api.get("/ingredients/"),
  create: (data: { name_en: string; name_ar?: string; sku: string; unit?: string; cost?: string }) =>
    api.post("/ingredients/", data),
  update: (id: number, data: Partial<{ name_en: string; name_ar: string; sku: string; unit: string; cost: string }>) =>
    api.patch(`/ingredients/${id}/`, data),
  delete: (id: number) => api.delete(`/ingredients/${id}/`),
};

export const categoriesApi = {
  list: () => api.get("/categories/"),
  create: (data: { name_en: string; name_ar?: string }) =>
    api.post("/categories/", data),
  update: (id: number, data: Partial<{ name_en: string; name_ar: string }>) =>
    api.patch(`/categories/${id}/`, data),
  delete: (id: number) => api.delete(`/categories/${id}/`),
};

export const recipesApi = {
  list: (status?: "draft" | "final") =>
    api.get("/recipes/", { params: status ? { status } : undefined }),
  get: (id: number) => api.get(`/recipes/${id}/`),
  create: (data: {
    name_en?: string;
    name_ar?: string;
    sku?: string;
    category_id?: number;
    unit?: string;
    net_weight?: number;
    sections?: Array<{
      title_en: string;
      title_ar?: string;
      instructions?: string;
      order?: number;
      allowed_roles: number[];
      ingredients?: Array<{ ingredient_id: number; quantity?: number }>;
    }>;
  }) => api.post("/recipes/", data),
  update: (
    id: number,
    data: Partial<{
      name_en: string;
      name_ar: string;
      sku: string;
      category_id: number | null;
      unit: string;
      net_weight: number | null;
      finalize: boolean;
      sections: Array<{
        title_en: string;
        title_ar?: string;
        instructions?: string;
        order?: number;
        allowed_roles: number[];
        ingredients?: Array<{ ingredient_id: number; quantity?: number }>;
      }>;
    }>,
  ) => api.patch(`/recipes/${id}/`, data),
  delete: (id: number) => api.delete(`/recipes/${id}/`),
};
