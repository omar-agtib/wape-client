export type UserRole =
  | "admin"
  | "project_manager"
  | "site_manager"
  | "accountant"
  | "viewer";

// Which roles can access each route
export const ROLE_ACCESS: Record<string, UserRole[]> = {
  "/dashboard": [
    "admin",
    "project_manager",
    "site_manager",
    "accountant",
    "viewer",
  ],
  "/projects": [
    "admin",
    "project_manager",
    "site_manager",
    "accountant",
    "viewer",
  ],
  "/tasks": ["admin", "project_manager", "site_manager", "viewer"],
  "/personnel": ["admin", "project_manager"],
  "/tools": ["admin", "project_manager", "site_manager"],
  "/articles": ["admin", "project_manager", "site_manager"],
  "/stock": ["admin", "project_manager", "site_manager"],
  "/purchase-orders": ["admin", "accountant"],
  "/receptions": ["admin", "project_manager", "site_manager"],
  "/attachments": ["admin", "project_manager", "accountant"],
  "/invoices": ["admin", "accountant"],
  "/finance": ["admin", "accountant"],
  "/non-conformities": ["admin", "project_manager", "site_manager"],
  "/plans": ["admin", "project_manager", "site_manager"],
  "/documents": [
    "admin",
    "project_manager",
    "site_manager",
    "accountant",
    "viewer",
  ],
  "/pointage": ["admin", "project_manager", "site_manager"],
  "/reporting": ["admin", "project_manager", "accountant"],
  "/administration": ["admin"],
  "/training": [
    "admin",
    "project_manager",
    "site_manager",
    "accountant",
    "viewer",
  ],
};

export function canAccess(role: UserRole, path: string): boolean {
  // Match exact or prefix (e.g. /projects/123 → /projects)
  const base = "/" + path.split("/")[1];
  const allowed = ROLE_ACCESS[base];
  if (!allowed) return true;
  return allowed.includes(role);
}
