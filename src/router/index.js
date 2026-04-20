import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter, RouterProvider, Navigate, } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";
import Layout from "@/Layout";
import { PAGES } from "@/pages.config";
const ALL = [
    "admin",
    "project_manager",
    "site_manager",
    "accountant",
    "viewer",
];
const MANAGERS = ["admin", "project_manager", "site_manager"];
const FINANCE = ["admin", "accountant"];
const PM_ONLY = ["admin", "project_manager"];
const ADMIN_ONLY = ["admin"];
const appRoutes = [
    // ── Everyone
    { path: "/dashboard", page: "Dashboard", roles: ALL },
    { path: "/projects", page: "Projects", roles: ALL },
    { path: "/projects/:id", page: "ProjectDetails", roles: ALL },
    { path: "/documents", page: "Documents", roles: ALL },
    { path: "/support", page: "TrainingSupport", roles: ALL },
    { path: "/communication", page: "Communication", roles: ALL },
    // ── Managers + Admin
    { path: "/tasks", page: "Tasks", roles: MANAGERS },
    { path: "/tasks/:id", page: "TaskDetails", roles: MANAGERS },
    { path: "/plans", page: "Plans", roles: MANAGERS },
    { path: "/tools", page: "Tools", roles: MANAGERS },
    { path: "/articles", page: "Articles", roles: MANAGERS },
    { path: "/stock", page: "Stock", roles: MANAGERS },
    { path: "/receptions", page: "Reception", roles: MANAGERS },
    { path: "/non-conformities", page: "NonConformities", roles: MANAGERS },
    { path: "/pointage", page: "PointageJournalier", roles: MANAGERS },
    { path: "/pointage/rapport", page: "RapportPresence", roles: MANAGERS },
    { path: "/contacts/clients", page: "Clients", roles: MANAGERS },
    { path: "/contacts/suppliers", page: "Suppliers", roles: MANAGERS },
    { path: "/contacts/subcontractors", page: "Subcontractors", roles: MANAGERS },
    // ── PM + Admin only
    { path: "/personnel", page: "Personnel", roles: PM_ONLY },
    { path: "/reporting", page: "Reporting", roles: PM_ONLY },
    // ── Finance
    { path: "/finance", page: "Finance", roles: FINANCE },
    { path: "/finance/supplier-payments", page: "Expenses", roles: FINANCE },
    { path: "/finance/transactions", page: "Payments", roles: FINANCE },
    { path: "/invoices", page: "Invoices", roles: FINANCE },
    { path: "/purchase-orders", page: "PurchaseOrders", roles: FINANCE },
    { path: "/attachments", page: "Attachments", roles: FINANCE },
    { path: "/attachments/:id", page: "AttachmentDetails", roles: FINANCE },
    // ── Admin only
    { path: "/admin", page: "Administration", roles: ADMIN_ONLY },
    { path: "/admin/tutorials", page: "Administration", roles: ADMIN_ONLY },
    { path: "/settings", page: "Administration", roles: ADMIN_ONLY },
];
const router = createBrowserRouter([
    // ── Public only
    {
        element: _jsx(PublicOnlyRoute, {}),
        children: [
            { path: "/login", element: _jsx(LoginPage, {}) },
            { path: "/register", element: _jsx(RegisterPage, {}) },
        ],
    },
    // ── Protected + Layout
    {
        element: _jsx(ProtectedRoute, {}),
        children: [
            {
                element: _jsx(Layout, {}),
                children: appRoutes.map(({ path, page, roles }) => {
                    const PageComponent = PAGES[page];
                    return {
                        path,
                        element: PageComponent ? (_jsx(ProtectedRoute, { allowedRoles: roles, children: _jsx(PageComponent, {}) })) : null,
                    };
                }),
            },
        ],
    },
    // ── Misc
    { path: "/unauthorized", element: _jsx(UnauthorizedPage, {}) },
    { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) },
    { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) },
]);
export function AppRouter() {
    return _jsx(RouterProvider, { router: router });
}
