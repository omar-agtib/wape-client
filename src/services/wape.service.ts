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

// ── Generic helpers ───────────────────────────────────────────────────────────

type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authService = {
  register: (body: {
    companyName: string;
    slug: string;
    fullName: string;
    email: string;
    password: string;
  }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/auth/register", body),
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
};

// ── Projects ──────────────────────────────────────────────────────────────────

export type CreateProjectPayload = {
  name: string;
  clientId?: string;
  description?: string;
  budget: number;
  currency?: string;
  startDate: string;
  endDate: string;
  status?: "planned" | "on_progress" | "completed";
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
      api.get<{ success: boolean; data: unknown }>(`/projects/${id}/finance`),
    ),

  getTasks: (id: string, params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Task> }>(
        `/projects/${id}/tasks`,
        { params },
      ),
    ),

  getAttachments: (id: string, params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        `/projects/${id}/attachments`,
        { params },
      ),
    ),

  getPurchaseOrders: (id: string, params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<PurchaseOrder> }>(
        `/projects/${id}/purchase-orders`,
        { params },
      ),
    ),

  getGantt: (id: string, params?: Record<string, string>) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/projects/${id}/gantt`, {
        params,
      }),
    ),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type CreateTaskPayload = {
  projectId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: "planned" | "on_progress" | "completed";
  estimatedCost?: number;
  currency?: string;
};

export type UpdateTaskPayload = Partial<Omit<CreateTaskPayload, "projectId">>;

export type TaskPersonnelPayload = {
  personnelId: string;
  plannedHours: number;
  startDate?: string;
  endDate?: string;
};

export type TaskArticlePayload = {
  articleId: string;
  plannedQuantity: number;
};

export type TaskToolPayload = {
  toolId: string;
  plannedDays: number;
  startDate?: string;
  endDate?: string;
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

  // ── Task Personnel
  addPersonnel: (id: string, body: TaskPersonnelPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/tasks/${id}/personnel`,
        body,
      ),
    ),

  listPersonnel: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(`/tasks/${id}/personnel`),
    ),

  updatePersonnel: (
    id: string,
    rid: string,
    body: Partial<TaskPersonnelPayload>,
  ) =>
    extractData(
      api.put<{ success: boolean; data: unknown }>(
        `/tasks/${id}/personnel/${rid}`,
        body,
      ),
    ),

  removePersonnel: (id: string, rid: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(
        `/tasks/${id}/personnel/${rid}`,
      ),
    ),

  // ── Task Articles
  addArticle: (id: string, body: TaskArticlePayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/tasks/${id}/articles`,
        body,
      ),
    ),

  listArticles: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(`/tasks/${id}/articles`),
    ),

  updateArticle: (id: string, rid: string, body: Partial<TaskArticlePayload>) =>
    extractData(
      api.put<{ success: boolean; data: unknown }>(
        `/tasks/${id}/articles/${rid}`,
        body,
      ),
    ),

  removeArticle: (id: string, rid: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(
        `/tasks/${id}/articles/${rid}`,
      ),
    ),

  // ── Task Tools
  addTool: (id: string, body: TaskToolPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(`/tasks/${id}/tools`, body),
    ),

  listTools: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(`/tasks/${id}/tools`),
    ),

  updateTool: (id: string, rid: string, body: Partial<TaskToolPayload>) =>
    extractData(
      api.put<{ success: boolean; data: unknown }>(
        `/tasks/${id}/tools/${rid}`,
        body,
      ),
    ),

  removeTool: (id: string, rid: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(
        `/tasks/${id}/tools/${rid}`,
      ),
    ),
};

// ── Personnel ─────────────────────────────────────────────────────────────────

export type CreatePersonnelPayload = {
  fullName: string;
  role: string;
  costPerHour: number;
  currency?: string;
  email?: string;
  phone?: string;
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

// ── Tools ─────────────────────────────────────────────────────────────────────

export type CreateToolPayload = {
  name: string;
  category: string;
  serialNumber?: string;
  photoUrl?: string;
  status?: "available" | "in_use" | "maintenance" | "retired";
};

export type UpdateToolPayload = Partial<CreateToolPayload>;

export type ToolMovementPayload = {
  type: "check_out" | "check_in" | "maintenance" | "retired";
  projectId?: string;
  taskId?: string;
  notes?: string;
  date?: string;
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

  addMovement: (id: string, body: ToolMovementPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/tools/${id}/movements`,
        body,
      ),
    ),

  listMovements: (id: string, params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        `/tools/${id}/movements`,
        { params },
      ),
    ),
};

// ── Articles ──────────────────────────────────────────────────────────────────

export type CreateArticlePayload = {
  name: string;
  category: string;
  unit?: string;
  unitPrice: number;
  currency?: string;
  stockQuantity?: number;
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

// ── Stock ─────────────────────────────────────────────────────────────────────

export const stockService = {
  movements: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/stock/movements",
        { params },
      ),
    ),
};

// ── Contacts ──────────────────────────────────────────────────────────────────

export type CreateContactPayload = {
  contactType: "supplier" | "client" | "subcontractor";
  legalName: string;
  ifNumber?: string;
  iceNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type UpdateContactPayload = Partial<
  Omit<CreateContactPayload, "contactType">
>;

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

  // ── Contact Documents
  uploadDocument: (id: string, file: File, folder = "contacts") => {
    const formData = new FormData();
    formData.append("file", file);
    return extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/contacts/${id}/documents?folder=${folder}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },

  listDocuments: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(
        `/contacts/${id}/documents`,
      ),
    ),

  // ── Filtered shorthands
  listClients: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Contact> }>(
        "/contacts",
        { params: { ...params, contactType: "client" } },
      ),
    ),

  listSuppliers: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Contact> }>(
        "/contacts",
        { params: { ...params, contactType: "supplier" } },
      ),
    ),

  listSubcontractors: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Contact> }>(
        "/contacts",
        { params: { ...params, contactType: "subcontractor" } },
      ),
    ),
};

// ── Purchase Orders ───────────────────────────────────────────────────────────

export type CreatePurchaseOrderPayload = {
  supplierId: string;
  projectId?: string;
  orderDate?: string;
  currency?: string;
  notes?: string;
  items: {
    articleId: string;
    quantity: number;
    unitPrice: number;
  }[];
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

  confirm: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: PurchaseOrder }>(
        `/purchase-orders/${id}/confirm`,
      ),
    ),
};

// ── Receptions ────────────────────────────────────────────────────────────────

export const receptionsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/receptions",
        { params },
      ),
    ),

  receive: (id: string, body: { receivedQuantity: number; notes?: string }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/receptions/${id}/receive`,
        body,
      ),
    ),
};

// ── Attachments ───────────────────────────────────────────────────────────────

export type CreateAttachmentPayload = {
  projectId: string;
  taskId?: string;
  subcontractorId: string;
  description?: string;
  amount: number;
  currency?: string;
  startDate: string;
  endDate: string;
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

  confirm: (
    id: string,
    body?: {
      personnelCost?: number;
      articlesCost?: number;
      toolsCost?: number;
    },
  ) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/attachments/${id}/confirm`,
        body ?? {},
      ),
    ),
};

// ── Invoices ──────────────────────────────────────────────────────────────────

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

  validate: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: Invoice }>(
        `/invoices/${id}/validate`,
      ),
    ),

  markPaid: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: Invoice }>(
        `/invoices/${id}/mark-paid`,
      ),
    ),

  getPdf: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: { url: string } }>(
        `/invoices/${id}/pdf`,
      ),
    ),
};

// ── Non-Conformities ──────────────────────────────────────────────────────────

export type CreateNcPayload = {
  projectId: string;
  title: string;
  description: string;
  markerX?: number;
  markerY?: number;
};

export type UpdateNcPayload = Partial<
  Omit<CreateNcPayload, "projectId"> & { planUrl?: string }
>;

export const ncService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<NonConformity> }>(
        "/non-conformities",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: NonConformity }>(
        `/non-conformities/${id}`,
      ),
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

  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/non-conformities/${id}/images`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },

  listImages: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>(
        `/non-conformities/${id}/images`,
      ),
    ),

  uploadPlan: (id: string, planUrl: string) =>
    extractData(
      api.patch<{ success: boolean; data: NonConformity }>(
        `/non-conformities/${id}/plan`,
        { planUrl },
      ),
    ),
};

// ── Documents ─────────────────────────────────────────────────────────────────

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

  upload: (file: File, folder = "documents", meta?: Record<string, string>) => {
    const formData = new FormData();
    formData.append("file", file);
    if (meta) {
      Object.entries(meta).forEach(([k, v]) => formData.append(k, v));
    }
    return extractData(
      api.post<{ success: boolean; data: unknown }>("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        params: { folder },
      }),
    );
  },

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/documents/${id}`),
    ),
};

// ── Finance ───────────────────────────────────────────────────────────────────

export type CreateSupplierPaymentPayload = {
  supplierId: string;
  purchaseOrderId?: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  notes?: string;
};

export type CreateSubcontractorPaymentPayload = {
  subcontractorId: string;
  attachmentId?: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  notes?: string;
};

export const financeService = {
  dashboard: () =>
    extractData(
      api.get<{ success: boolean; data: FinanceDashboard }>(
        "/finance/dashboard",
      ),
    ),

  // ── Subscriptions
  getSubscriptions: () =>
    extractData(
      api.get<{ success: boolean; data: unknown[] }>("/finance/subscriptions"),
    ),

  createSubscription: (body: { plan: string; [key: string]: unknown }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        "/finance/subscriptions",
        body,
      ),
    ),

  // ── Supplier payments
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

  paySupplier: (id: string, body?: { reference?: string; notes?: string }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/finance/supplier-payments/${id}/pay`,
        body ?? {},
      ),
    ),

  uploadSupplierInvoice: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/finance/supplier-payments/${id}/upload-invoice`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },

  // ── Subcontractor payments
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

  paySubcontractor: (
    id: string,
    body?: { reference?: string; notes?: string },
  ) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/finance/subcontractor-payments/${id}/pay`,
        body ?? {},
      ),
    ),

  // ── Transactions
  listTransactions: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/finance/transactions",
        { params },
      ),
    ),

  validateTransaction: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/finance/transactions/${id}/validate`,
      ),
    ),
};

// ── Tutorials ─────────────────────────────────────────────────────────────────

export type CreateTutorialPayload = {
  title: string;
  content: string;
  category?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
};

export type UpdateTutorialPayload = Partial<CreateTutorialPayload>;

export const tutorialsService = {
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

  create: (body: CreateTutorialPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/tutorials", body),
    ),

  update: (id: string, body: UpdateTutorialPayload) =>
    extractData(
      api.put<{ success: boolean; data: unknown }>(`/tutorials/${id}`, body),
    ),

  delete: (id: string) =>
    extractData(
      api.delete<{ success: boolean; data: unknown }>(`/tutorials/${id}`),
    ),
};

// ── Support Tickets ───────────────────────────────────────────────────────────

export type CreateTicketPayload = {
  subject: string;
  message: string;
  priority?: "low" | "medium" | "high";
};

export const supportService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/support/tickets",
        { params },
      ),
    ),

  get: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/support/tickets/${id}`),
    ),

  create: (body: CreateTicketPayload) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>("/support/tickets", body),
    ),

  addMessage: (id: string, body: { message: string; attachmentUrl?: string }) =>
    extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/support/tickets/${id}/messages`,
        body,
      ),
    ),

  changeStatus: (
    id: string,
    status: "open" | "in_progress" | "resolved" | "closed",
  ) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
        `/support/tickets/${id}/status`,
        { status },
      ),
    ),
};

// ── Upload ────────────────────────────────────────────────────────────────────

export const uploadService = {
  file: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return extractData(
      api.post<{ success: boolean; data: UploadResult }>(
        `/upload/file?folder=${folder}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },

  files: (files: File[], folder: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return extractData(
      api.post<{ success: boolean; data: UploadResult[] }>(
        `/upload/files?folder=${folder}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },

  image: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return extractData(
      api.post<{ success: boolean; data: UploadResult }>(
        `/upload/image?folder=${folder}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },
};
