import React from "react";
import { ComingSoon } from "@/components/shared/ComingSoon";

// ── Existing pages ─────────────────────────────────────────────────────────────
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Tasks from "@/pages/Tasks";
import TaskDetails from "@/pages/TaskDetails";
import Personnel from "@/pages/Personnel";
import Tools from "@/pages/Tools";
import Articles from "@/pages/Articles";
import Stock from "@/pages/Stock";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Reception from "@/pages/Reception";
import ClientsPage from "@/pages/Clients";
import SuppliersPage from "@/pages/Suppliers";
import SubcontractorsPage from "@/pages/Subcontractors";
import DocumentsPage from "@/pages/Documents";
import PlansPage from "@/pages/Plans";
import NonConformitiesPage from "@/pages/Nonconformities";
import PointageJournalierPage from "@/pages/Pointagejournalier";
import RapportPresencePage from "@/pages/Rapportpresence";
import ReportingPage from "@/pages/Reporting";
import AttachmentsPage from "@/pages/Attachments";
import AttachmentDetailsPage from "@/pages/Attachmentdetails";
import FinancePage from "@/pages/Finance";
import ExpensesPage from "@/pages/Expenses";
import PaymentsPage from "@/pages/Payments";
import InvoicesPage from "@/pages/Invoices";
import TrainingSupportPage from "@/pages/Trainingsupport";
import AdministrationPage from "@/pages/Administration";

const make = (title: string) => () => <ComingSoon title={title} />;

// ── Page registry ─────────────────────────────────────────────────────────────
export const PAGES: Record<string, React.ComponentType> = {
  Dashboard,
  Projects,
  ProjectDetails,
  Tasks,
  TaskDetails,
  Personnel,
  Tools,
  Articles,
  Stock,
  PurchaseOrders,
  Reception,
  Clients: ClientsPage,
  Suppliers: SuppliersPage,
  Subcontractors: SubcontractorsPage,
  Documents: DocumentsPage,
  Plans: PlansPage,
  NonConformities: NonConformitiesPage,
  PointageJournalier: PointageJournalierPage,
  RapportPresence: RapportPresencePage,
  Reporting: ReportingPage,
  Attachments: AttachmentsPage,
  AttachmentDetails: AttachmentDetailsPage,
  Finance: FinancePage,
  Expenses: ExpensesPage,
  Payments: PaymentsPage,
  Invoices: InvoicesPage,
  TrainingSupport: TrainingSupportPage,
  Administration: AdministrationPage,

  Communication: make("Communication — Coming Soon"),
};
