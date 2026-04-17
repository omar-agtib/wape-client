import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";
import Layout from "../Layout";
import { PAGES } from "../pages.config";

const appRoutes = [
  { path: "/dashboard", page: "Dashboard" },
  { path: "/projects", page: "Projects" },
  { path: "/projects/:id", page: "ProjectDetails" },
  { path: "/plans", page: "Plans" },
  { path: "/tasks", page: "Tasks" },
  { path: "/tasks/:id", page: "TaskDetails" },
  { path: "/personnel", page: "Personnel" },
  { path: "/tools", page: "Tools" },
  { path: "/articles", page: "Articles" },
  { path: "/stock", page: "Stock" },
  { path: "/purchase-orders", page: "PurchaseOrders" },
  { path: "/receptions", page: "Reception" },
  { path: "/finance", page: "Finance" },
  { path: "/finance/supplier-payments", page: "Expenses" },
  { path: "/finance/transactions", page: "Payments" },
  { path: "/invoices", page: "Invoices" },
  { path: "/attachments", page: "Attachments" },
  { path: "/attachments/:id", page: "AttachmentDetails" },
  { path: "/contacts/clients", page: "Clients" },
  { path: "/contacts/suppliers", page: "Suppliers" },
  { path: "/contacts/subcontractors", page: "Subcontractors" },
  { path: "/documents", page: "Documents" },
  { path: "/non-conformities", page: "NonConformities" },
  { path: "/communication", page: "Communication" },
  { path: "/reporting", page: "Reporting" },
  { path: "/support", page: "TrainingSupport" },
  { path: "/admin", page: "Administration" },
  { path: "/admin/tutorials", page: "Administration" },
  { path: "/pointage", page: "PointageJournalier" },
  { path: "/pointage/rapport", page: "RapportPresence" },
  { path: "/settings", page: "Administration" },
];

const router = createBrowserRouter([
  // ── Public only ─────────────────────────────────────────────────────────────
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  // ── Protected + Layout wrapper ────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: appRoutes.map(({ path, page }) => {
          const PageComponent = PAGES[page];
          return {
            path,
            element: PageComponent ? <PageComponent /> : null,
          };
        }),
      },
    ],
  },

  // ── Misc ─────────────────────────────────────────────────────────────────────
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
