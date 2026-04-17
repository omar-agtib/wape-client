import { api, extractData } from "../lib/api";
import type {
  Project,
  Task,
  Personnel,
  Article,
  Tool,
  Contact,
  NonConformity,
  Invoice,
  PurchaseOrder,
  FinanceDashboard,
  PaginatedResult,
  UploadResult,
} from "../types/api";

// ── Generic ───────────────────────────────────────────────────────────────────
export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  register: (body: {
    companyName: string;
    slug: string;
    fullName: string;
    email: string;
    password: string;
  }) =>
    extractData(
      api.post<{
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string;
          role: string;
          userId: string;
          tenantId: string;
        };
      }>("/auth/register", body),
    ),

  login: (body: { slug: string; email: string; password: string }) =>
    extractData(
      api.post<{
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string;
          role: string;
          userId: string;
          tenantId: string;
        };
      }>("/auth/login", body),
    ),

  refresh: (refreshToken: string) =>
    extractData(
      api.post<{
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string;
          role: string;
          userId: string;
          tenantId: string;
        };
      }>(
        "/auth/refresh",
        {},
        {
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
      ),
    ),

  me: () =>
    extractData(
      api.get<{
        success: boolean;
        data: {
          id: string;
          email: string;
          fullName: string;
          role: string;
          tenantId: string;
          createdAt: string;
          lastLoginAt?: string;
        };
      }>("/auth/me"),
    ),

  // POST /auth/logout — invalidates refresh token on server
  logout: (refreshToken: string) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        "/auth/logout",
        {},
        {
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export type CreateProjectPayload = {
  name: string;
  clientId?: string;
  description?: string;
  budget: number;
  currency?: string;
  startDate: string;
  endDate: string;
};

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export const projectsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Project> }>(
        "/projects",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: Project }>(`/projects/${id}`),
    ),

  create: (body: CreateProjectPayload) =>
    extractData(
      api.post<{ success: boolean; data: Project }>("/projects", body),
    ),

  update: (id: string, body: UpdateProjectPayload) =>
    extractData(
      api.put<{ success: boolean; data: Project }>(`/projects/${id}`, body),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/projects/${id}`),
    ),

  getFinance: (id: string) =>
    extractData(
      api.get<{
        success: boolean;
        data: {
          projectId: string;
          projectName: string;
          totalBudget: number;
          totalSpent: number;
          remainingBudget: number;
          percentConsumed: number;
          alertLevel: "normal" | "warning" | "critical";
          currency: string;
          breakdown: { personnel: number; articles: number; tools: number };
          lastUpdatedAt: string;
        };
      }>(`/projects/${id}/finance`),
    ),

  getGantt: (
    id: string,
    params?: {
      startDate?: string;
      endDate?: string;
      personnelId?: string;
      toolId?: string;
      articleId?: string;
    },
  ) =>
    extractData(
      api.get<{
        success: boolean;
        data: {
          project: Partial<Project>;
          tasks: any[];
          meta: { totalTasks: number; filters: Record<string, string | null> };
        };
      }>(`/projects/${id}/gantt`, { params }),
    ),

  getPurchaseOrders: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        `/projects/${id}/purchase-orders`,
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────

export type CreateTaskPayload = {
  projectId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  currency?: string;
  progress?: number;
};

export type UpdateTaskPayload = Partial<Omit<CreateTaskPayload, "projectId">>;

// ── Task resource payloads match backend DTOs exactly ─────────────────────────

export type AddTaskPersonnelPayload = {
  personnelId: string;
  quantity: number; // hours
  currency?: string;
};

export type AddTaskArticlePayload = {
  articleId: string;
  quantity: number;
  currency?: string;
};

export type AddTaskToolPayload = {
  toolId: string;
  quantity: number;
  unitCost: number;
  currency?: string;
};

export const tasksService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Task> }>("/tasks", {
        params,
      }),
    ),

  get: (id: string) =>
    extractData(api.get<{ success: boolean; data: Task }>(`/tasks/${id}`)),

  create: (body: CreateTaskPayload) =>
    extractData(api.post<{ success: boolean; data: Task }>("/tasks", body)),

  update: (id: string, body: UpdateTaskPayload) =>
    extractData(
      api.put<{ success: boolean; data: Task }>(`/tasks/${id}`, body),
    ),

  // PATCH /tasks/:id/status — enforces state machine (planned→on_progress→completed)
  changeStatus: (id: string, status: "planned" | "on_progress" | "completed") =>
    extractData(
      api.patch<{ success: boolean; data: Task }>(`/tasks/${id}/status`, {
        status,
      }),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/tasks/${id}`),
    ),

  // ── Personnel
  listPersonnel: (taskId: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(
        `/tasks/${taskId}/personnel`,
      ),
    ),

  addPersonnel: (taskId: string, body: AddTaskPersonnelPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/tasks/${taskId}/personnel`,
        body,
      ),
    ),

  removePersonnel: (taskId: string, taskPersonnelId: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(
        `/tasks/${taskId}/personnel/${taskPersonnelId}`,
      ),
    ),

  // ── Articles
  listArticles: (taskId: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(
        `/tasks/${taskId}/articles`,
      ),
    ),

  addArticle: (taskId: string, body: AddTaskArticlePayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/tasks/${taskId}/articles`,
        body,
      ),
    ),

  removeArticle: (taskId: string, taskArticleId: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(
        `/tasks/${taskId}/articles/${taskArticleId}`,
      ),
    ),

  // ── Tools
  listTools: (taskId: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(`/tasks/${taskId}/tools`),
    ),

  addTool: (taskId: string, body: AddTaskToolPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/tasks/${taskId}/tools`,
        body,
      ),
    ),

  removeTool: (taskId: string, taskToolId: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(
        `/tasks/${taskId}/tools/${taskToolId}`,
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSONNEL
// ─────────────────────────────────────────────────────────────────────────────

export type CreatePersonnelPayload = {
  fullName: string;
  role: string;
  costPerHour: number;
  currency?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type UpdatePersonnelPayload = Partial<CreatePersonnelPayload>;

export const personnelService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Personnel> }>(
        "/personnel",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: Personnel }>(`/personnel/${id}`),
    ),

  create: (body: CreatePersonnelPayload) =>
    extractData(
      api.post<{ success: boolean; data: Personnel }>("/personnel", body),
    ),

  update: (id: string, body: UpdatePersonnelPayload) =>
    extractData(
      api.put<{ success: boolean; data: Personnel }>(`/personnel/${id}`, body),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/personnel/${id}`),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────────────────────────────────────────

export type CreateToolPayload = {
  name: string;
  category: string;
  serialNumber?: string;
  photoUrl?: string;
};

export type UpdateToolPayload = Partial<CreateToolPayload>;

// RG11/RG15/RG16: movementType OUT requires available, IN requires in_use
export type ToolMovementPayload = {
  movementType: "OUT" | "IN";
  responsibleId: string; // personnel ID
  notes?: string;
};

export const toolsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Tool> }>("/tools", {
        params,
      }),
    ),

  get: (id: string) =>
    extractData(api.get<{ success: boolean; data: Tool }>(`/tools/${id}`)),

  create: (body: CreateToolPayload) =>
    extractData(api.post<{ success: boolean; data: Tool }>("/tools", body)),

  update: (id: string, body: UpdateToolPayload) =>
    extractData(
      api.put<{ success: boolean; data: Tool }>(`/tools/${id}`, body),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/tools/${id}`),
    ),

  // POST /tools/:id/movements — returns { movement, tool, message }
  addMovement: (id: string, body: ToolMovementPayload) =>
    extractData(
      api.post<{
        success: boolean;
        data: {
          movement: unknown;
          tool: { id: string; name: string; status: string };
          message: string;
        };
      }>(`/tools/${id}/movements`, body),
    ),

  // GET /tools/:id/movements — paginated movement history
  listMovements: (id: string, params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        `/tools/${id}/movements`,
        { params },
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES
// ─────────────────────────────────────────────────────────────────────────────

export type CreateArticlePayload = {
  name: string;
  category: string;
  unit?: string;
  unitPrice: number;
  currency?: string;
  initialStock?: number; // sets stockQuantity on creation
};

export type UpdateArticlePayload = Partial<CreateArticlePayload>;

export const articlesService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Article> }>(
        "/articles",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: Article }>(`/articles/${id}`),
    ),

  create: (body: CreateArticlePayload) =>
    extractData(
      api.post<{ success: boolean; data: Article }>("/articles", body),
    ),

  update: (id: string, body: UpdateArticlePayload) =>
    extractData(
      api.put<{ success: boolean; data: Article }>(`/articles/${id}`, body),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/articles/${id}`),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// STOCK MOVEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const stockService = {
  // GET /stock/movements — paginated, filter by articleId / projectId / type
  movements: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/stock/movements",
        { params },
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTACTS (Clients / Suppliers / Subcontractors)
// ─────────────────────────────────────────────────────────────────────────────

export type CreateContactPayload = {
  contactType: "supplier" | "client" | "subcontractor";
  legalName: string;
  ifNumber?: string;
  iceNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
};

// contactType is immutable (RG17) — omit from update
export type UpdateContactPayload = Partial<
  Omit<CreateContactPayload, "contactType">
>;

export type CreateContactDocumentPayload = {
  documentName: string;
  documentType: string;
  fileUrl: string; // Cloudinary URL — upload first, pass URL
};

export const contactsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Contact> }>(
        "/contacts",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: Contact }>(`/contacts/${id}`),
    ),

  create: (body: CreateContactPayload) =>
    extractData(
      api.post<{ success: boolean; data: Contact }>("/contacts", body),
    ),

  update: (id: string, body: UpdateContactPayload) =>
    extractData(
      api.put<{ success: boolean; data: Contact }>(`/contacts/${id}`, body),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/contacts/${id}`),
    ),

  // ── Documents — JSON body, URL comes from /upload first
  listDocuments: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(
        `/contacts/${id}/documents`,
      ),
    ),

  addDocument: (id: string, body: CreateContactDocumentPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/contacts/${id}/documents`,
        body,
      ),
    ),

  // ── Filtered shorthands
  listClients: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Contact> }>(
        "/contacts",
        {
          params: { ...params, contactType: "client" },
        },
      ),
    ),

  listSuppliers: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Contact> }>(
        "/contacts",
        {
          params: { ...params, contactType: "supplier" },
        },
      ),
    ),

  listSubcontractors: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Contact> }>(
        "/contacts",
        {
          params: { ...params, contactType: "subcontractor" },
        },
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export type PurchaseOrderLine = {
  articleId: string;
  orderedQuantity: number;
  unitPrice: number;
  currency?: string;
};

export type CreatePurchaseOrderPayload = {
  supplierId: string; // must be contactType=supplier (RG08)
  projectId?: string;
  currency?: string;
  notes?: string;
  lines: PurchaseOrderLine[]; // backend field is "lines" not "items"
};

export const purchaseOrdersService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<PurchaseOrder> }>(
        "/purchase-orders",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: PurchaseOrder }>(
        `/purchase-orders/${id}`,
      ),
    ),

  create: (body: CreatePurchaseOrderPayload) =>
    extractData(
      api.post<{ success: boolean; data: PurchaseOrder }>(
        "/purchase-orders",
        body,
      ),
    ),

  // PATCH /purchase-orders/:id/confirm → W5: creates reception rows
  confirm: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: PurchaseOrder }>(
        `/purchase-orders/${id}/confirm`,
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const receptionsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/receptions",
        { params },
      ),
    ),

  // POST /receptions/:id/receive → W6: increments stock, updates PO status
  receive: (
    id: string,
    body: { receivedQuantity: number; notes?: string; receivedBy?: string },
  ) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/receptions/${id}/receive`,
        body,
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTACHMENTS
// ─────────────────────────────────────────────────────────────────────────────

export type CreateAttachmentPayload = {
  projectId: string;
  subcontractorId?: string; // required for external (auto-invoice)
  title: string;
  currency?: string;
  taskIds: string[]; // must all be completed (RG03)
};

export type ConfirmAttachmentPayload = {
  personnelCost?: number; // only for internal (no subcontractor)
  articlesCost?: number;
  toolsCost?: number;
};

export const attachmentsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/attachments",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/attachments/${id}`),
    ),

  create: (body: CreateAttachmentPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/attachments", body),
    ),

  // PATCH /attachments/:id/confirm → W7: calc costs, snapshot, auto-invoice if external
  confirm: (id: string, body?: ConfirmAttachmentPayload) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/attachments/${id}/confirm`,
        body ?? {},
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────────────────────────────────────

export const invoicesService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Invoice> }>(
        "/invoices",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: Invoice }>(`/invoices/${id}`),
    ),

  // PATCH /invoices/:id/validate → W8: status pending_validation → validated, PDF generated async
  validate: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: Invoice }>(
        `/invoices/${id}/validate`,
      ),
    ),

  // PATCH /invoices/:id/mark-paid → status validated → paid (RG19: no regression)
  markPaid: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: Invoice }>(
        `/invoices/${id}/mark-paid`,
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// NON-CONFORMITIES
// ─────────────────────────────────────────────────────────────────────────────

export type CreateNcPayload = {
  projectId: string;
  title: string;
  description: string;
  markerX?: number;
  markerY?: number;
  severity?: "low" | "medium" | "high" | "critical";
  location?: string;
  deadline?: string;
};

export type UpdateNcPayload = Partial<Omit<CreateNcPayload, "projectId">>;

export const ncService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<NonConformity> }>(
        "/non-conformities",
        { params },
      ),
    ),

  // GET returns NC + embedded images array
  get: (id: string) =>
    extractData(
      api.get<{
        success: boolean;
        data: NonConformity & { images: unknown[] };
      }>(`/non-conformities/${id}`),
    ),

  create: (body: CreateNcPayload) =>
    extractData(
      api.post<{ success: boolean; data: NonConformity }>(
        "/non-conformities",
        body,
      ),
    ),

  update: (id: string, body: UpdateNcPayload) =>
    extractData(
      api.put<{ success: boolean; data: NonConformity }>(
        `/non-conformities/${id}`,
        body,
      ),
    ),

  // PATCH /non-conformities/:id/status — state machine: open↔in_review→closed (closed is terminal)
  changeStatus: (id: string, status: "open" | "in_review" | "closed") =>
    extractData(
      api.patch<{ success: boolean; data: NonConformity }>(
        `/non-conformities/${id}/status`,
        { status },
      ),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(
        `/non-conformities/${id}`,
      ),
    ),

  // Images — upload to /upload/image first, pass Cloudinary URL
  listImages: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(
        `/non-conformities/${id}/images`,
      ),
    ),

  addImage: (id: string, imageUrl: string) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/non-conformities/${id}/images`,
        { imageUrl },
      ),
    ),

  // Plan with marker position (0-100% percentages)
  uploadPlan: (
    id: string,
    body: { planUrl: string; markerX?: number; markerY?: number },
  ) =>
    extractData(
      api.patch<{ success: boolean; data: NonConformity }>(
        `/non-conformities/${id}/plan`,
        body,
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS (central repository)
// ─────────────────────────────────────────────────────────────────────────────

export type CreateDocumentPayload = {
  sourceType:
    | "project"
    | "task"
    | "contact"
    | "nc"
    | "purchase_order"
    | "attachment";
  sourceId: string;
  documentName: string;
  fileUrl: string; // Cloudinary URL — upload first
  fileType: "pdf" | "image" | "xlsx" | "docx" | "other";
  fileSize: number; // bytes
  description?: string;
};

export const documentsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/documents",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/documents/${id}`),
    ),

  // POST /documents — JSON body with Cloudinary URL from /upload/file first
  create: (body: CreateDocumentPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/documents", body),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/documents/${id}`),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE — Subscriptions, Payments, Transactions
// ─────────────────────────────────────────────────────────────────────────────

export type CreateSubscriptionPayload = {
  companyName: string;
  billingType: "monthly" | "yearly";
  plan: "starter" | "business" | "enterprise";
  price: number;
  currency?: string;
  billingStartDate: string;
  paymentMethod: "credit_card" | "bank_transfer" | "check" | "cash";
};

export type CreateSupplierPaymentPayload = {
  supplierId: string; // must be contactType=supplier
  projectId?: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  currency?: string;
  notes?: string;
};

export type PaySupplierPayload = {
  amount: number; // must be <= remaining (RG-P01)
  paymentMethod: "credit_card" | "bank_transfer" | "check" | "cash";
  transactionReference?: string;
};

export type CreateSubcontractorPaymentPayload = {
  subcontractorId: string; // must be contactType=subcontractor
  projectId: string;
  taskId?: string;
  invoiceId?: string;
  contractAmount: number;
  currency?: string;
  notes?: string;
};

export type PaySubcontractorPayload = {
  amount: number; // must be <= remaining (RG-P01)
  paymentMethod: "credit_card" | "bank_transfer" | "check" | "cash";
  transactionReference?: string;
};

export type TransactionListParams = ListParams & {
  paymentType?: "subscription" | "supplier" | "subcontractor";
  status?: "pending" | "success" | "failed";
  projectId?: string;
  dateFrom?: string; // max range: 12 months (RG-P08)
  dateTo?: string;
};

export const financeService = {
  // GET /finance/dashboard → KPIs + 6-month chart + subscription status
  dashboard: () =>
    extractData(
      api.get<{ success: boolean; data: FinanceDashboard }>(
        "/finance/dashboard",
      ),
    ),

  // ── Subscriptions ──────────────────────────────────────────────────────────
  // GET /finance/subscriptions → single subscription for tenant
  getSubscription: () =>
    extractData(
      api.get<{ success: boolean; data: unknown }>("/finance/subscriptions"),
    ),

  // POST /finance/subscriptions → status starts as 'pending' (RG-P02: one per tenant)
  createSubscription: (body: CreateSubscriptionPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        "/finance/subscriptions",
        body,
      ),
    ),

  // POST /finance/subscriptions/webhook → W11: gateway callback → activates subscription
  processWebhook: (body: { transactionId: string; gatewayResponse?: object }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        "/finance/subscriptions/webhook",
        body,
      ),
    ),

  // ── Supplier Payments ──────────────────────────────────────────────────────
  listSupplierPayments: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/finance/supplier-payments",
        { params },
      ),
    ),

  createSupplierPayment: (body: CreateSupplierPaymentPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        "/finance/supplier-payments",
        body,
      ),
    ),

  // POST /finance/supplier-payments/:id/pay → W13: partial or full (RG-P01/RG-P05)
  paySupplier: (id: string, body: PaySupplierPayload) =>
    extractData(
      api.post<{
        success: boolean;
        data: {
          supplierPayment: unknown;
          transaction: unknown;
        };
      }>(`/finance/supplier-payments/${id}/pay`, body),
    ),

  // PATCH /finance/supplier-payments/:id/upload-invoice → attach Cloudinary PDF URL
  attachSupplierInvoice: (id: string, fileUrl: string) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/finance/supplier-payments/${id}/upload-invoice`,
        { fileUrl },
      ),
    ),

  // ── Subcontractor Payments ─────────────────────────────────────────────────
  listSubcontractorPayments: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/finance/subcontractor-payments",
        { params },
      ),
    ),

  createSubcontractorPayment: (body: CreateSubcontractorPaymentPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        "/finance/subcontractor-payments",
        body,
      ),
    ),

  // POST /finance/subcontractor-payments/:id/pay → partial or full (RG-P01)
  paySubcontractor: (id: string, body: PaySubcontractorPayload) =>
    extractData(
      api.post<{
        success: boolean;
        data: {
          subcontractorPayment: unknown;
          transaction: unknown;
        };
      }>(`/finance/subcontractor-payments/${id}/pay`, body),
    ),

  // ── Transactions (immutable ledger — RG-P03) ───────────────────────────────
  // GET /finance/transactions → max 12 months per request (RG-P08)
  listTransactions: (params: TransactionListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/finance/transactions",
        { params },
      ),
    ),

  // PATCH /finance/transactions/:id/validate → W12: admin/accountant only (RG-P04)
  validateTransaction: (id: string, body?: { notes?: string }) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/finance/transactions/${id}/validate`,
        body ?? {},
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// FORMATION — Tutorials + Support Tickets
// ─────────────────────────────────────────────────────────────────────────────

export type CreateTutorialPayload = {
  title: string;
  category: string;
  content: string; // HTML or Markdown
  videoUrl?: string;
  orderIndex?: number;
  published?: boolean;
};

export type UpdateTutorialPayload = Partial<CreateTutorialPayload>;

export const tutorialsService = {
  // GET /tutorials — non-admins see published only
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/tutorials",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/tutorials/${id}`),
    ),

  // POST /tutorials — admin only
  create: (body: CreateTutorialPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/tutorials", body),
    ),

  // PUT /tutorials/:id — admin only
  update: (id: string, body: UpdateTutorialPayload) =>
    extractData(
      api.put<{ success: boolean; data: unknown }>(`/tutorials/${id}`, body),
    ),

  // DELETE /tutorials/:id — admin only
  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/tutorials/${id}`),
    ),
};

export type CreateTicketPayload = {
  subject: string;
  description: string; // backend field is "description" not "message"
  priority?: "low" | "medium" | "high" | "urgent";
};

export const supportService = {
  listTickets: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/support/tickets",
        { params },
      ),
    ),

  // GET /support/tickets/:id → includes messages array
  getTicket: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/support/tickets/${id}`),
    ),

  createTicket: (body: CreateTicketPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/support/tickets", body),
    ),

  // POST /support/tickets/:id/messages — isSupportAgent auto-set from JWT role
  addMessage: (id: string, body: { message: string }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/support/tickets/${id}/messages`,
        body,
      ),
    ),

  // PATCH /support/tickets/:id/status — admin only
  changeStatus: (id: string, status: "open" | "in_progress" | "closed") =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/support/tickets/${id}/status`,
        { status },
      ),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD — Cloudinary
// ─────────────────────────────────────────────────────────────────────────────

type UploadFolder =
  | "documents"
  | "nc-images"
  | "nc-plans"
  | "contact-documents"
  | "supplier-invoices"
  | "avatars"
  | "invoices"
  | "barcodes";

export const uploadService = {
  // POST /upload/file — any document (PDF, DOCX, XLSX)
  file: (file: File, folder: UploadFolder = "documents") => {
    const fd = new FormData();
    fd.append("file", file);
    return extractData(
      api.post<{ success: boolean; data: UploadResult }>(
        `/upload/file?folder=${folder}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },

  // POST /upload/files — up to 10 files at once
  files: (files: File[], folder: UploadFolder = "documents") => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return extractData(
      api.post<{ success: boolean; data: UploadResult[] }>(
        `/upload/files?folder=${folder}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },

  // POST /upload/image — images only (JPG, PNG, WebP) — validates MIME type
  image: (file: File, folder: UploadFolder = "nc-images") => {
    const fd = new FormData();
    fd.append("file", file);
    return extractData(
      api.post<{ success: boolean; data: UploadResult }>(
        `/upload/image?folder=${folder}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS — Team management
// ─────────────────────────────────────────────────────────────────────────────

export type InviteUserPayload = {
  fullName: string;
  email: string;
  role: "project_manager" | "site_manager" | "accountant" | "viewer";
  password: string;
};

export type UpdateUserPayload = {
  fullName?: string;
  role?: "project_manager" | "site_manager" | "accountant" | "viewer";
  isActive?: boolean;
};

export const usersService = {
  // GET /users/me — current user profile
  me: () =>
    extractData(api.get<{ success: boolean; data: unknown }>("/users/me")),

  // PATCH /users/me — update own name
  updateMe: (body: { fullName: string }) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>("/users/me", body),
    ),

  // GET /users — list team members (admin/PM)
  listTeam: () =>
    extractData(api.get<{ success: boolean; data: unknown[] }>("/users")),

  // POST /users/invite — admin only
  invite: (body: InviteUserPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/users/invite", body),
    ),

  // PATCH /users/:id — admin only
  update: (id: string, body: UpdateUserPayload) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(`/users/${id}`, body),
    ),

  // DELETE /users/:id — deactivates (admin only)
  deactivate: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/users/${id}`),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// OPÉRATEURS
// ─────────────────────────────────────────────────────────────────────────────
export const operateursService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/operateurs",
        { params },
      ),
    ),
  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/operateurs/${id}`),
    ),
  create: (body: {
    nomComplet: string;
    typeContrat: "cdd" | "journalier";
    tauxJournalier?: number;
    currency?: string;
    cin?: string;
    telephone?: string;
    projetActuelId?: string;
  }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/operateurs", body),
    ),
  update: (id: string, body: Record<string, unknown>) =>
    extractData(
      api.put<{ success: boolean; data: unknown }>(`/operateurs/${id}`, body),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// POINTAGES
// ─────────────────────────────────────────────────────────────────────────────
export const pointagesService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/pointages",
        { params },
      ),
    ),
  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/pointages/${id}`),
    ),
  create: (body: {
    operateurId: string;
    projetId: string;
    tacheId?: string;
    datePointage: string;
    heureDebut?: string;
    heureFin?: string;
    statutPresence: "present" | "absent" | "retard" | "demi_journee";
    typeContrat?: "cdd" | "journalier";
    commentaire?: string;
  }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/pointages", body),
    ),
  update: (id: string, body: Record<string, unknown>) =>
    extractData(
      api.put<{ success: boolean; data: unknown }>(`/pointages/${id}`, body),
    ),
  valider: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/pointages/${id}/valider`,
      ),
    ),
  calendrier: (
    operateurId: string,
    mois: number,
    annee: number,
    projetId?: string,
  ) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>("/pointages/calendrier", {
        params: { operateurId, mois, annee, ...(projetId && { projetId }) },
      }),
    ),
  stats: (params: { projetId?: string; mois?: number; annee?: number } = {}) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>("/pointages/stats", {
        params,
      }),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANS
// ─────────────────────────────────────────────────────────────────────────────
export const plansService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>("/plans", {
        params,
      }),
    ),
  get: (id: string) =>
    extractData(api.get<{ success: boolean; data: unknown }>(`/plans/${id}`)),
  create: (body: {
    projetId: string;
    nom: string;
    categorie: string;
    fileUrl: string;
    fileType: string;
    reference?: string;
    description?: string;
    largeurPx?: number;
    hauteurPx?: number;
  }) =>
    extractData(api.post<{ success: boolean; data: unknown }>("/plans", body)),
  update: (id: string, body: Record<string, unknown>) =>
    extractData(
      api.put<{ success: boolean; data: unknown }>(`/plans/${id}`, body),
    ),
  nouvelleVersion: (
    id: string,
    body: { fileUrl: string; fileType: string; commentaireVersion?: string },
  ) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/plans/${id}/nouvelle-version`,
        body,
      ),
    ),
  getVersions: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(`/plans/${id}/versions`),
    ),
  getNonConformites: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(
        `/plans/${id}/non-conformites`,
      ),
    ),
  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/plans/${id}`),
    ),
  listByProjet: (projetId: string) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>("/plans", {
        params: { projetId, statut: "actif", limit: 100 },
      }),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORTING
// ─────────────────────────────────────────────────────────────────────────────
export const reportingService = {
  overview: () =>
    extractData(
      api.get<{ success: boolean; data: unknown }>("/reporting/overview"),
    ),
  projects: () =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>("/reporting/projects"),
    ),
  tasks: (projectId?: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>("/reporting/tasks", {
        params: projectId ? { projectId } : {},
      }),
    ),
  nonConformities: () =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(
        "/reporting/non-conformities",
      ),
    ),
  finance: (months = 6) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>("/reporting/finance", {
        params: { months },
      }),
    ),
  stock: () =>
    extractData(
      api.get<{ success: boolean; data: unknown }>("/reporting/stock"),
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH (public — no auth needed)
// ─────────────────────────────────────────────────────────────────────────────

export const healthService = {
  ping: () =>
    extractData(
      api.get<{
        success: boolean;
        data: {
          status: string;
          version: string;
          environment: string;
          uptime: number;
        };
      }>("/health/ping"),
    ),

  check: () =>
    extractData(api.get<{ success: boolean; data: unknown }>("/health")),
};
