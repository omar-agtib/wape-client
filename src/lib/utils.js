import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// ── Page name → route mapping ──────────────────────────────────────────────────
const PAGE_ROUTES = {
    Dashboard: "/dashboard",
    Projects: "/projects",
    ProjectDetails: "/projects",
    Plans: "/plans",
    Tasks: "/tasks",
    TaskDetails: "/tasks",
    Personnel: "/personnel",
    Tools: "/tools",
    Articles: "/articles",
    Stock: "/stock",
    PurchaseOrders: "/purchase-orders",
    Reception: "/receptions",
    Finance: "/finance",
    Expenses: "/finance/supplier-payments",
    Invoices: "/invoices",
    Payments: "/finance/transactions",
    Clients: "/contacts/clients",
    Suppliers: "/contacts/suppliers",
    Subcontractors: "/contacts/subcontractors",
    Documents: "/documents",
    NonConformities: "/non-conformities",
    Attachments: "/attachments",
    Communication: "/communication",
    Reporting: "/reporting",
    TrainingSupport: "/support",
    Administration: "/admin",
    PointageJournalier: "/pointage",
    RapportPresence: "/pointage/rapport",
};
export function createPageUrl(pageName) {
    return PAGE_ROUTES[pageName] ?? "/dashboard";
}
export function formatCurrency(amount, currency = "MAD", locale = "fr-MA") {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
export function formatDate(date, locale = "fr-MA") {
    return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(date));
}
export function getInitials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
