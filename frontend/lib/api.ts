import axios from "axios";

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
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (email: string, password: string) =>
    api.post<{ access: string; refresh: string }>("/auth/login/", { email, password }),
  register: (email: string, password: string, first_name?: string, last_name?: string) =>
    api.post("/auth/register/", { email, password, first_name, last_name }),
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
  create: (data: {
    name_en: string;
    name_ar?: string;
    sku: string;
    category_id: number;
    storage_unit?: string;
    net_weight?: number;
    instructions?: string;
    ingredients: { ingredient_id: number; quantity?: number }[];
  }) => api.post("/recipes/", data),
};
