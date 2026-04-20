import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Search, X, CheckCircle2, Clock, UserCheck, AlertCircle, Edit, CheckSquare, } from "lucide-react";
import { pointagesService, operateursService, projectsService, tasksService, } from "@/services/wape.service";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
// ── Constants ─────────────────────────────────────────────────────────────────
const STATUT_CONFIG = {
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
const VALIDATION_CONFIG = {
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
function calcHeures(debut, fin, statut) {
    if (statut === "absent")
        return 0;
    if (!debut || !fin)
        return 0;
    const [dh, dm] = debut.split(":").map(Number);
    const [fh, fm] = fin.split(":").map(Number);
    const minutes = fh * 60 + fm - (dh * 60 + dm);
    if (minutes <= 0)
        return 0;
    return Math.round((minutes / 60) * 100) / 100;
}
// ── Pointage Form ─────────────────────────────────────────────────────────────
function PointageForm({ editing, operateurs, projects, tasks, existingPointages, onSave, onCancel, saving, }) {
    const [form, setForm] = useState({
        datePointage: editing?.datePointage ?? format(new Date(), "yyyy-MM-dd"),
        typeContrat: editing?.typeContrat ?? "cdd",
        operateurId: editing?.operateurId ?? "",
        projetId: editing?.projetId ?? "",
        tacheId: editing?.tacheId ?? "",
        statutPresence: editing?.statutPresence ?? "present",
        heureDebut: editing?.heureDebut ?? "08:00",
        heureFin: editing?.heureFin ?? "17:00",
        commentaire: editing?.commentaire ?? "",
    });
    const heures = calcHeures(form.heureDebut, form.heureFin, form.statutPresence);
    const filteredTasks = tasks.filter((t) => !form.projetId || t.projectId === form.projetId);
    const handleSave = () => {
        if (!form.datePointage || !form.operateurId || !form.projetId)
            return;
        const dupe = existingPointages.find((p) => p.operateurId === form.operateurId &&
            p.datePointage === form.datePointage &&
            (!editing || p.id !== editing.id));
        if (dupe) {
            alert("Cet opérateur a déjà un pointage pour cette date.");
            return;
        }
        onSave(form);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Date *" }), _jsx(Input, { type: "date", value: form.datePointage, onChange: (e) => setForm({ ...form, datePointage: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Type de contrat" }), _jsxs(Select, { value: form.typeContrat, onValueChange: (v) => setForm({ ...form, typeContrat: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "cdd", children: "CDD" }), _jsx(SelectItem, { value: "journalier", children: "Journalier" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Op\u00E9rateur *" }), _jsxs(Select, { value: form.operateurId, onValueChange: (v) => setForm({ ...form, operateurId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "S\u00E9lectionner\u2026" }) }), _jsx(SelectContent, { children: operateurs.map((o) => (_jsx(SelectItem, { value: o.id, children: o.nomComplet }, o.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Projet *" }), _jsxs(Select, { value: form.projetId, onValueChange: (v) => setForm({ ...form, projetId: v, tacheId: "" }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "S\u00E9lectionner\u2026" }) }), _jsx(SelectContent, { children: projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "T\u00E2che (optionnelle)" }), _jsxs(Select, { value: form.tacheId || "none", onValueChange: (v) => setForm({ ...form, tacheId: v === "none" ? "" : v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Aucune t\u00E2che" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "Aucune t\u00E2che" }), filteredTasks.map((t) => (_jsx(SelectItem, { value: t.id, children: t.name }, t.id)))] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Statut de pr\u00E9sence" }), _jsxs(Select, { value: form.statutPresence, onValueChange: (v) => setForm({ ...form, statutPresence: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "present", children: "Pr\u00E9sent" }), _jsx(SelectItem, { value: "absent", children: "Absent" }), _jsx(SelectItem, { value: "retard", children: "Retard" }), _jsx(SelectItem, { value: "demi_journee", children: "Demi-journ\u00E9e" })] })] })] }), _jsxs("div", { className: "p-3 rounded-lg bg-primary/5 border border-primary/20 flex flex-col items-center justify-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Heures calcul\u00E9es" }), _jsxs("p", { className: "text-2xl font-bold text-primary", children: [heures, "h"] })] }), form.statutPresence !== "absent" && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Label, { children: "Heure d\u00E9but" }), _jsx(Input, { type: "time", value: form.heureDebut, onChange: (e) => setForm({ ...form, heureDebut: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Heure fin" }), _jsx(Input, { type: "time", value: form.heureFin, onChange: (e) => setForm({ ...form, heureFin: e.target.value }) })] })] })), heures > 12 && (_jsxs("div", { className: "col-span-2 flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), "Heures anormalement \u00E9lev\u00E9es (>12h) \u2014 v\u00E9rifiez les horaires."] }))] }), _jsxs("div", { children: [_jsx(Label, { children: "Commentaire" }), _jsx(Textarea, { value: form.commentaire, onChange: (e) => setForm({ ...form, commentaire: e.target.value }), rows: 2 })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: onCancel, children: "Annuler" }), _jsx(Button, { onClick: handleSave, disabled: saving || !form.datePointage || !form.operateurId || !form.projetId, children: saving ? "Enregistrement…" : "Enregistrer" })] })] }));
}
// ── Main Component ────────────────────────────────────────────────────────────
export default function PointageJournalierPage() {
    const queryClient = useQueryClient();
    const today = format(new Date(), "yyyy-MM-dd");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
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
        typeContrat: "cdd",
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
    const pointages = useMemo(() => (pointagesData?.items ?? []), [pointagesData]);
    const operateurs = useMemo(() => (operateursData?.items ?? []), [operateursData]);
    const projects = useMemo(() => (projectsData?.items ?? []), [projectsData]);
    const tasks = useMemo(() => (tasksData?.items ?? []), [tasksData]);
    const createOperateurMut = useMutation({
        mutationFn: (data) => operateursService.create({
            nomComplet: data.nomComplet,
            typeContrat: data.typeContrat,
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
        mutationFn: (data) => {
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
    const validateMut = useMutation({
        mutationFn: (id) => pointagesService.valider(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pointages"] }),
    });
    // ── Helpers
    const getOperateurNom = (id) => operateurs.find((o) => o.id === id)?.nomComplet ?? "—";
    const getProjetNom = (id) => projects.find((p) => p.id === id)?.name ?? "—";
    const openForm = (p) => {
        setEditing(p ?? null);
        setShowForm(true);
    };
    // ── Filtering
    const filtered = useMemo(() => pointages.filter((p) => {
        if (filterProjet !== "all" && p.projetId !== filterProjet)
            return false;
        if (filterDate && p.datePointage !== filterDate)
            return false;
        if (filterStatut !== "all" && p.statutPresence !== filterStatut)
            return false;
        if (filterOp !== "all" && p.operateurId !== filterOp)
            return false;
        if (search) {
            const q = search.toLowerCase();
            const nom = (operateurs.find((o) => o.id === p.operateurId)?.nomComplet ?? "").toLowerCase();
            const proj = (projects.find((pr) => pr.id === p.projetId)?.name ?? "").toLowerCase();
            if (!nom.includes(q) && !proj.includes(q))
                return false;
        }
        return true;
    }), [
        pointages,
        filterProjet,
        filterDate,
        filterStatut,
        filterOp,
        search,
        operateurs,
        projects,
    ]);
    // ── KPIs today
    const todayPointages = pointages.filter((p) => p.datePointage === today);
    const kpis = {
        presents: todayPointages.filter((p) => p.statutPresence === "present")
            .length,
        absents: todayPointages.filter((p) => p.statutPresence === "absent").length,
        heures: todayPointages.reduce((s, p) => {
            return (s +
                calcHeures(p.heureDebut ?? "", p.heureFin ?? "", p.statutPresence ?? "absent"));
        }, 0),
        en_attente: pointages.filter((p) => p.isValide === false || p.isValide === undefined).length,
    };
    // ── Render
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Pointage Journalier" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Suivi de pr\u00E9sence des op\u00E9rateurs CDD" })] }), _jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsxs(Button, { onClick: () => openForm(), className: "gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), " Nouveau Pointage"] }), _jsxs(Button, { variant: "outline", onClick: () => setShowOperateurForm(true), className: "gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), " Nouvel Op\u00E9rateur"] })] })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
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
                ].map(({ label, value, icon: Icon, color }) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: `p-2 rounded-lg shrink-0 ${color}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: label }), _jsx("p", { className: "text-xl font-bold", children: value })] })] }) }, label))) }), _jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [_jsxs("div", { className: "relative flex-1 min-w-40", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Rechercher\u2026", className: "pl-9", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsx(Input, { type: "date", className: "w-40", value: filterDate, onChange: (e) => setFilterDate(e.target.value) }), _jsxs(Select, { value: filterProjet, onValueChange: setFilterProjet, children: [_jsx(SelectTrigger, { className: "w-40", children: _jsx(SelectValue, { placeholder: "Tous projets" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Tous projets" }), projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id)))] })] }), _jsxs(Select, { value: filterStatut, onValueChange: setFilterStatut, children: [_jsx(SelectTrigger, { className: "w-36", children: _jsx(SelectValue, { placeholder: "Tous statuts" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Tous statuts" }), _jsx(SelectItem, { value: "present", children: "Pr\u00E9sent" }), _jsx(SelectItem, { value: "absent", children: "Absent" }), _jsx(SelectItem, { value: "retard", children: "Retard" }), _jsx(SelectItem, { value: "demi_journee", children: "Demi-journ\u00E9e" })] })] }), _jsxs(Select, { value: filterOp, onValueChange: setFilterOp, children: [_jsx(SelectTrigger, { className: "w-40", children: _jsx(SelectValue, { placeholder: "Tous op\u00E9rateurs" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Tous op\u00E9rateurs" }), operateurs.map((o) => (_jsx(SelectItem, { value: o.id, children: o.nomComplet }, o.id)))] })] }), (filterProjet !== "all" ||
                        filterStatut !== "all" ||
                        filterOp !== "all" ||
                        search ||
                        filterDate !== today) && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => {
                            setFilterProjet("all");
                            setFilterStatut("all");
                            setFilterOp("all");
                            setSearch("");
                            setFilterDate(today);
                        }, children: [_jsx(X, { className: "w-3 h-3 mr-1" }), " Effacer"] }))] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-border bg-muted/30", children: [
                                            "Date",
                                            "Opérateur",
                                            "Projet",
                                            "Début",
                                            "Fin",
                                            "Heures",
                                            "Présence",
                                            "Validation",
                                            "",
                                        ].map((h) => (_jsx("th", { className: "text-left px-3 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap", children: h }, h))) }) }), _jsxs("tbody", { children: [isLoading && (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "text-center py-10 text-muted-foreground", children: "Chargement\u2026" }) })), !isLoading && filtered.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "text-center py-10 text-muted-foreground", children: "Aucun pointage trouv\u00E9" }) })), filtered.map((p) => {
                                            const sc = STATUT_CONFIG[p.statutPresence ?? "present"];
                                            const vc = VALIDATION_CONFIG[p.isValide ? "valide" : "en_attente"];
                                            const heures = calcHeures(p.heureDebut ?? "", p.heureFin ?? "", p.statutPresence ?? "absent");
                                            const canEdit = !p.isValide;
                                            return (_jsxs("tr", { className: "border-b border-border/50 hover:bg-muted/20 transition-colors", children: [_jsx("td", { className: "px-3 py-3 font-medium whitespace-nowrap", children: p.datePointage
                                                            ? format(new Date(p.datePointage), "dd/MM/yyyy")
                                                            : "—" }), _jsx("td", { className: "px-3 py-3 font-medium", children: getOperateurNom(p.operateurId) }), _jsx("td", { className: "px-3 py-3 text-xs text-muted-foreground max-w-[120px] truncate", children: getProjetNom(p.projetId) }), _jsx("td", { className: "px-3 py-3 text-xs", children: p.heureDebut ?? "—" }), _jsx("td", { className: "px-3 py-3 text-xs", children: p.heureFin ?? "—" }), _jsxs("td", { className: "px-3 py-3 font-semibold text-primary", children: [heures, "h"] }), _jsx("td", { className: "px-3 py-3", children: _jsx(Badge, { variant: "outline", className: `text-xs ${sc?.cls}`, children: sc?.label }) }), _jsx("td", { className: "px-3 py-3", children: _jsx(Badge, { variant: "outline", className: `text-xs ${vc?.cls}`, children: vc?.label }) }), _jsx("td", { className: "px-3 py-3", children: _jsxs("div", { className: "flex gap-1 items-center", children: [!p.isValide && (_jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-xs gap-1 text-success border-success/30 hover:bg-success/10", onClick: () => validateMut.mutate(p.id), disabled: validateMut.isPending, children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), " Valider"] })), canEdit && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => openForm(p), children: _jsx(Edit, { className: "w-3.5 h-3.5" }) }))] }) })] }, p.id));
                                        })] })] }) }) }) }), _jsx(FormDialog, { open: showForm, onOpenChange: (o) => {
                    if (!o) {
                        setShowForm(false);
                        setEditing(null);
                    }
                }, title: editing ? "Modifier Pointage" : "Nouveau Pointage", children: _jsx(PointageForm, { editing: editing, operateurs: operateurs, projects: projects, tasks: tasks, existingPointages: pointages, onSave: (d) => saveMut.mutate(d), onCancel: () => {
                        setShowForm(false);
                        setEditing(null);
                    }, saving: saveMut.isPending }) }), _jsx(FormDialog, { open: showOperateurForm, onOpenChange: setShowOperateurForm, title: "Nouvel Op\u00E9rateur", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Nom Complet *" }), _jsx(Input, { value: operateurForm.nomComplet, onChange: (e) => setOperateurForm({
                                        ...operateurForm,
                                        nomComplet: e.target.value,
                                    }), placeholder: "Ex: Ahmed Benali" })] }), _jsxs("div", { children: [_jsx(Label, { children: "CIN" }), _jsx(Input, { value: operateurForm.cin, onChange: (e) => setOperateurForm({ ...operateurForm, cin: e.target.value }), placeholder: "AB123456" })] }), _jsxs("div", { children: [_jsx(Label, { children: "T\u00E9l\u00E9phone" }), _jsx(Input, { value: operateurForm.telephone, onChange: (e) => setOperateurForm({
                                        ...operateurForm,
                                        telephone: e.target.value,
                                    }), placeholder: "+212661000001" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Type de Contrat *" }), _jsxs(Select, { value: operateurForm.typeContrat, onValueChange: (v) => setOperateurForm({
                                        ...operateurForm,
                                        typeContrat: v,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "cdd", children: "CDD" }), _jsx(SelectItem, { value: "journalier", children: "Journalier" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Taux Journalier" }), _jsx(Input, { type: "number", min: 0, value: operateurForm.tauxJournalier, onChange: (e) => setOperateurForm({
                                        ...operateurForm,
                                        tauxJournalier: parseFloat(e.target.value) || 0,
                                    }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Currency" }), _jsxs(Select, { value: operateurForm.currency, onValueChange: (v) => setOperateurForm({ ...operateurForm, currency: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "MAD", children: "MAD" }), _jsx(SelectItem, { value: "EUR", children: "EUR" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Projet Actuel" }), _jsxs(Select, { value: operateurForm.projetActuelId || "none", onValueChange: (v) => setOperateurForm({
                                        ...operateurForm,
                                        projetActuelId: v === "none" ? "" : v,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Aucun projet" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "Aucun projet" }), projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id)))] })] })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowOperateurForm(false), children: "Annuler" }), _jsx(Button, { onClick: () => createOperateurMut.mutate(operateurForm), disabled: createOperateurMut.isPending || !operateurForm.nomComplet, children: createOperateurMut.isPending ? "Saving..." : "Créer" })] })] }) })] }));
}
