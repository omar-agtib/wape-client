import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
export function ProtectedRoute({ allowedRoles, redirectTo = "/login", children, }) {
    const { isAuthenticated, isLoading, role } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Loading WAPE..." })] }) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: redirectTo, state: { from: location }, replace: true });
    }
    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return _jsx(Navigate, { to: "/unauthorized", replace: true });
    }
    return children ? _jsx(_Fragment, { children: children }) : _jsx(Outlet, {});
}
export function PublicOnlyRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx("div", { className: "w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }));
    }
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(Outlet, {});
}
