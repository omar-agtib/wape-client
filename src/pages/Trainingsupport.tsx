import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  LifeBuoy,
  GraduationCap,
  FolderKanban,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  tutorialsService,
  supportService,
  authService,
  type CreateTicketPayload,
} from "@/services/wape.service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Static onboarding guides ──────────────────────────────────────────────────

const ONBOARDING_GUIDES = [
  {
    icon: FolderKanban,
    title: "Getting Started with Projects",
    description:
      "Create and manage construction projects, assign teams, and track progress.",
    category: "Projects",
    duration: "5 min",
  },
  {
    icon: CheckCircle2,
    title: "Task Management & Kanban",
    description:
      "Use tasks, assign resources, set deadlines, and visualize work with Kanban views.",
    category: "Tasks",
    duration: "7 min",
  },
  {
    icon: Package,
    title: "Stock & Inventory Management",
    description:
      "Track articles, create purchase orders, manage receptions, and monitor stock.",
    category: "Stock",
    duration: "8 min",
  },
  {
    icon: AlertCircle,
    title: "Non Conformities Workflow",
    description:
      "Report, assign, and resolve non-conformities. Annotate plans and link photos.",
    category: "Quality",
    duration: "6 min",
  },
  {
    icon: DollarSign,
    title: "Finance & Invoicing",
    description:
      "Track expenses, create invoices, and monitor project budgets.",
    category: "Finance",
    duration: "6 min",
  },
  {
    icon: FileText,
    title: "Document Centralization",
    description:
      "All files uploaded anywhere in the platform are automatically indexed here.",
    category: "Documents",
    duration: "4 min",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string;
  subject?: string;
  description?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  message?: string;
  isSupportAgent?: boolean;
  createdAt?: string;
}

interface Tutorial {
  id: string;
  title?: string;
  category?: string;
  content?: string;
  videoUrl?: string;
  published?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrainingSupportPage() {
  const [tab, setTab] = useState<"tutorials" | "support">("tutorials");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState<CreateTicketPayload>({
    subject: "",
    description: "",
    priority: "medium",
  });
  const [replyMessage, setReplyMessage] = useState("");

  const queryClient = useQueryClient();

  // ── Queries
  const { data: ticketsData, isLoading: loadingTickets } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => supportService.listTickets({ limit: 50 }),
  });

  const { data: tutorialsData } = useQuery({
    queryKey: ["tutorials"],
    queryFn: () => tutorialsService.list({ limit: 50 }),
  });

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => authService.me(),
  });

  const tickets = (ticketsData?.items ?? []) as Ticket[];
  const tutorials = (tutorialsData?.items ?? []) as Tutorial[];
  const me = meData as any;

  // ── Mutations
  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketPayload) =>
      supportService.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setShowTicketForm(false);
      setTicketForm({ subject: "", description: "", priority: "medium" });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      supportService.addMessage(id, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setShowMessageForm(null);
      setReplyMessage("");
    },
  });

  // ── Stats
  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgressTickets = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;
  const closedTickets = tickets.filter((t) => t.status === "closed").length;

  // ── Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Training & Support</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tutorials, guides and technical support
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tab === "tutorials" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setTab("tutorials")}
          >
            <GraduationCap className="w-4 h-4" /> Tutorials
          </Button>
          <Button
            variant={tab === "support" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setTab("support")}
          >
            <LifeBuoy className="w-4 h-4" /> Support
          </Button>
        </div>
      </div>

      {/* ── Tutorials Tab */}
      {tab === "tutorials" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {ONBOARDING_GUIDES.length + tutorials.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Guides available
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {tutorials.filter((t) => t.videoUrl).length + 6}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Video tutorials
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">
                    Documentation pages
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Static onboarding guides */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Onboarding Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ONBOARDING_GUIDES.map((tut, i) => (
                <Card
                  key={i}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <tut.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm font-semibold leading-tight">
                          {tut.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tut.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {tut.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tut.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs w-full group-hover:bg-primary/5"
                    >
                      <Video className="w-3 h-3 mr-1" /> Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Dynamic tutorials from backend */}
          {tutorials.filter((t) => t.published).length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Platform Tutorials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorials
                  .filter((t) => t.published)
                  .map((tut) => (
                    <Card
                      key={tut.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">
                            {tut.title}
                          </CardTitle>
                          {tut.category && (
                            <Badge variant="outline" className="text-xs">
                              {tut.category}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {tut.videoUrl && (
                          <a
                            href={tut.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                            >
                              <Video className="w-3 h-3" /> Watch Video
                            </Button>
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Documentation links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" /> Platform Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "User Manual",
                  "Admin Guide",
                  "API Reference",
                  "Integrations Guide",
                  "Reporting Guide",
                  "Mobile App Guide",
                  "Data Export",
                  "Troubleshooting",
                ].map((doc) => (
                  <Button
                    key={doc}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs justify-start gap-2"
                  >
                    <FileText className="w-3 h-3" /> {doc}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Support Tab */}
      {tab === "support" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{openTickets}</p>
                  <p className="text-xs text-muted-foreground">Open tickets</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{inProgressTickets}</p>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{closedTickets}</p>
                  <p className="text-xs text-muted-foreground">Closed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Support Tickets</h2>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setShowTicketForm(true)}
            >
              <Plus className="w-4 h-4" /> New Ticket
            </Button>
          </div>

          {/* Tickets list */}
          <div className="space-y-2">
            {loadingTickets && (
              <p className="text-center text-muted-foreground py-8">Loading…</p>
            )}
            {!loadingTickets && tickets.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No support tickets yet. Create one if you need help.</p>
                </CardContent>
              </Card>
            )}
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          #{ticket.id?.slice(-6)}
                        </span>
                        <StatusBadge status={ticket.status ?? "open"} />
                        {ticket.priority && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              ticket.priority === "urgent"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : ticket.priority === "high"
                                  ? "bg-warning/10 text-warning border-warning/20"
                                  : ""
                            }`}
                          >
                            {ticket.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {ticket.createdAt
                          ? format(new Date(ticket.createdAt), "MMM d, yyyy")
                          : ""}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            setExpandedTicket(
                              expandedTicket === ticket.id ? null : ticket.id,
                            )
                          }
                        >
                          {expandedTicket === ticket.id ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          Messages
                        </Button>
                        {ticket.status !== "closed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setShowMessageForm(ticket.id)}
                          >
                            Reply
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  {expandedTicket === ticket.id && (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {(ticket.messages ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No messages yet.
                        </p>
                      ) : (
                        (ticket.messages ?? []).map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-2 rounded-lg text-xs ${
                              msg.isSupportAgent
                                ? "bg-primary/5 border border-primary/10 ml-4"
                                : "bg-muted/30"
                            }`}
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">
                                {msg.isSupportAgent ? "Support Agent" : "You"}
                              </span>
                              <span className="text-muted-foreground">
                                {msg.createdAt
                                  ? format(
                                      new Date(msg.createdAt),
                                      "MMM d, HH:mm",
                                    )
                                  : ""}
                              </span>
                            </div>
                            <p>{msg.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── New Ticket Dialog */}
      <FormDialog
        open={showTicketForm}
        onOpenChange={setShowTicketForm}
        title="New Support Ticket"
      >
        <div className="space-y-4">
          <div>
            <Label>Subject *</Label>
            <Input
              value={ticketForm.subject}
              onChange={(e) =>
                setTicketForm({ ...ticketForm, subject: e.target.value })
              }
              placeholder="Briefly describe your issue"
            />
          </div>
          <div>
            <Label>Priority</Label>
            <Select
              value={ticketForm.priority ?? "medium"}
              onValueChange={(v) =>
                setTicketForm({
                  ...ticketForm,
                  priority: v as CreateTicketPayload["priority"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea
              value={ticketForm.description}
              onChange={(e) =>
                setTicketForm({ ...ticketForm, description: e.target.value })
              }
              placeholder="Describe your issue in detail..."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTicketForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTicketMutation.mutate(ticketForm)}
              disabled={
                createTicketMutation.isPending ||
                !ticketForm.subject ||
                !ticketForm.description
              }
            >
              {createTicketMutation.isPending
                ? "Submitting..."
                : "Submit Ticket"}
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* ── Reply Dialog */}
      <FormDialog
        open={!!showMessageForm}
        onOpenChange={(o) => !o && setShowMessageForm(null)}
        title="Reply to Ticket"
      >
        <div className="space-y-4">
          <div>
            <Label>Message *</Label>
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your message…"
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowMessageForm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                replyMutation.mutate({
                  id: showMessageForm!,
                  message: replyMessage,
                })
              }
              disabled={replyMutation.isPending || !replyMessage}
            >
              {replyMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
