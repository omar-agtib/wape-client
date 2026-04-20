import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Map,
  CheckSquare,
  Users,
  Wrench,
  Package,
  ShoppingCart,
  DollarSign,
  Receipt,
  FileText,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  HardHat,
  Truck,
  Building2,
  Paperclip,
  ClipboardList,
  UserSquare,
  Factory,
  LifeBuoy,
  CreditCard,
  CalendarCheck,
  FileBarChart2,
} from "lucide-react";
import { cn, createPageUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/permissions";

// ── Nav item types ─────────────────────────────────────────────────────────────

interface NavLeaf {
  name: string;
  icon: React.ElementType;
  page: string;
  badge?: string;
  roles?: UserRole[];
}

interface NavGroup {
  name: string;
  icon: React.ElementType;
  children: NavLeaf[];
  roles?: UserRole[];
}

type NavItem = NavLeaf | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

// ── Role constants ─────────────────────────────────────────────────────────────

const ALL: UserRole[] = [
  "admin",
  "project_manager",
  "site_manager",
  "accountant",
  "viewer",
];
const MANAGERS: UserRole[] = ["admin", "project_manager", "site_manager"];
const FINANCE: UserRole[] = ["admin", "accountant"];
const PM_ONLY: UserRole[] = ["admin", "project_manager"];
const ADMIN_ONLY: UserRole[] = ["admin"];

// ── Navigation config ─────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard", roles: ALL },
  { name: "Projects", icon: FolderKanban, page: "Projects", roles: ALL },
  { name: "Plans", icon: Map, page: "Plans", roles: MANAGERS },
  { name: "Tasks", icon: CheckSquare, page: "Tasks", roles: MANAGERS },
  {
    name: "Resources",
    icon: Users,
    roles: PM_ONLY,
    children: [
      { name: "Personnel", icon: Users, page: "Personnel", roles: PM_ONLY },
      { name: "Tools", icon: Wrench, page: "Tools", roles: MANAGERS },
    ],
  },
  {
    name: "Warehouse",
    icon: Package,
    roles: MANAGERS,
    children: [
      {
        name: "Articles",
        icon: ShoppingCart,
        page: "Articles",
        roles: MANAGERS,
      },
      { name: "Stock", icon: Package, page: "Stock", roles: MANAGERS },
      {
        name: "Purchase Orders",
        icon: ClipboardList,
        page: "PurchaseOrders",
        roles: FINANCE,
      },
      { name: "Reception", icon: Truck, page: "Reception", roles: MANAGERS },
    ],
  },
  {
    name: "Finance",
    icon: DollarSign,
    roles: FINANCE,
    children: [
      { name: "Finance", icon: DollarSign, page: "Finance", roles: FINANCE },
      { name: "Invoices", icon: Receipt, page: "Invoices", roles: FINANCE },
      { name: "Payments", icon: CreditCard, page: "Payments", roles: FINANCE },
      { name: "Expenses", icon: Receipt, page: "Expenses", roles: FINANCE },
    ],
  },
  {
    name: "Contacts",
    icon: UserSquare,
    roles: MANAGERS,
    children: [
      { name: "Clients", icon: UserSquare, page: "Clients", roles: MANAGERS },
      { name: "Suppliers", icon: Factory, page: "Suppliers", roles: MANAGERS },
      {
        name: "Subcontractors",
        icon: Building2,
        page: "Subcontractors",
        roles: MANAGERS,
      },
    ],
  },
  {
    name: "Pointage",
    icon: CalendarCheck,
    roles: MANAGERS,
    children: [
      {
        name: "Pointage Journalier",
        icon: CalendarCheck,
        page: "PointageJournalier",
        roles: MANAGERS,
      },
      {
        name: "Rapport de Présence",
        icon: FileBarChart2,
        page: "RapportPresence",
        roles: MANAGERS,
      },
    ],
  },
  { name: "Documents", icon: FileText, page: "Documents", roles: ALL },
  {
    name: "Non Conformities",
    icon: AlertTriangle,
    page: "NonConformities",
    roles: MANAGERS,
  },
  { name: "Attachments", icon: Paperclip, page: "Attachments", roles: FINANCE },
  {
    name: "Communication",
    icon: MessageSquare,
    page: "Communication",
    roles: ALL,
  },
  { name: "Reporting", icon: BarChart3, page: "Reporting", roles: PM_ONLY },
  {
    name: "Training & Support",
    icon: LifeBuoy,
    page: "TrainingSupport",
    roles: ALL,
  },
  {
    name: "Administration",
    icon: Settings,
    page: "Administration",
    roles: ADMIN_ONLY,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function canSee(
  itemRoles: UserRole[] | undefined,
  role: string | null,
): boolean {
  if (!itemRoles) return true;
  if (!role) return false;
  return itemRoles.includes(role as UserRole);
}

// ── Sidebar component ─────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { role } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Resources"]);

  const toggleGroup = (name: string) => {
    if (collapsed) return;
    setExpandedGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name],
    );
  };

  const isPathActive = (page: string) =>
    location.pathname === createPageUrl(page);

  const isGroupActive = (item: NavGroup) =>
    item.children.some((child) => isPathActive(child.page));

  // Filter top-level items by role
  const visibleItems = navItems.filter((item) => {
    if (!canSee(item.roles, role)) return false;
    if (isGroup(item)) {
      // Show group only if at least one child is visible
      const visibleChildren = item.children.filter((child) =>
        canSee(child.roles, role),
      );
      return visibleChildren.length > 0;
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col",
          "bg-sidebar text-sidebar-foreground",
          "transition-all duration-300 ease-in-out",
          collapsed
            ? "-translate-x-full lg:translate-x-0 lg:w-[68px]"
            : "w-[260px] translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-sidebar-muted/50 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
            <HardHat className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">WAPE</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {visibleItems.map((item) => {
            if (isGroup(item)) {
              const groupExpanded = expandedGroups.includes(item.name);
              const groupActive = isGroupActive(item);
              const visibleChildren = item.children.filter((child) =>
                canSee(child.roles, role),
              );

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleGroup(item.name)}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                      "transition-colors duration-150",
                      groupActive
                        ? "bg-sidebar-muted text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-muted/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {groupExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </button>

                  {!collapsed && groupExpanded && (
                    <div className="ml-4 pl-4 border-l border-sidebar-muted/50 mt-0.5 space-y-0.5">
                      {visibleChildren.map((child) => {
                        const active = isPathActive(child.page);
                        return (
                          <Link
                            key={child.page}
                            to={createPageUrl(child.page)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
                              active
                                ? "bg-sidebar-accent text-primary-foreground font-medium"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-muted/50 hover:text-sidebar-foreground",
                            )}
                          >
                            <child.icon className="w-4 h-4 shrink-0" />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Leaf item
            const active = isPathActive(item.page);
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  "transition-colors duration-150",
                  active
                    ? "bg-sidebar-accent text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-muted/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Version */}
        {!collapsed && (
          <div className="px-5 py-4 border-t border-sidebar-muted/50">
            <p className="text-xs text-sidebar-foreground/30">
              WAPE v3.0 — ERP
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
