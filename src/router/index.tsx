import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";

// ── Lazy imports for protected pages (add as you build them) ──────────────────
// import { lazy, Suspense } from 'react';
// const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));

// Placeholder for pages not yet built
function ComingSoon({ page }: { page: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{page}</h2>
        <p className="text-muted-foreground text-sm">
          This page is ready for integration
        </p>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  // ── Public only routes (redirect to dashboard if logged in) ──────────────────
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  // ── Protected routes ──────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <ComingSoon page="Dashboard" /> },
      { path: "/projects", element: <ComingSoon page="Projects" /> },
      { path: "/projects/:id", element: <ComingSoon page="Project Detail" /> },
      { path: "/tasks", element: <ComingSoon page="Tasks" /> },
      { path: "/personnel", element: <ComingSoon page="Personnel" /> },
      { path: "/tools", element: <ComingSoon page="Tools" /> },
      { path: "/articles", element: <ComingSoon page="Articles" /> },
      { path: "/stock", element: <ComingSoon page="Stock" /> },
      { path: "/contacts", element: <ComingSoon page="Contacts" /> },
      {
        path: "/purchase-orders",
        element: <ComingSoon page="Purchase Orders" />,
      },
      { path: "/receptions", element: <ComingSoon page="Receptions" /> },
      { path: "/attachments", element: <ComingSoon page="Attachments" /> },
      { path: "/invoices", element: <ComingSoon page="Invoices" /> },
      { path: "/finance", element: <ComingSoon page="Finance" /> },
      {
        path: "/non-conformities",
        element: <ComingSoon page="Non-Conformities" />,
      },
      { path: "/documents", element: <ComingSoon page="Documents" /> },
      { path: "/support", element: <ComingSoon page="Support" /> },
      { path: "/settings", element: <ComingSoon page="Settings" /> },
    ],
  },

  // ── Admin-only routes ─────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={["admin"]} />,
    children: [
      {
        path: "/admin/tutorials",
        element: <ComingSoon page="Tutorials Admin" />,
      },
    ],
  },

  // ── Misc ──────────────────────────────────────────────────────────────────────
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/", element: <PublicOnlyRoute /> },
  { path: "*", element: <ComingSoon page="404 — Page not found" /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
