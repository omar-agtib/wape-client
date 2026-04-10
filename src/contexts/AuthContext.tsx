import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, extractData, tokenStorage } from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";
import type {
  MeResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UserRole,
} from "../types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  tenantId: string | null;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: tokenStorage.isAuthenticated(),
    isLoading: tokenStorage.isAuthenticated(), // loading if token exists
    role: tokenStorage.getRole() as UserRole | null,
    tenantId: tokenStorage.getTenantId(),
  });

  // ── Load user on mount if token exists ──────────────────────────────────────
  useEffect(() => {
    if (tokenStorage.isAuthenticated()) {
      void fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const user = await extractData(
        await api.get<{ success: boolean; data: MeResponse }>("/auth/me"),
      );
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        role: user.role,
        tenantId: user.tenantId,
      });

      // Connect Socket.io after user is loaded
      connectSocket();
    } catch {
      tokenStorage.clear();
      disconnectSocket();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        role: null,
        tenantId: null,
      });
    }
  }, []);

  const setTokensAndUser = useCallback((tokens: AuthTokens) => {
    tokenStorage.set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tenantId: tokens.tenantId,
      userId: tokens.userId,
      role: tokens.role,
    });
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload) => {
      const tokens = await extractData(
        await api.post<{ success: boolean; data: AuthTokens }>(
          "/auth/login",
          payload,
        ),
      );
      setTokensAndUser(tokens);
      await fetchCurrentUser();
    },
    [fetchCurrentUser, setTokensAndUser],
  );

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(
    async (payload: RegisterPayload) => {
      const tokens = await extractData(
        await api.post<{ success: boolean; data: AuthTokens }>(
          "/auth/register",
          payload,
        ),
      );
      setTokensAndUser(tokens);
      await fetchCurrentUser();
    },
    [fetchCurrentUser, setTokensAndUser],
  );

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    tokenStorage.clear();
    disconnectSocket();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      tenantId: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
