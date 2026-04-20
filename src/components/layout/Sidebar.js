import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Map, CheckSquare, Users, Wrench, Package, ShoppingCart, DollarSign, Receipt, FileText, AlertTriangle, MessageSquare, BarChart3, Settings, ChevronDown, ChevronRight, HardHat, Truck, Building2, Paperclip, ClipboardList, UserSquare, Factory, LifeBuoy, CreditCard, CalendarCheck, FileBarChart2, } from "lucide-react";
import { cn, createPageUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
function isGroup(item) {
    return "children" in item;
}
// ── Role constants ─────────────────────────────────────────────────────────────
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
// ── Navigation config ─────────────────────────────────────────────────────────
const navItems = [
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
function canSee(itemRoles, role) {
    if (!itemRoles)
        return true;
    if (!role)
        return false;
    return itemRoles.includes(role);
}
export default function Sidebar({ collapsed, onToggle }) {
    const location = useLocation();
    const { role } = useAuth();
    const [expandedGroups, setExpandedGroups] = useState(["Resources"]);
    const toggleGroup = (name) => {
        if (collapsed)
            return;
        setExpandedGroups((prev) => prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]);
    };
    const isPathActive = (page) => location.pathname === createPageUrl(page);
    const isGroupActive = (item) => item.children.some((child) => isPathActive(child.page));
    // Filter top-level items by role
    const visibleItems = navItems.filter((item) => {
        if (!canSee(item.roles, role))
            return false;
        if (isGroup(item)) {
            // Show group only if at least one child is visible
            const visibleChildren = item.children.filter((child) => canSee(child.roles, role));
            return visibleChildren.length > 0;
        }
        return true;
    });
    return (_jsxs(_Fragment, { children: [!collapsed && (_jsx("div", { className: "fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden", onClick: onToggle })), _jsxs("aside", { className: cn("fixed top-0 left-0 h-full z-50 flex flex-col", "bg-sidebar text-sidebar-foreground", "transition-all duration-300 ease-in-out", collapsed
                    ? "-translate-x-full lg:translate-x-0 lg:w-[68px]"
                    : "w-[260px] translate-x-0"), children: [_jsxs("div", { className: "h-16 flex items-center px-5 gap-3 border-b border-sidebar-muted/50 shrink-0", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0", children: _jsx(HardHat, { className: "w-5 h-5 text-primary-foreground" }) }), !collapsed && (_jsx("span", { className: "font-bold text-lg tracking-tight", children: "WAPE" }))] }), _jsx("nav", { className: "flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin", children: visibleItems.map((item) => {
                            if (isGroup(item)) {
                                const groupExpanded = expandedGroups.includes(item.name);
                                const groupActive = isGroupActive(item);
                                const visibleChildren = item.children.filter((child) => canSee(child.roles, role));
                                return (_jsxs("div", { children: [_jsxs("button", { onClick: () => toggleGroup(item.name), title: collapsed ? item.name : undefined, className: cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium", "transition-colors duration-150", groupActive
                                                ? "bg-sidebar-muted text-sidebar-foreground"
                                                : "text-sidebar-foreground/70 hover:bg-sidebar-muted/50 hover:text-sidebar-foreground"), children: [_jsx(item.icon, { className: "w-[18px] h-[18px] shrink-0" }), !collapsed && (_jsxs(_Fragment, { children: [_jsx("span", { className: "flex-1 text-left", children: item.name }), groupExpanded ? (_jsx(ChevronDown, { className: "w-4 h-4" })) : (_jsx(ChevronRight, { className: "w-4 h-4" }))] }))] }), !collapsed && groupExpanded && (_jsx("div", { className: "ml-4 pl-4 border-l border-sidebar-muted/50 mt-0.5 space-y-0.5", children: visibleChildren.map((child) => {
                                                const active = isPathActive(child.page);
                                                return (_jsxs(Link, { to: createPageUrl(child.page), className: cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150", active
                                                        ? "bg-sidebar-accent text-primary-foreground font-medium"
                                                        : "text-sidebar-foreground/70 hover:bg-sidebar-muted/50 hover:text-sidebar-foreground"), children: [_jsx(child.icon, { className: "w-4 h-4 shrink-0" }), _jsx("span", { children: child.name })] }, child.page));
                                            }) }))] }, item.name));
                            }
                            // Leaf item
                            const active = isPathActive(item.page);
                            return (_jsxs(Link, { to: createPageUrl(item.page), title: collapsed ? item.name : undefined, className: cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium", "transition-colors duration-150", active
                                    ? "bg-sidebar-accent text-primary-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-muted/50 hover:text-sidebar-foreground"), children: [_jsx(item.icon, { className: "w-[18px] h-[18px] shrink-0" }), !collapsed && _jsx("span", { children: item.name })] }, item.page));
                        }) }), !collapsed && (_jsx("div", { className: "px-5 py-4 border-t border-sidebar-muted/50", children: _jsx("p", { className: "text-xs text-sidebar-foreground/30", children: "WAPE v3.0 \u2014 ERP" }) }))] })] }));
}
