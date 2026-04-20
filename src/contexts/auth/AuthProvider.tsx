import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, extractData, tokenStorage } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type {
  MeResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UserRole,
} from "@/types/api";
import { AuthContext } from "@/contexts/auth/AuthContext";
import { authService } from "@/services/wape.service";

interface AuthState {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  tenantId: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: tokenStorage.isAuthenticated(),
    isLoading: tokenStorage.isAuthenticated(),
    role: tokenStorage.getRole() as UserRole | null,
    tenantId: tokenStorage.getTenantId(),
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      // ✅ removed inner await — extractData now accepts a Promise directly
      const user = await extractData(
        api.get<{ success: boolean; data: MeResponse }>("/auth/me"),
      );
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        role: user.role,
        tenantId: user.tenantId,
      });
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

  useEffect(() => {
    if (!tokenStorage.isAuthenticated()) return;
    void (async () => {
      await fetchCurrentUser();
    })();
  }, [fetchCurrentUser]);

  const setTokensAndUser = useCallback((tokens: AuthTokens) => {
    tokenStorage.set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tenantId: tokens.tenantId,
      userId: tokens.userId,
      role: tokens.role,
    });
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      // ✅ removed inner await
      const tokens = await extractData(
        api.post<{ success: boolean; data: AuthTokens }>(
          "/auth/login",
          payload,
        ),
      );
      setTokensAndUser(tokens);
      await fetchCurrentUser();
    },
    [fetchCurrentUser, setTokensAndUser],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      // ✅ removed inner await
      const tokens = await extractData(
        api.post<{ success: boolean; data: AuthTokens }>(
          "/auth/register",
          payload,
        ),
      );
      setTokensAndUser(tokens);
      await fetchCurrentUser();
    },
    [fetchCurrentUser, setTokensAndUser],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {});
    }
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
