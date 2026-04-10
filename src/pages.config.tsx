import React from "react";

// ── Existing pages ─────────────────────────────────────────────────────────────
import Dashboard from "./pages/Dashboard";

// ── Placeholder for pages not yet integrated ───────────────────────────────────
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
      <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">
        This page is being integrated with the WAPE backend.
      </p>
    </div>
  );
}

const make = (title: string) => () => <ComingSoon title={title} />;

// ── Page registry ─────────────────────────────────────────────────────────────
export const PAGES: Record<string, React.ComponentType> = {
  Dashboard,

  // Sprint 13 — to be integrated one by one
  Projects: make("Projects"),
  ProjectDetails: make("Project Detail"),
  Plans: make("Plans — Coming Soon"),
  Tasks: make("Tasks"),
  TaskDetails: make("Task Detail"),
  Personnel: make("Personnel"),
  Tools: make("Tools & Equipment"),
  Articles: make("Articles"),
  Stock: make("Stock Management"),
  PurchaseOrders: make("Purchase Orders"),
  Reception: make("Reception"),
  Finance: make("Finance"),
  Expenses: make("Expenses"),
  Invoices: make("Invoices"),
  Payments: make("Payments"),
  Clients: make("Clients"),
  Suppliers: make("Suppliers"),
  Subcontractors: make("Subcontractors"),
  Attachments: make("Attachments & Validation"),
  NonConformities: make("Non Conformities"),
  Documents: make("Documents"),
  Communication: make("Communication — Coming Soon"),
  Reporting: make("Reporting — Coming Soon"),
  TrainingSupport: make("Training & Support"),
  Administration: make("Administration"),
  PointageJournalier: make("Pointage Journalier — Coming Soon"),
  RapportPresence: make("Rapport de Présence — Coming Soon"),
};
