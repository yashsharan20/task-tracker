import {
  AuthResponse,
  TasksResponse,
  TaskResponse,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const request = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add token only if present
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle empty response safely
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Something went wrong");
  }

  return data as T;
};

// Auth
export const signup = (name: string, email: string, password: string) =>
  request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const login = (email: string, password: string) =>
  request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// Tasks
export const getTasks = (filters?: { status?: string; dueDate?: string }) => {
  const params = new URLSearchParams();

  if (filters?.status) params.set("status", filters.status);
  if (filters?.dueDate) params.set("dueDate", filters.dueDate);

  const query = params.toString();

  return request<TasksResponse>(
    `/api/tasks${query ? `?${query}` : ""}`
  );
};

export const createTask = (input: CreateTaskInput) =>
  request<TaskResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateTask = (id: string, input: UpdateTaskInput) =>
  request<TaskResponse>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteTask = (id: string) =>
  request<{ success: boolean; message: string }>(
    `/api/tasks/${id}`,
    {
      method: "DELETE",
    }
  );