import { useContext } from "react";
import { AuthContext } from "@/contexts/auth/AuthContext";
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return context;
}
// ── Role helpers ──────────────────────────────────────────────────────────────
export function useIsAdmin() {
    const { role } = useAuth();
    return role === "admin";
}
export function useCanEdit() {
    const { role } = useAuth();
    return role === "admin" || role === "project_manager";
}
export function useCanManageSite() {
    const { role } = useAuth();
    return (role === "admin" || role === "project_manager" || role === "site_manager");
}
export function useCanManageFinance() {
    const { role } = useAuth();
    return role === "admin" || role === "accountant";
}
