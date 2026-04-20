import { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/plans": "Plans",
  "/tasks": "Tasks",
  "/personnel": "Personnel",
  "/tools": "Tools & Equipment",
  "/articles": "Articles",
  "/stock": "Stock Management",
  "/purchase-orders": "Purchase Orders",
  "/receptions": "Reception",
  "/finance": "Finance",
  "/finance/supplier-payments": "Supplier Payments",
  "/finance/subcontractor-payments": "Subcontractor Payments",
  "/finance/transactions": "Transactions",
  "/invoices": "Invoices",
  "/attachments": "Attachments & Validation",
  "/contacts/clients": "Clients",
  "/contacts/suppliers": "Suppliers",
  "/contacts/subcontractors": "Subcontractors",
  "/documents": "Documents",
  "/non-conformities": "Non Conformities",
  "/communication": "Communication",
  "/reporting": "Reporting",
  "/support": "Training & Support",
  "/admin": "Administration",
  "/admin/tutorials": "Tutorials",
  "/pointage": "Pointage Journalier",
  "/pointage/rapport": "Rapport de Présence",
  "/settings": "Settings",
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    Object.entries(PAGE_TITLES).find(
      ([path]) => location.pathname.startsWith(path) && path.length > 1,
    )?.[1] ??
    "WAPE";

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]",
        )}
      >
        <TopBar
          onToggleSidebar={() => setCollapsed(!collapsed)}
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
