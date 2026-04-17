import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Plus,
  Search,
  X,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  Edit,
  CheckSquare,
} from "lucide-react";

import {
  pointagesService,
  operateursService,
  projectsService,
  tasksService,
} from "@/services/wape.service";
import type { Project } from "@/types/api";

import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatutPresence = "present" | "absent" | "retard" | "demi_journee";
type TypeContrat = "cdd" | "journalier";

interface Operateur {
  id: string;
  nomComplet?: string;
  typeContrat?: string;
}

interface Pointage {
  id: string;
  operateurId?: string;
  projetId?: string;
  tacheId?: string;
  datePointage?: string;
  heureDebut?: string;
  heureFin?: string;
  statutPresence?: StatutPresence;
  typeContrat?: TypeContrat;
  commentaire?: string;
  statutValidation?: string;
  validepar?: string;
  // Computed/denormalized
  operateurNom?: string;
  projetNom?: string;
  tacheNom?: string;
  heuresTravaillees?: number;
}

interface PointageFormState {
  datePointage: string;
  typeContrat: TypeContrat;
  operateurId: string;
  projetId: string;
  tacheId: string;
  statutPresence: StatutPresence;
  heureDebut: string;
  heureFin: string;
  commentaire: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<StatutPresence, { label: string; cls: string }> = {
  present: {
    label: "Présent",
    cls: "bg-success/10 text-success border-success/20",
  },
  absent: {
    label: "Absent",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
  },
  retard: {
    label: "Retard",
    cls: "bg-warning/10 text-warning border-warning/20",
  },
  demi_journee: {
    label: "Demi-journée",
    cls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
};

const VALIDATION_CONFIG: Record<string, { label: string; cls: string }> = {
  en_attente: {
    label: "En attente",
    cls: "bg-warning/10 text-warning border-warning/20",
  },
  valide: {
    label: "Validé",
    cls: "bg-success/10 text-success border-success/20",
  },
  refuse: {
    label: "Refusé",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcHeures(
  debut: string,
  fin: string,
  statut: StatutPresence,
): number {
  if (statut === "absent") return 0;
  if (!debut || !fin) return 0;
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  const minutes = fh * 60 + fm - (dh * 60 + dm);
  if (minutes <= 0) return 0;
  return Math.round((minutes / 60) * 100) / 100;
}

// ── Pointage Form ─────────────────────────────────────────────────────────────

function PointageForm({
  editing,
  operateurs,
  projects,
  tasks,
  existingPointages,
  onSave,
  onCancel,
  saving,
}: {
  editing: Pointage | null;
  operateurs: Operateur[];
  projects: Project[];
  tasks: any[];
  existingPointages: Pointage[];
  onSave: (data: PointageFormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<PointageFormState>({
    datePointage: editing?.datePointage ?? format(new Date(), "yyyy-MM-dd"),
    typeContrat: (editing?.typeContrat as TypeContrat) ?? "cdd",
    operateurId: editing?.operateurId ?? "",
    projetId: editing?.projetId ?? "",
    tacheId: editing?.tacheId ?? "",
    statutPresence: editing?.statutPresence ?? "present",
    heureDebut: editing?.heureDebut ?? "08:00",
    heureFin: editing?.heureFin ?? "17:00",
    commentaire: editing?.commentaire ?? "",
  });

  const heures = calcHeures(
    form.heureDebut,
    form.heureFin,
    form.statutPresence,
  );
  const filteredTasks = tasks.filter(
    (t: any) => !form.projetId || t.projectId === form.projetId,
  );

  const handleSave = () => {
    if (!form.datePointage || !form.operateurId || !form.projetId) return;
    const dupe = existingPointages.find(
      (p) =>
        p.operateurId === form.operateurId &&
        p.datePointage === form.datePointage &&
        (!editing || p.id !== editing.id),
    );
    if (dupe) {
      alert("Cet opérateur a déjà un pointage pour cette date.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <Label>Date *</Label>
          <Input
            type="date"
            value={form.datePointage}
            onChange={(e) => setForm({ ...form, datePointage: e.target.value })}
          />
        </div>

        {/* Type contrat */}
        <div>
          <Label>Type de contrat</Label>
          <Select
            value={form.typeContrat}
            onValueChange={(v) =>
              setForm({ ...form, typeContrat: v as TypeContrat })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cdd">CDD</SelectItem>
              <SelectItem value="journalier">Journalier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Opérateur */}
        <div>
          <Label>Opérateur *</Label>
          <Select
            value={form.operateurId}
            onValueChange={(v) => setForm({ ...form, operateurId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner…" />
            </SelectTrigger>
            <SelectContent>
              {operateurs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.nomComplet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Projet */}
        <div>
          <Label>Projet *</Label>
          <Select
            value={form.projetId}
            onValueChange={(v) =>
              setForm({ ...form, projetId: v, tacheId: "" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner…" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tâche */}
        <div className="col-span-2">
          <Label>Tâche (optionnelle)</Label>
          <Select
            value={form.tacheId || "none"}
            onValueChange={(v) =>
              setForm({ ...form, tacheId: v === "none" ? "" : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Aucune tâche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune tâche</SelectItem>
              {filteredTasks.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statut présence */}
        <div>
          <Label>Statut de présence</Label>
          <Select
            value={form.statutPresence}
            onValueChange={(v) =>
              setForm({ ...form, statutPresence: v as StatutPresence })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Présent</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="retard">Retard</SelectItem>
              <SelectItem value="demi_journee">Demi-journée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Heures calculées */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Heures calculées</p>
          <p className="text-2xl font-bold text-primary">{heures}h</p>
        </div>

        {/* Horaires */}
        {form.statutPresence !== "absent" && (
          <>
            <div>
              <Label>Heure début</Label>
              <Input
                type="time"
                value={form.heureDebut}
                onChange={(e) =>
                  setForm({ ...form, heureDebut: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Heure fin</Label>
              <Input
                type="time"
                value={form.heureFin}
                onChange={(e) => setForm({ ...form, heureFin: e.target.value })}
              />
            </div>
          </>
        )}

        {heures > 12 && (
          <div className="col-span-2 flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Heures anormalement élevées (&gt;12h) — vérifiez les horaires.
          </div>
        )}
      </div>

      {/* Commentaire */}
      <div>
        <Label>Commentaire</Label>
        <Textarea
          value={form.commentaire}
          onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={
            saving || !form.datePointage || !form.operateurId || !form.projetId
          }
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PointageJournalierPage() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pointage | null>(null);
  const [search, setSearch] = useState("");
  const [filterProjet, setFilterProjet] = useState("all");
  const [filterDate, setFilterDate] = useState(today);
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterOp, setFilterOp] = useState("all");

  const [showOperateurForm, setShowOperateurForm] = useState(false);
  const [operateurForm, setOperateurForm] = useState({
    nomComplet: "",
    cin: "",
    telephone: "",
    typeContrat: "cdd" as TypeContrat,
    tauxJournalier: 0,
    currency: "MAD",
    projetActuelId: "",
  });

  // ── Queries
  const { data: pointagesData, isLoading } = useQuery({
    queryKey: ["pointages"],
    queryFn: () => pointagesService.list({ limit: 200 }),
  });

  const { data: operateursData } = useQuery({
    queryKey: ["operateurs"],
    queryFn: () => operateursService.list({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksService.list({ limit: 100 }),
  });

  const pointages = (pointagesData?.items ?? []) as Pointage[];
  const operateurs = (operateursData?.items ?? []) as Operateur[];
  const projects = (projectsData?.items ?? []) as Project[];
  const tasks = (tasksData?.items ?? []) as any[];

  const createOperateurMut = useMutation({
    mutationFn: (data: typeof operateurForm) =>
      operateursService.create({
        nomComplet: data.nomComplet,
        typeContrat: data.typeContrat as "cdd" | "journalier",
        cin: data.cin || undefined,
        telephone: data.telephone || undefined,
        tauxJournalier: data.tauxJournalier || undefined,
        currency: data.currency || undefined,
        projetActuelId: data.projetActuelId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operateurs"] });
      setShowOperateurForm(false);
      setOperateurForm({
        nomComplet: "",
        cin: "",
        telephone: "",
        typeContrat: "cdd",
        tauxJournalier: 0,
        currency: "MAD",
        projetActuelId: "",
      });
    },
  });

  // ── Mutations
  const saveMut = useMutation({
    mutationFn: (data: PointageFormState) => {
      const payload = {
        operateurId: data.operateurId,
        projetId: data.projetId,
        tacheId: data.tacheId || undefined,
        datePointage: data.datePointage,
        heureDebut: data.heureDebut || undefined,
        heureFin: data.heureFin || undefined,
        statutPresence: data.statutPresence,
        typeContrat: data.typeContrat,
        commentaire: data.commentaire || undefined,
      };
      return editing
        ? pointagesService.update(editing.id, payload)
        : pointagesService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pointages"] });
      setShowForm(false);
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      pointagesService.update(id, { statutPresence: "absent" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pointages"] }),
  });

  const validateMut = useMutation({
    mutationFn: (id: string) => pointagesService.valider(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pointages"] }),
  });

  // ── Helpers
  const getOperateurNom = (id?: string) =>
    operateurs.find((o) => o.id === id)?.nomComplet ?? "—";

  const getProjetNom = (id?: string) =>
    projects.find((p) => p.id === id)?.name ?? "—";

  const openForm = (p?: Pointage) => {
    setEditing(p ?? null);
    setShowForm(true);
  };

  // ── Filtering
  const filtered = useMemo(
    () =>
      pointages.filter((p) => {
        if (filterProjet !== "all" && p.projetId !== filterProjet) return false;
        if (filterDate && p.datePointage !== filterDate) return false;
        if (filterStatut !== "all" && p.statutPresence !== filterStatut)
          return false;
        if (filterOp !== "all" && p.operateurId !== filterOp) return false;
        if (search) {
          const q = search.toLowerCase();
          const nom = getOperateurNom(p.operateurId).toLowerCase();
          const proj = getProjetNom(p.projetId).toLowerCase();
          if (!nom.includes(q) && !proj.includes(q)) return false;
        }
        return true;
      }),
    [pointages, filterProjet, filterDate, filterStatut, filterOp, search],
  );

  // ── KPIs today
  const todayPointages = pointages.filter((p) => p.datePointage === today);
  const kpis = {
    presents: todayPointages.filter((p) => p.statutPresence === "present")
      .length,
    absents: todayPointages.filter((p) => p.statutPresence === "absent").length,
    heures: todayPointages.reduce((s, p) => {
      return (
        s +
        calcHeures(
          p.heureDebut ?? "",
          p.heureFin ?? "",
          p.statutPresence ?? "absent",
        )
      );
    }, 0),
    en_attente: pointages.filter(
      (p) => (p as any).statutValidation === "en_attente",
    ).length,
  };

  // ── Render
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pointage Journalier</h1>
          <p className="text-sm text-muted-foreground">
            Suivi de présence des opérateurs CDD
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => openForm()} className="gap-2">
            <Plus className="w-4 h-4" /> Nouveau Pointage
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowOperateurForm(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvel Opérateur
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Présents aujourd'hui",
            value: kpis.presents,
            icon: UserCheck,
            color: "text-success bg-success/10",
          },
          {
            label: "Absents aujourd'hui",
            value: kpis.absents,
            icon: AlertCircle,
            color: "text-destructive bg-destructive/10",
          },
          {
            label: "Heures travaillées (J)",
            value: `${kpis.heures.toFixed(1)}h`,
            icon: Clock,
            color: "text-primary bg-primary/10",
          },
          {
            label: "En attente validation",
            value: kpis.en_attente,
            icon: CheckSquare,
            color: "text-warning bg-warning/10",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input
          type="date"
          className="w-40"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <Select value={filterProjet} onValueChange={setFilterProjet}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous projets</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tous statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="present">Présent</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="retard">Retard</SelectItem>
            <SelectItem value="demi_journee">Demi-journée</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterOp} onValueChange={setFilterOp}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous opérateurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous opérateurs</SelectItem>
            {operateurs.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.nomComplet}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterProjet !== "all" ||
          filterStatut !== "all" ||
          filterOp !== "all" ||
          search ||
          filterDate !== today) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterProjet("all");
              setFilterStatut("all");
              setFilterOp("all");
              setSearch("");
              setFilterDate(today);
            }}
          >
            <X className="w-3 h-3 mr-1" /> Effacer
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Date",
                    "Opérateur",
                    "Projet",
                    "Début",
                    "Fin",
                    "Heures",
                    "Présence",
                    "Validation",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Chargement…
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Aucun pointage trouvé
                    </td>
                  </tr>
                )}
                {filtered.map((p) => {
                  const sc = STATUT_CONFIG[p.statutPresence ?? "present"];
                  const vc =
                    VALIDATION_CONFIG[
                      (p as any).statutValidation ?? "en_attente"
                    ];
                  const heures = calcHeures(
                    p.heureDebut ?? "",
                    p.heureFin ?? "",
                    p.statutPresence ?? "absent",
                  );
                  const canEdit = (p as any).statutValidation !== "valide";
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        {p.datePointage
                          ? format(new Date(p.datePointage), "dd/MM/yyyy")
                          : "—"}
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {getOperateurNom(p.operateurId)}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] truncate">
                        {getProjetNom(p.projetId)}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {p.heureDebut ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-xs">{p.heureFin ?? "—"}</td>
                      <td className="px-3 py-3 font-semibold text-primary">
                        {heures}h
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${sc?.cls}`}
                        >
                          {sc?.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${vc?.cls}`}
                        >
                          {vc?.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1 items-center">
                          {(p as any).statutValidation === "en_attente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-success border-success/30 hover:bg-success/10"
                              onClick={() => validateMut.mutate(p.id)}
                              disabled={validateMut.isPending}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Valider
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openForm(p)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <FormDialog
        open={showForm}
        onOpenChange={(o) => {
          if (!o) {
            setShowForm(false);
            setEditing(null);
          }
        }}
        title={editing ? "Modifier Pointage" : "Nouveau Pointage"}
      >
        <PointageForm
          editing={editing}
          operateurs={operateurs}
          projects={projects}
          tasks={tasks}
          existingPointages={pointages}
          onSave={(d) => saveMut.mutate(d)}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          saving={saveMut.isPending}
        />
      </FormDialog>
      <FormDialog
        open={showOperateurForm}
        onOpenChange={setShowOperateurForm}
        title="Nouvel Opérateur"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nom Complet *</Label>
            <Input
              value={operateurForm.nomComplet}
              onChange={(e) =>
                setOperateurForm({
                  ...operateurForm,
                  nomComplet: e.target.value,
                })
              }
              placeholder="Ex: Ahmed Benali"
            />
          </div>
          <div>
            <Label>CIN</Label>
            <Input
              value={operateurForm.cin}
              onChange={(e) =>
                setOperateurForm({ ...operateurForm, cin: e.target.value })
              }
              placeholder="AB123456"
            />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input
              value={operateurForm.telephone}
              onChange={(e) =>
                setOperateurForm({
                  ...operateurForm,
                  telephone: e.target.value,
                })
              }
              placeholder="+212661000001"
            />
          </div>
          <div>
            <Label>Type de Contrat *</Label>
            <Select
              value={operateurForm.typeContrat}
              onValueChange={(v) =>
                setOperateurForm({
                  ...operateurForm,
                  typeContrat: v as TypeContrat,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cdd">CDD</SelectItem>
                <SelectItem value="journalier">Journalier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Taux Journalier</Label>
            <Input
              type="number"
              min={0}
              value={operateurForm.tauxJournalier}
              onChange={(e) =>
                setOperateurForm({
                  ...operateurForm,
                  tauxJournalier: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Select
              value={operateurForm.currency}
              onValueChange={(v) =>
                setOperateurForm({ ...operateurForm, currency: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAD">MAD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Projet Actuel</Label>
            <Select
              value={operateurForm.projetActuelId || "none"}
              onValueChange={(v) =>
                setOperateurForm({
                  ...operateurForm,
                  projetActuelId: v === "none" ? "" : v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun projet</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOperateurForm(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => createOperateurMut.mutate(operateurForm)}
              disabled={
                createOperateurMut.isPending || !operateurForm.nomComplet
              }
            >
              {createOperateurMut.isPending ? "Saving..." : "Créer"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
