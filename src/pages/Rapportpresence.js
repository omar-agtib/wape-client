import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDaysInMonth } from "date-fns";
import { Download, Users, Clock, Calendar, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import { pointagesService, operateursService, projectsService, } from "@/services/wape.service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
// ── Constants ─────────────────────────────────────────────────────────────────
const MOIS = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
];
const STATUT_LABELS = {
    present: "Présent",
    absent: "Absent",
    retard: "Retard",
    demi_journee: "Demi-journée",
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
// ── Calendar Component ────────────────────────────────────────────────────────
function CalendrierPresence({ pointagesByDate, month, year, onMonthChange, operateurNom, }) {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
    const firstDow = new Date(year, month - 1, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
    const COLORS = {
        present: "bg-success/20 border-success/30 text-success",
        absent: "bg-destructive/20 border-destructive/30 text-destructive",
        retard: "bg-warning/20 border-warning/30 text-warning",
        demi_journee: "bg-blue-500/20 border-blue-500/30 text-blue-600",
    };
    const cells = [
        ...Array(offset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onMonthChange(-1), children: "\u2190" }), _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "font-semibold", children: [MOIS[month - 1], " ", year] }), operateurNom && (_jsx("p", { className: "text-xs text-muted-foreground", children: operateurNom }))] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onMonthChange(1), children: "\u2192" })] }), _jsxs("div", { className: "grid grid-cols-7 gap-1", children: [["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (_jsx("div", { className: "text-center text-xs font-semibold text-muted-foreground py-1", children: d }, d))), cells.map((day, i) => {
                        if (!day)
                            return _jsx("div", {}, `empty-${i}`);
                        const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
                        const p = pointagesByDate[dateStr];
                        const statut = p?.statutPresence;
                        const colorCls = statut
                            ? COLORS[statut]
                            : "bg-muted/20 border-border";
                        return (_jsxs("div", { className: `border rounded-lg p-1.5 min-h-[52px] text-center transition-colors ${colorCls}`, children: [_jsx("p", { className: "text-xs font-semibold", children: day }), statut && (_jsx("p", { className: "text-[10px] mt-0.5 leading-tight", children: STATUT_LABELS[statut] })), p && p.heureDebut && (_jsxs("p", { className: "text-[9px] text-muted-foreground", children: [calcHeures(p.heureDebut, p.heureFin ?? "", statut ?? "absent"), "h"] }))] }, dateStr));
                    })] }), _jsx("div", { className: "flex flex-wrap gap-3 pt-2", children: Object.entries(STATUT_LABELS).map(([k, v]) => (_jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [_jsx("div", { className: `w-3 h-3 rounded border ${k === "present"
                                ? "bg-success/20 border-success/30"
                                : k === "absent"
                                    ? "bg-destructive/20 border-destructive/30"
                                    : k === "retard"
                                        ? "bg-warning/20 border-warning/30"
                                        : "bg-blue-500/20 border-blue-500/30"}` }), v] }, k))) })] }));
}
// ── Main Component ────────────────────────────────────────────────────────────
export default function RapportPresencePage() {
    const now = new Date();
    const [filterProjet, setFilterProjet] = useState("all");
    const [filterOp, setFilterOp] = useState("all");
    const [mois, setMois] = useState(now.getMonth() + 1);
    const [annee, setAnnee] = useState(now.getFullYear());
    // ── Queries
    const { data: pointagesData } = useQuery({
        queryKey: ["pointages"],
        queryFn: () => pointagesService.list({ limit: 500 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: operateursData } = useQuery({
        queryKey: ["operateurs"],
        queryFn: () => operateursService.list({ limit: 100 }),
    });
    const pointages = useMemo(() => (pointagesData?.items ?? []), [pointagesData]);
    const projects = useMemo(() => (projectsData?.items ?? []), [projectsData]);
    const operateurs = useMemo(() => (operateursData?.items ?? []), [operateursData]);
    const monthPrefix = `${annee}-${String(mois).padStart(2, "0")}`;
    // ── Filtering
    const filtered = useMemo(() => pointages.filter((p) => {
        if (!p.datePointage?.startsWith(monthPrefix))
            return false;
        if (filterProjet !== "all" && p.projetId !== filterProjet)
            return false;
        if (filterOp !== "all" && p.operateurId !== filterOp)
            return false;
        return true;
    }), [pointages, monthPrefix, filterProjet, filterOp]);
    // ── Calendar map
    const pointagesByDate = useMemo(() => {
        const map = {};
        filtered.forEach((p) => {
            if (p.datePointage)
                map[p.datePointage] = p;
        });
        return map;
    }, [filtered]);
    const handleMonthChange = (delta) => {
        let m = mois + delta;
        let y = annee;
        if (m > 12) {
            m = 1;
            y++;
        }
        if (m < 1) {
            m = 12;
            y--;
        }
        setMois(m);
        setAnnee(y);
    };
    // ── Stats
    const stats = useMemo(() => {
        const jours = filtered.filter((p) => p.statutPresence === "present").length;
        const absences = filtered.filter((p) => p.statutPresence === "absent").length;
        const retards = filtered.filter((p) => p.statutPresence === "retard").length;
        const demiJournees = filtered.filter((p) => p.statutPresence === "demi_journee").length;
        const heures = filtered.reduce((s, p) => s +
            calcHeures(p.heureDebut ?? "", p.heureFin ?? "", p.statutPresence ?? "absent"), 0);
        return { jours, absences, retards, demiJournees, heures };
    }, [filtered]);
    // ── Operator stats
    const operateurStats = useMemo(() => {
        const map = {};
        filtered.forEach((p) => {
            const key = p.operateurId ?? "unknown";
            if (!map[key]) {
                const op = operateurs.find((o) => o.id === p.operateurId);
                map[key] = {
                    nom: op?.nomComplet ?? key,
                    heures: 0,
                    jours: 0,
                    absences: 0,
                    retards: 0,
                    demiJ: 0,
                };
            }
            map[key].heures += calcHeures(p.heureDebut ?? "", p.heureFin ?? "", p.statutPresence ?? "absent");
            if (p.statutPresence === "absent")
                map[key].absences++;
            else if (p.statutPresence === "retard") {
                map[key].retards++;
                map[key].jours++;
            }
            else if (p.statutPresence === "demi_journee") {
                map[key].demiJ++;
                map[key].jours++;
            }
            else
                map[key].jours++;
        });
        return Object.values(map).sort((a, b) => b.heures - a.heures);
    }, [filtered, operateurs]);
    // ── Chart data
    const chartData = useMemo(() => {
        const daysInM = getDaysInMonth(new Date(annee, mois - 1, 1));
        return Array.from({ length: daysInM }, (_, i) => {
            const d = i + 1;
            const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
            const dayPoints = filtered.filter((p) => p.datePointage === dateStr);
            return {
                label: String(d),
                heures: dayPoints.reduce((s, p) => s +
                    calcHeures(p.heureDebut ?? "", p.heureFin ?? "", p.statutPresence ?? "absent"), 0),
                presents: dayPoints.filter((p) => p.statutPresence !== "absent").length,
                absents: dayPoints.filter((p) => p.statutPresence === "absent").length,
            };
        }).filter((d) => d.heures > 0 || d.presents > 0 || d.absents > 0);
    }, [filtered, annee, mois, monthPrefix]);
    // ── Export CSV
    const exportCSV = () => {
        const opNom = filterOp !== "all"
            ? (operateurs.find((o) => o.id === filterOp)?.nomComplet ?? "—")
            : "Tous";
        const rows = [
            [`Opérateur: ${opNom}`, `Mois: ${MOIS[mois - 1]} ${annee}`],
            [],
            ["Date", "Opérateur", "Projet", "Début", "Fin", "Heures", "Statut"],
            ...filtered.map((p) => {
                const op = operateurs.find((o) => o.id === p.operateurId);
                const proj = projects.find((pr) => pr.id === p.projetId);
                return [
                    p.datePointage ?? "—",
                    op?.nomComplet ?? "—",
                    proj?.name ?? "—",
                    p.heureDebut ?? "—",
                    p.heureFin ?? "—",
                    calcHeures(p.heureDebut ?? "", p.heureFin ?? "", p.statutPresence ?? "absent"),
                    STATUT_LABELS[p.statutPresence ?? "present"] ?? "—",
                ];
            }),
            [],
            ["Résumé"],
            ["Jours travaillés", stats.jours],
            ["Absences", stats.absences],
            ["Retards", stats.retards],
            ["Demi-journées", stats.demiJournees],
            ["Total heures", stats.heures.toFixed(1)],
        ];
        const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `presence_${mois}_${annee}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const years = [annee - 1, annee, annee + 1];
    const selectedOpNom = filterOp !== "all"
        ? operateurs.find((o) => o.id === filterOp)?.nomComplet
        : null;
    // ── Render
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Rapport de Pr\u00E9sence" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Calendrier mensuel & analyse des pr\u00E9sences" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: exportCSV, className: "gap-1.5 text-xs", children: [_jsx(Download, { className: "w-3.5 h-3.5" }), " Excel/CSV"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-xs mb-1 block", children: "Op\u00E9rateur" }), _jsxs(Select, { value: filterOp, onValueChange: setFilterOp, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Tous" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Tous les op\u00E9rateurs" }), operateurs.map((o) => (_jsx(SelectItem, { value: o.id, children: o.nomComplet }, o.id)))] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs mb-1 block", children: "Projet" }), _jsxs(Select, { value: filterProjet, onValueChange: setFilterProjet, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Tous" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Tous les projets" }), projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id)))] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs mb-1 block", children: "Mois" }), _jsxs(Select, { value: String(mois), onValueChange: (v) => setMois(Number(v)), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: MOIS.map((m, i) => (_jsx(SelectItem, { value: String(i + 1), children: m }, i + 1))) })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs mb-1 block", children: "Ann\u00E9e" }), _jsxs(Select, { value: String(annee), onValueChange: (v) => setAnnee(Number(v)), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: years.map((y) => (_jsx(SelectItem, { value: String(y), children: y }, y))) })] })] })] }) }) }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-3", children: [
                    {
                        label: "Jours travaillés",
                        value: stats.jours,
                        icon: Calendar,
                        color: "text-success bg-success/10",
                    },
                    {
                        label: "Total heures",
                        value: `${stats.heures.toFixed(1)}h`,
                        icon: Clock,
                        color: "text-primary bg-primary/10",
                    },
                    {
                        label: "Absences",
                        value: stats.absences,
                        icon: AlertCircle,
                        color: "text-destructive bg-destructive/10",
                    },
                    {
                        label: "Retards",
                        value: stats.retards,
                        icon: Clock,
                        color: "text-orange-600 bg-orange-500/10",
                    },
                    {
                        label: "Demi-journées",
                        value: stats.demiJournees,
                        icon: Users,
                        color: "text-yellow-700 bg-yellow-400/10",
                    },
                ].map(({ label, value, icon: Icon, color }) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-2", children: [_jsx("div", { className: `p-1.5 rounded-lg ${color}`, children: _jsx(Icon, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] text-muted-foreground", children: label }), _jsx("p", { className: "text-lg font-bold leading-tight", children: value })] })] }) }, label))) }), _jsxs(Tabs, { defaultValue: "calendrier", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "calendrier", children: "Calendrier" }), _jsx(TabsTrigger, { value: "graphique", children: "Graphique" }), _jsx(TabsTrigger, { value: "tableau", children: "Tableau op\u00E9rateurs" })] }), _jsx(TabsContent, { value: "calendrier", className: "mt-4", children: _jsx(Card, { children: _jsx(CardContent, { className: "p-5", children: _jsx(CalendrierPresence, { pointagesByDate: pointagesByDate, month: mois, year: annee, onMonthChange: handleMonthChange, operateurNom: selectedOpNom }) }) }) }), _jsx(TabsContent, { value: "graphique", className: "mt-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-semibold", children: ["Heures & Pr\u00E9sences par Jour \u2014 ", MOIS[mois - 1], " ", annee] }) }), _jsx(CardContent, { children: chartData.length === 0 ? (_jsx("p", { className: "text-center text-muted-foreground text-sm py-8", children: "Aucune donn\u00E9e pour ce mois" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(BarChart, { data: chartData, barSize: 12, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 10 } }), _jsx(YAxis, { tick: { fontSize: 10 } }), _jsx(Tooltip, { contentStyle: { borderRadius: 8, fontSize: 12 } }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "heures", fill: "hsl(221,83%,53%)", name: "Heures", radius: [3, 3, 0, 0] }), _jsx(Bar, { dataKey: "presents", fill: "hsl(142,71%,45%)", name: "Pr\u00E9sents", radius: [3, 3, 0, 0] }), _jsx(Bar, { dataKey: "absents", fill: "hsl(0,84%,60%)", name: "Absents", radius: [3, 3, 0, 0] })] }) })) })] }) }), _jsx(TabsContent, { value: "tableau", className: "mt-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-semibold", children: ["R\u00E9sum\u00E9 par Op\u00E9rateur \u2014 ", MOIS[mois - 1], " ", annee] }) }), _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-border bg-muted/30", children: [
                                                            "Opérateur",
                                                            "Total Heures",
                                                            "Jours Travaillés",
                                                            "Absences",
                                                            "Retards",
                                                            "Demi-j.",
                                                        ].map((h) => (_jsx("th", { className: "text-left px-4 py-3 text-xs font-semibold text-muted-foreground", children: h }, h))) }) }), _jsxs("tbody", { children: [operateurStats.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "text-center py-8 text-muted-foreground", children: "Aucun r\u00E9sultat pour ce mois" }) })), operateurStats.map((s, i) => (_jsxs("tr", { className: "border-b border-border/50 hover:bg-muted/20 transition-colors", children: [_jsx("td", { className: "px-4 py-3 font-medium", children: s.nom }), _jsxs("td", { className: "px-4 py-3 font-bold text-primary", children: [s.heures.toFixed(1), "h"] }), _jsx("td", { className: "px-4 py-3", children: s.jours }), _jsx("td", { className: "px-4 py-3", children: s.absences > 0 ? (_jsx(Badge, { variant: "outline", className: "text-xs bg-destructive/10 text-destructive border-destructive/20", children: s.absences })) : (_jsx("span", { className: "text-muted-foreground", children: "0" })) }), _jsx("td", { className: "px-4 py-3", children: s.retards > 0 ? (_jsx(Badge, { variant: "outline", className: "text-xs bg-orange-500/10 text-orange-600 border-orange-400/20", children: s.retards })) : (_jsx("span", { className: "text-muted-foreground", children: "0" })) }), _jsx("td", { className: "px-4 py-3", children: s.demiJ > 0 ? (_jsx(Badge, { variant: "outline", className: "text-xs bg-yellow-400/10 text-yellow-700 border-yellow-400/20", children: s.demiJ })) : (_jsx("span", { className: "text-muted-foreground", children: "0" })) })] }, i)))] })] }) }) })] }) })] })] }));
}
