import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { api, extractData, tokenStorage } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { AuthContext } from "@/contexts/auth/AuthContext";
import { authService } from "@/services/wape.service";
export function AuthProvider({ children }) {
    const [state, setState] = useState({
        user: null,
        isAuthenticated: tokenStorage.isAuthenticated(),
        isLoading: tokenStorage.isAuthenticated(),
        role: tokenStorage.getRole(),
        tenantId: tokenStorage.getTenantId(),
    });
    const fetchCurrentUser = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, isLoading: true }));
            // ✅ removed inner await — extractData now accepts a Promise directly
            const user = await extractData(api.get("/auth/me"));
            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
                role: user.role,
                tenantId: user.tenantId,
            });
            connectSocket();
        }
        catch {
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
        if (!tokenStorage.isAuthenticated())
            return;
        void (async () => {
            await fetchCurrentUser();
        })();
    }, [fetchCurrentUser]);
    const setTokensAndUser = useCallback((tokens) => {
        tokenStorage.set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tenantId: tokens.tenantId,
            userId: tokens.userId,
            role: tokens.role,
        });
    }, []);
    const login = useCallback(async (payload) => {
        // ✅ removed inner await
        const tokens = await extractData(api.post("/auth/login", payload));
        setTokensAndUser(tokens);
        await fetchCurrentUser();
    }, [fetchCurrentUser, setTokensAndUser]);
    const register = useCallback(async (payload) => {
        // ✅ removed inner await
        const tokens = await extractData(api.post("/auth/register", payload));
        setTokensAndUser(tokens);
        await fetchCurrentUser();
    }, [fetchCurrentUser, setTokensAndUser]);
    const logout = useCallback(async () => {
        const refreshToken = tokenStorage.getRefresh();
        if (refreshToken) {
            await authService.logout(refreshToken).catch(() => { });
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
    return (_jsx(AuthContext.Provider, { value: {
            ...state,
            login,
            register,
            logout,
            refreshUser,
        }, children: children }));
}
