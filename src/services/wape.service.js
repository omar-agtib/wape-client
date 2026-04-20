import { api, extractData } from "@/lib/api";
// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const authService = {
    register: (body) => extractData(api.post("/auth/register", body)),
    login: (body) => extractData(api.post("/auth/login", body)),
    refresh: (refreshToken) => extractData(api.post("/auth/refresh", {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
    })),
    me: () => extractData(api.get("/auth/me")),
    // POST /auth/logout — invalidates refresh token on server
    logout: (refreshToken) => extractData(api.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
    })),
};
export const projectsService = {
    list: (params = {}) => extractData(api.get("/projects", { params })),
    get: (id) => extractData(api.get(`/projects/${id}`)),
    create: (body) => extractData(api.post("/projects", body)),
    update: (id, body) => extractData(api.put(`/projects/${id}`, body)),
    delete: (id) => extractData(api.delete(`/projects/${id}`)),
    getFinance: (id) => extractData(api.get(`/projects/${id}/finance`)),
    getGantt: (id, params) => extractData(api.get(`/projects/${id}/gantt`, { params })),
    getPurchaseOrders: (id) => extractData(api.get(`/projects/${id}/purchase-orders`)),
};
export const tasksService = {
    list: (params = {}) => extractData(api.get("/tasks", {
        params,
    })),
    get: (id) => extractData(api.get(`/tasks/${id}`)),
    create: (body) => extractData(api.post("/tasks", body)),
    update: (id, body) => extractData(api.put(`/tasks/${id}`, body)),
    // PATCH /tasks/:id/status — enforces state machine (planned→on_progress→completed)
    changeStatus: (id, status) => extractData(api.patch(`/tasks/${id}/status`, {
        status,
    })),
    delete: (id) => extractData(api.delete(`/tasks/${id}`)),
    // ── Personnel
    listPersonnel: (taskId) => extractData(api.get(`/tasks/${taskId}/personnel`)),
    addPersonnel: (taskId, body) => extractData(api.post(`/tasks/${taskId}/personnel`, body)),
    removePersonnel: (taskId, taskPersonnelId) => extractData(api.delete(`/tasks/${taskId}/personnel/${taskPersonnelId}`)),
    // ── Articles
    listArticles: (taskId) => extractData(api.get(`/tasks/${taskId}/articles`)),
    addArticle: (taskId, body) => extractData(api.post(`/tasks/${taskId}/articles`, body)),
    removeArticle: (taskId, taskArticleId) => extractData(api.delete(`/tasks/${taskId}/articles/${taskArticleId}`)),
    // ── Tools
    listTools: (taskId) => extractData(api.get(`/tasks/${taskId}/tools`)),
    addTool: (taskId, body) => extractData(api.post(`/tasks/${taskId}/tools`, body)),
    removeTool: (taskId, taskToolId) => extractData(api.delete(`/tasks/${taskId}/tools/${taskToolId}`)),
};
export const personnelService = {
    list: (params = {}) => extractData(api.get("/personnel", { params })),
    get: (id) => extractData(api.get(`/personnel/${id}`)),
    create: (body) => extractData(api.post("/personnel", body)),
    update: (id, body) => extractData(api.put(`/personnel/${id}`, body)),
    delete: (id) => extractData(api.delete(`/personnel/${id}`)),
};
export const toolsService = {
    list: (params = {}) => extractData(api.get("/tools", {
        params,
    })),
    get: (id) => extractData(api.get(`/tools/${id}`)),
    create: (body) => extractData(api.post("/tools", body)),
    update: (id, body) => extractData(api.put(`/tools/${id}`, body)),
    delete: (id) => extractData(api.delete(`/tools/${id}`)),
    // POST /tools/:id/movements — returns { movement, tool, message }
    addMovement: (id, body) => extractData(api.post(`/tools/${id}/movements`, body)),
    // GET /tools/:id/movements — paginated movement history
    listMovements: (id, params = {}) => extractData(api.get(`/tools/${id}/movements`, { params })),
};
export const articlesService = {
    list: (params = {}) => extractData(api.get("/articles", { params })),
    get: (id) => extractData(api.get(`/articles/${id}`)),
    create: (body) => extractData(api.post("/articles", body)),
    update: (id, body) => extractData(api.put(`/articles/${id}`, body)),
    delete: (id) => extractData(api.delete(`/articles/${id}`)),
};
// ─────────────────────────────────────────────────────────────────────────────
// STOCK MOVEMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const stockService = {
    // GET /stock/movements — paginated, filter by articleId / projectId / type
    movements: (params = {}) => extractData(api.get("/stock/movements", { params })),
};
export const contactsService = {
    list: (params = {}) => extractData(api.get("/contacts", { params })),
    get: (id) => extractData(api.get(`/contacts/${id}`)),
    create: (body) => extractData(api.post("/contacts", body)),
    update: (id, body) => extractData(api.put(`/contacts/${id}`, body)),
    delete: (id) => extractData(api.delete(`/contacts/${id}`)),
    // ── Documents — JSON body, URL comes from /upload first
    listDocuments: (id) => extractData(api.get(`/contacts/${id}/documents`)),
    addDocument: (id, body) => extractData(api.post(`/contacts/${id}/documents`, body)),
    // ── Filtered shorthands
    listClients: (params = {}) => extractData(api.get("/contacts", {
        params: { ...params, contactType: "client" },
    })),
    listSuppliers: (params = {}) => extractData(api.get("/contacts", {
        params: { ...params, contactType: "supplier" },
    })),
    listSubcontractors: (params = {}) => extractData(api.get("/contacts", {
        params: { ...params, contactType: "subcontractor" },
    })),
};
export const purchaseOrdersService = {
    list: (params = {}) => extractData(api.get("/purchase-orders", { params })),
    get: (id) => extractData(api.get(`/purchase-orders/${id}`)),
    create: (body) => extractData(api.post("/purchase-orders", body)),
    // PATCH /purchase-orders/:id/confirm → W5: creates reception rows
    confirm: (id) => extractData(api.patch(`/purchase-orders/${id}/confirm`)),
};
// ─────────────────────────────────────────────────────────────────────────────
// RECEPTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const receptionsService = {
    list: (params = {}) => extractData(api.get("/receptions", { params })),
    // POST /receptions/:id/receive → W6: increments stock, updates PO status
    receive: (id, body) => extractData(api.post(`/receptions/${id}/receive`, body)),
};
export const attachmentsService = {
    list: (params = {}) => extractData(api.get("/attachments", { params })),
    get: (id) => extractData(api.get(`/attachments/${id}`)),
    create: (body) => extractData(api.post("/attachments", body)),
    // PATCH /attachments/:id/confirm → W7: calc costs, snapshot, auto-invoice if external
    confirm: (id, body) => extractData(api.patch(`/attachments/${id}/confirm`, body ?? {})),
};
// ─────────────────────────────────────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────────────────────────────────────
export const invoicesService = {
    list: (params = {}) => extractData(api.get("/invoices", { params })),
    get: (id) => extractData(api.get(`/invoices/${id}`)),
    // PATCH /invoices/:id/validate → W8: status pending_validation → validated, PDF generated async
    validate: (id) => extractData(api.patch(`/invoices/${id}/validate`)),
    // PATCH /invoices/:id/mark-paid → status validated → paid (RG19: no regression)
    markPaid: (id) => extractData(api.patch(`/invoices/${id}/mark-paid`)),
};
export const ncService = {
    list: (params = {}) => extractData(api.get("/non-conformities", { params })),
    // GET returns NC + embedded images array
    get: (id) => extractData(api.get(`/non-conformities/${id}`)),
    create: (body) => extractData(api.post("/non-conformities", body)),
    update: (id, body) => extractData(api.put(`/non-conformities/${id}`, body)),
    // PATCH /non-conformities/:id/status — state machine: open↔in_review→closed (closed is terminal)
    changeStatus: (id, status) => extractData(api.patch(`/non-conformities/${id}/status`, { status })),
    delete: (id) => extractData(api.delete(`/non-conformities/${id}`)),
    // Images — upload to /upload/image first, pass Cloudinary URL
    listImages: (id) => extractData(api.get(`/non-conformities/${id}/images`)),
    addImage: (id, imageUrl) => extractData(api.post(`/non-conformities/${id}/images`, { imageUrl })),
    // Plan with marker position (0-100% percentages)
    uploadPlan: (id, body) => extractData(api.patch(`/non-conformities/${id}/plan`, body)),
};
export const documentsService = {
    list: (params = {}) => extractData(api.get("/documents", { params })),
    get: (id) => extractData(api.get(`/documents/${id}`)),
    // POST /documents — JSON body with Cloudinary URL from /upload/file first
    create: (body) => extractData(api.post("/documents", body)),
    delete: (id) => extractData(api.delete(`/documents/${id}`)),
};
export const financeService = {
    // GET /finance/dashboard → KPIs + 6-month chart + subscription status
    dashboard: () => extractData(api.get("/finance/dashboard")),
    // ── Subscriptions ──────────────────────────────────────────────────────────
    // GET /finance/subscriptions → single subscription for tenant
    getSubscription: () => extractData(api.get("/finance/subscriptions")),
    // POST /finance/subscriptions → status starts as 'pending' (RG-P02: one per tenant)
    createSubscription: (body) => extractData(api.post("/finance/subscriptions", body)),
    // POST /finance/subscriptions/webhook → W11: gateway callback → activates subscription
    processWebhook: (body) => extractData(api.post("/finance/subscriptions/webhook", body)),
    // ── Supplier Payments ──────────────────────────────────────────────────────
    listSupplierPayments: (params = {}) => extractData(api.get("/finance/supplier-payments", { params })),
    createSupplierPayment: (body) => extractData(api.post("/finance/supplier-payments", body)),
    // POST /finance/supplier-payments/:id/pay → W13: partial or full (RG-P01/RG-P05)
    paySupplier: (id, body) => extractData(api.post(`/finance/supplier-payments/${id}/pay`, body)),
    // PATCH /finance/supplier-payments/:id/upload-invoice → attach Cloudinary PDF URL
    attachSupplierInvoice: (id, fileUrl) => extractData(api.patch(`/finance/supplier-payments/${id}/upload-invoice`, { fileUrl })),
    // ── Subcontractor Payments ─────────────────────────────────────────────────
    listSubcontractorPayments: (params = {}) => extractData(api.get("/finance/subcontractor-payments", { params })),
    createSubcontractorPayment: (body) => extractData(api.post("/finance/subcontractor-payments", body)),
    // POST /finance/subcontractor-payments/:id/pay → partial or full (RG-P01)
    paySubcontractor: (id, body) => extractData(api.post(`/finance/subcontractor-payments/${id}/pay`, body)),
    // ── Transactions (immutable ledger — RG-P03) ───────────────────────────────
    // GET /finance/transactions → max 12 months per request (RG-P08)
    listTransactions: (params = {}) => extractData(api.get("/finance/transactions", { params })),
    // PATCH /finance/transactions/:id/validate → W12: admin/accountant only (RG-P04)
    validateTransaction: (id, body) => extractData(api.patch(`/finance/transactions/${id}/validate`, body ?? {})),
};
export const tutorialsService = {
    // GET /tutorials — non-admins see published only
    list: (params = {}) => extractData(api.get("/tutorials", { params })),
    get: (id) => extractData(api.get(`/tutorials/${id}`)),
    // POST /tutorials — admin only
    create: (body) => extractData(api.post("/tutorials", body)),
    // PUT /tutorials/:id — admin only
    update: (id, body) => extractData(api.put(`/tutorials/${id}`, body)),
    // DELETE /tutorials/:id — admin only
    delete: (id) => extractData(api.delete(`/tutorials/${id}`)),
};
export const supportService = {
    listTickets: (params = {}) => extractData(api.get("/support/tickets", { params })),
    // GET /support/tickets/:id → includes messages array
    getTicket: (id) => extractData(api.get(`/support/tickets/${id}`)),
    createTicket: (body) => extractData(api.post("/support/tickets", body)),
    // POST /support/tickets/:id/messages — isSupportAgent auto-set from JWT role
    addMessage: (id, body) => extractData(api.post(`/support/tickets/${id}/messages`, body)),
    // PATCH /support/tickets/:id/status — admin only
    changeStatus: (id, status) => extractData(api.patch(`/support/tickets/${id}/status`, { status })),
};
export const uploadService = {
    // POST /upload/file — any document (PDF, DOCX, XLSX)
    file: (file, folder = "documents") => {
        const fd = new FormData();
        fd.append("file", file);
        return extractData(api.post(`/upload/file?folder=${folder}`, fd, { headers: { "Content-Type": "multipart/form-data" } }));
    },
    // POST /upload/files — up to 10 files at once
    files: (files, folder = "documents") => {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        return extractData(api.post(`/upload/files?folder=${folder}`, fd, { headers: { "Content-Type": "multipart/form-data" } }));
    },
    // POST /upload/image — images only (JPG, PNG, WebP) — validates MIME type
    image: (file, folder = "nc-images") => {
        const fd = new FormData();
        fd.append("file", file);
        return extractData(api.post(`/upload/image?folder=${folder}`, fd, { headers: { "Content-Type": "multipart/form-data" } }));
    },
};
export const usersService = {
    // GET /users/me — current user profile
    me: () => extractData(api.get("/users/me")),
    // PATCH /users/me — update own name
    updateMe: (body) => extractData(api.patch("/users/me", body)),
    // GET /users — list team members (admin/PM)
    listTeam: () => extractData(api.get("/users")),
    // POST /users/invite — admin only
    invite: (body) => extractData(api.post("/users/invite", body)),
    // PATCH /users/:id — admin only
    update: (id, body) => extractData(api.patch(`/users/${id}`, body)),
    // DELETE /users/:id — deactivates (admin only)
    deactivate: (id) => extractData(api.delete(`/users/${id}`)),
};
// ─────────────────────────────────────────────────────────────────────────────
// OPÉRATEURS
// ─────────────────────────────────────────────────────────────────────────────
export const operateursService = {
    list: (params = {}) => extractData(api.get("/operateurs", { params })),
    get: (id) => extractData(api.get(`/operateurs/${id}`)),
    create: (body) => extractData(api.post("/operateurs", body)),
    update: (id, body) => extractData(api.put(`/operateurs/${id}`, body)),
};
// ─────────────────────────────────────────────────────────────────────────────
// POINTAGES
// ─────────────────────────────────────────────────────────────────────────────
export const pointagesService = {
    list: (params = {}) => extractData(api.get("/pointages", { params })),
    get: (id) => extractData(api.get(`/pointages/${id}`)),
    create: (body) => extractData(api.post("/pointages", body)),
    update: (id, body) => extractData(api.put(`/pointages/${id}`, body)),
    valider: (id) => extractData(api.patch(`/pointages/${id}/valider`)),
    calendrier: (operateurId, mois, annee, projetId) => extractData(api.get("/pointages/calendrier", {
        params: { operateurId, mois, annee, ...(projetId && { projetId }) },
    })),
    stats: (params = {}) => extractData(api.get("/pointages/stats", {
        params,
    })),
};
// ─────────────────────────────────────────────────────────────────────────────
// PLANS
// ─────────────────────────────────────────────────────────────────────────────
export const plansService = {
    list: (params = {}) => extractData(api.get("/plans", {
        params,
    })),
    get: (id) => extractData(api.get(`/plans/${id}`)),
    create: (body) => extractData(api.post("/plans", body)),
    update: (id, body) => extractData(api.put(`/plans/${id}`, body)),
    nouvelleVersion: (id, body) => extractData(api.patch(`/plans/${id}/nouvelle-version`, body)),
    getVersions: (id) => extractData(api.get(`/plans/${id}/versions`)),
    getNonConformites: (id) => extractData(api.get(`/plans/${id}/non-conformites`)),
    delete: (id) => extractData(api.delete(`/plans/${id}`)),
    listByProjet: (projetId) => extractData(api.get("/plans", {
        params: { projetId, statut: "actif", limit: 100 },
    })),
};
// ─────────────────────────────────────────────────────────────────────────────
// REPORTING
// ─────────────────────────────────────────────────────────────────────────────
export const reportingService = {
    overview: () => extractData(api.get("/reporting/overview")),
    projects: () => extractData(api.get("/reporting/projects")),
    tasks: (projectId) => extractData(api.get("/reporting/tasks", {
        params: projectId ? { projectId } : {},
    })),
    nonConformities: () => extractData(api.get("/reporting/non-conformities")),
    finance: (months = 6) => extractData(api.get("/reporting/finance", {
        params: { months },
    })),
    stock: () => extractData(api.get("/reporting/stock")),
};
// ─────────────────────────────────────────────────────────────────────────────
// HEALTH (public — no auth needed)
// ─────────────────────────────────────────────────────────────────────────────
export const healthService = {
    ping: () => extractData(api.get("/health/ping")),
    check: () => extractData(api.get("/health")),
};
