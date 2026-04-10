// ── Standard API response wrapper ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
  statusCode: number;
  timestamp: string;
  path: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole =
  | "admin"
  | "project_manager"
  | "site_manager"
  | "accountant"
  | "viewer";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  userId: string;
  tenantId: string;
}

export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface RegisterPayload {
  companyName: string;
  slug: string;
  fullName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  slug: string;
  email: string;
  password: string;
}

// ── Projects ──────────────────────────────────────────────────────────────────
export type ProjectStatus = "planned" | "on_progress" | "completed";

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  clientId?: string;
  description?: string;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  financeSnapshot?: FinanceSnapshot;
}

export interface FinanceSnapshot {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentConsumed: number;
  alertLevel: "normal" | "warning" | "critical";
  currency: string;
  breakdown: {
    personnel: number;
    articles: number;
    tools: number;
  };
  lastUpdatedAt: string;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export type TaskStatus = "planned" | "on_progress" | "completed";

export interface Task {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  progress: number;
  estimatedCost: number;
  actualCost?: number;
  currency: string;
  createdAt: string;
}

// ── Personnel ─────────────────────────────────────────────────────────────────
export interface Personnel {
  id: string;
  tenantId: string;
  fullName: string;
  role: string;
  costPerHour: number;
  currency: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

// ── Tools ─────────────────────────────────────────────────────────────────────
export type ToolStatus = "available" | "in_use" | "maintenance" | "retired";

export interface Tool {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  serialNumber?: string;
  photoUrl?: string;
  status: ToolStatus;
  createdAt: string;
}

// ── Articles ──────────────────────────────────────────────────────────────────
export interface Article {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  unit?: string;
  unitPrice: number;
  currency: string;
  barcodeId: string;
  barcodeImageUrl?: string;
  stockQuantity: number;
  reservedQuantity: number;
  consumedQuantity: number;
  availableQuantity: number;
  createdAt: string;
}

// ── Contacts ──────────────────────────────────────────────────────────────────
export type ContactType = "supplier" | "client" | "subcontractor";

export interface Contact {
  id: string;
  tenantId: string;
  contactType: ContactType;
  legalName: string;
  ifNumber?: string;
  iceNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

// ── Purchase Orders ───────────────────────────────────────────────────────────
export type PurchaseOrderStatus =
  | "draft"
  | "confirmed"
  | "partial"
  | "completed";

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  orderNumber: string;
  supplierId: string;
  projectId?: string;
  orderDate: string;
  status: PurchaseOrderStatus;
  currency: string;
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export type InvoiceStatus = "pending_validation" | "validated" | "paid";

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  attachmentId: string;
  subcontractorId: string;
  projectId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  pdfUrl?: string;
  issuedAt: string;
  validatedAt?: string;
  paidAt?: string;
}

// ── Non-Conformities ──────────────────────────────────────────────────────────
export type NcStatus = "open" | "in_review" | "closed";

export interface NonConformity {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  description: string;
  status: NcStatus;
  planUrl?: string;
  markerX?: number;
  markerY?: number;
  reportedBy: string;
  createdAt: string;
}

// ── Finance ───────────────────────────────────────────────────────────────────
export interface FinanceDashboard {
  period: { month: string; start: string; end: string };
  kpis: {
    totalPaymentsThisMonth: number;
    subscriptionRevenue: number;
    supplierPayments: number;
    subcontractorPayments: number;
    pendingSupplierAmount: number;
    pendingSubcontractorAmount: number;
    overduePayments: number;
  };
  monthlyChart: { month: string; total: number }[];
  subscription: {
    plan: string;
    status: string;
    nextBillingDate: string;
    accessRestricted: boolean;
  } | null;
}

// ── Upload ────────────────────────────────────────────────────────────────────
export interface UploadResult {
  secureUrl: string;
  publicId: string;
  originalFilename: string;
  format: string;
  bytes: number;
  resourceType: string;
  width?: number;
  height?: number;
}

// ── Notifications (Socket.io) ─────────────────────────────────────────────────
export interface RealtimeNotification {
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  link?: string;
  entityId?: string;
}
