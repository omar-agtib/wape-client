import { api, extractData } from "../lib/api";
import type {
  Project,
  Task,
  Personnel,
  Article,
  Contact,
  NonConformity,
  Invoice,
  PurchaseOrder,
  FinanceDashboard,
  PaginatedResult,
} from "../types/api";

// ── Generic paginated list helper ────────────────────────────────────────────
type ListParams = {
  page?: number;
  limit?: number;
  [key: string]: unknown;
};

// ── Projects ──────────────────────────────────────────────────────────────────
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
      api.get<{
        success: boolean;
        data: Project & { financeSnapshot?: unknown };
      }>(`/projects/${id}`),
    ),

  getFinance: (id: string) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/projects/${id}/finance`),
    ),

  getGantt: (id: string, params?: Record<string, string>) =>
    extractData(
      api.get<{ success: boolean; data: unknown }>(`/projects/${id}/gantt`, {
        params,
      }),
    ),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<Task> }>("/tasks", {
        params,
      }),
    ),

  get: (id: string) =>
    extractData(api.get<{ success: boolean; data: Task }>(`/tasks/${id}`)),

  changeStatus: (id: string, status: string) =>
    extractData(
      api.patch<{ success: boolean; data: Task }>(`/tasks/${id}/status`, {
        status,
      }),
    ),
};

// ── Personnel ─────────────────────────────────────────────────────────────────
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
};

// ── Tools ─────────────────────────────────────────────────────────────────────
export const toolsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>("/tools", {
        params,
      }),
    ),
};

// ── Articles ──────────────────────────────────────────────────────────────────
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

// ── Contacts (Clients / Suppliers / Subcontractors) ───────────────────────────
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

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const purchaseOrdersService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<PurchaseOrder> }>(
        "/purchase-orders",
        { params },
      ),
    ),

  confirm: (id: string) =>
    extractData(
      api.patch<{ success: boolean; data: unknown }>(
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
export const attachmentsService = {
  list: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/attachments",
        { params },
      ),
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
};

// ── Non-Conformities ──────────────────────────────────────────────────────────
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
};

// ── Finance ───────────────────────────────────────────────────────────────────
export const financeService = {
  dashboard: () =>
    extractData(
      api.get<{ success: boolean; data: FinanceDashboard }>(
        "/finance/dashboard",
      ),
    ),

  supplierPayments: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/finance/supplier-payments",
        { params },
      ),
    ),

  subcontractorPayments: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/finance/subcontractor-payments",
        { params },
      ),
    ),

  transactions: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/finance/transactions",
        { params },
      ),
    ),
};

// ── Support ───────────────────────────────────────────────────────────────────
export const supportService = {
  tickets: (params: ListParams = {}) =>
    extractData(
      api.get<{ success: boolean; data: PaginatedResult<unknown> }>(
        "/support/tickets",
        { params },
      ),
    ),
};

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadService = {
  file: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/upload/file?folder=${folder}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      ),
    );
  },

  image: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return extractData(
      api.post<{ success: boolean; data: unknown }>(
        `/upload/image?folder=${folder}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      ),
    );
  },
};
