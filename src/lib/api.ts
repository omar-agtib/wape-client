import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "wape_access_token";
const REFRESH_KEY = "wape_refresh_token";
const TENANT_KEY = "wape_tenant_id";
const USER_KEY = "wape_user_id";
const ROLE_KEY = "wape_role";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getTenantId: () => localStorage.getItem(TENANT_KEY),
  getUserId: () => localStorage.getItem(USER_KEY),
  getRole: () => localStorage.getItem(ROLE_KEY),

  set: (tokens: {
    accessToken: string;
    refreshToken: string;
    tenantId: string;
    userId: string;
    role: string;
  }) => {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    localStorage.setItem(TENANT_KEY, tokens.tenantId);
    localStorage.setItem(USER_KEY, tokens.userId);
    localStorage.setItem(ROLE_KEY, tokens.role);
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TENANT_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

// ── Axios instance ─────────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request interceptor — attach access token ─────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — handle 401 + token refresh ────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 — try to refresh
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = tokenStorage.getRefresh();

      // No refresh token — force logout
      if (!refreshToken) {
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue while refresh is in progress
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers!.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        );

        const tokens = data.data; // unwrap { success, data }
        tokenStorage.set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tenantId: tokens.tenantId,
          userId: tokens.userId,
          role: tokens.role,
        });

        processQueue(null, tokens.accessToken);
        original.headers!.Authorization = `Bearer ${tokens.accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── API helpers ────────────────────────────────────────────────────────────────

export function extractData<T>(
  response: AxiosResponse<{ success: boolean; data: T }>,
): T {
  return response.data.data;
}

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "An unexpected error occurred"
    );
  }
  return "An unexpected error occurred";
}

export function extractApiError(error: unknown): {
  error: string;
  message: string;
  field?: string;
} {
  if (axios.isAxiosError(error) && error.response?.data) {
    return {
      error: error.response.data.error ?? "ERROR",
      message: error.response.data.message ?? "Something went wrong",
      field: error.response.data.field,
    };
  }
  return { error: "ERROR", message: "An unexpected error occurred" };
}
