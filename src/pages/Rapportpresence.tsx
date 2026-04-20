import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDaysInMonth } from "date-fns";
import { Download, Users, Clock, Calendar, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  pointagesService,
  operateursService,
  projectsService,
} from "@/services/wape.service";
import type { Project } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatutPresence = "present" | "absent" | "retard" | "demi_journee";

interface Pointage {
  id: string;
  operateurId?: string;
  projetId?: string;
  datePointage?: string;
  heureDebut?: string;
  heureFin?: string;
  statutPresence?: StatutPresence;
  commentaire?: string;
}

interface Operateur {
  id: string;
  nomComplet?: string;
}

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

const STATUT_LABELS: Record<StatutPresence, string> = {
  present: "Présent",
  absent: "Absent",
  retard: "Retard",
  demi_journee: "Demi-journée",
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

// ── Calendar Component ────────────────────────────────────────────────────────

function CalendrierPresence({
  pointagesByDate,
  month,
  year,
  onMonthChange,
  operateurNom,
}: {
  pointagesByDate: Record<string, Pointage>;
  month: number;
  year: number;
  onMonthChange: (delta: number) => void;
  operateurNom?: string | null;
}) {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const COLORS: Record<StatutPresence, string> = {
    present: "bg-success/20 border-success/30 text-success",
    absent: "bg-destructive/20 border-destructive/30 text-destructive",
    retard: "bg-warning/20 border-warning/30 text-warning",
    demi_journee: "bg-blue-500/20 border-blue-500/30 text-blue-600",
  };

  const cells: (null | number)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-3">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onMonthChange(-1)}>
          ←
        </Button>
        <div className="text-center">
          <p className="font-semibold">
            {MOIS[month - 1]} {year}
          </p>
          {operateurNom && (
            <p className="text-xs text-muted-foreground">{operateurNom}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onMonthChange(1)}>
          →
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
          const p = pointagesByDate[dateStr];
          const statut = p?.statutPresence;
          const colorCls = statut
            ? COLORS[statut]
            : "bg-muted/20 border-border";
          return (
            <div
              key={dateStr}
              className={`border rounded-lg p-1.5 min-h-[52px] text-center transition-colors ${colorCls}`}
            >
              <p className="text-xs font-semibold">{day}</p>
              {statut && (
                <p className="text-[10px] mt-0.5 leading-tight">
                  {STATUT_LABELS[statut]}
                </p>
              )}
              {p && p.heureDebut && (
                <p className="text-[9px] text-muted-foreground">
                  {calcHeures(
                    p.heureDebut,
                    p.heureFin ?? "",
                    statut ?? "absent",
                  )}
                  h
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {Object.entries(STATUT_LABELS).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <div
              className={`w-3 h-3 rounded border ${
                k === "present"
                  ? "bg-success/20 border-success/30"
                  : k === "absent"
                    ? "bg-destructive/20 border-destructive/30"
                    : k === "retard"
                      ? "bg-warning/20 border-warning/30"
                      : "bg-blue-500/20 border-blue-500/30"
              }`}
            />
            {v}
          </div>
        ))}
      </div>
    </div>
  );
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

  const pointages = useMemo(
    () => (pointagesData?.items ?? []) as Pointage[],
    [pointagesData],
  );
  const projects = useMemo(
    () => (projectsData?.items ?? []) as Project[],
    [projectsData],
  );
  const operateurs = useMemo(
    () => (operateursData?.items ?? []) as Operateur[],
    [operateursData],
  );

  const monthPrefix = `${annee}-${String(mois).padStart(2, "0")}`;

  // ── Filtering
  const filtered = useMemo(
    () =>
      pointages.filter((p) => {
        if (!p.datePointage?.startsWith(monthPrefix)) return false;
        if (filterProjet !== "all" && p.projetId !== filterProjet) return false;
        if (filterOp !== "all" && p.operateurId !== filterOp) return false;
        return true;
      }),
    [pointages, monthPrefix, filterProjet, filterOp],
  );

  // ── Calendar map
  const pointagesByDate = useMemo(() => {
    const map: Record<string, Pointage> = {};
    filtered.forEach((p) => {
      if (p.datePointage) map[p.datePointage] = p;
    });
    return map;
  }, [filtered]);

  const handleMonthChange = (delta: number) => {
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
    const absences = filtered.filter(
      (p) => p.statutPresence === "absent",
    ).length;
    const retards = filtered.filter(
      (p) => p.statutPresence === "retard",
    ).length;
    const demiJournees = filtered.filter(
      (p) => p.statutPresence === "demi_journee",
    ).length;
    const heures = filtered.reduce(
      (s, p) =>
        s +
        calcHeures(
          p.heureDebut ?? "",
          p.heureFin ?? "",
          p.statutPresence ?? "absent",
        ),
      0,
    );
    return { jours, absences, retards, demiJournees, heures };
  }, [filtered]);

  // ── Operator stats
  const operateurStats = useMemo(() => {
    const map: Record<
      string,
      {
        nom: string;
        heures: number;
        jours: number;
        absences: number;
        retards: number;
        demiJ: number;
      }
    > = {};
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
      map[key].heures += calcHeures(
        p.heureDebut ?? "",
        p.heureFin ?? "",
        p.statutPresence ?? "absent",
      );
      if (p.statutPresence === "absent") map[key].absences++;
      else if (p.statutPresence === "retard") {
        map[key].retards++;
        map[key].jours++;
      } else if (p.statutPresence === "demi_journee") {
        map[key].demiJ++;
        map[key].jours++;
      } else map[key].jours++;
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
        heures: dayPoints.reduce(
          (s, p) =>
            s +
            calcHeures(
              p.heureDebut ?? "",
              p.heureFin ?? "",
              p.statutPresence ?? "absent",
            ),
          0,
        ),
        presents: dayPoints.filter((p) => p.statutPresence !== "absent").length,
        absents: dayPoints.filter((p) => p.statutPresence === "absent").length,
      };
    }).filter((d) => d.heures > 0 || d.presents > 0 || d.absents > 0);
  }, [filtered, annee, mois, monthPrefix]);

  // ── Export CSV
  const exportCSV = () => {
    const opNom =
      filterOp !== "all"
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
          calcHeures(
            p.heureDebut ?? "",
            p.heureFin ?? "",
            p.statutPresence ?? "absent",
          ),
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
  const selectedOpNom =
    filterOp !== "all"
      ? operateurs.find((o) => o.id === filterOp)?.nomComplet
      : null;

  // ── Render
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rapport de Présence</h1>
          <p className="text-sm text-muted-foreground">
            Calendrier mensuel & analyse des présences
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          className="gap-1.5 text-xs"
        >
          <Download className="w-3.5 h-3.5" /> Excel/CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Opérateur</Label>
              <Select value={filterOp} onValueChange={setFilterOp}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les opérateurs</SelectItem>
                  {operateurs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nomComplet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Projet</Label>
              <Select value={filterProjet} onValueChange={setFilterProjet}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Mois</Label>
              <Select
                value={String(mois)}
                onValueChange={(v) => setMois(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOIS.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Année</Label>
              <Select
                value={String(annee)}
                onValueChange={(v) => setAnnee(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
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
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-lg font-bold leading-tight">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calendrier">
        <TabsList>
          <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
          <TabsTrigger value="graphique">Graphique</TabsTrigger>
          <TabsTrigger value="tableau">Tableau opérateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="calendrier" className="mt-4">
          <Card>
            <CardContent className="p-5">
              <CalendrierPresence
                pointagesByDate={pointagesByDate}
                month={mois}
                year={annee}
                onMonthChange={handleMonthChange}
                operateurNom={selectedOpNom}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graphique" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Heures & Présences par Jour — {MOIS[mois - 1]} {annee}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Aucune donnée pour ce mois
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barSize={12}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend />
                    <Bar
                      dataKey="heures"
                      fill="hsl(221,83%,53%)"
                      name="Heures"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="presents"
                      fill="hsl(142,71%,45%)"
                      name="Présents"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="absents"
                      fill="hsl(0,84%,60%)"
                      name="Absents"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tableau" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Résumé par Opérateur — {MOIS[mois - 1]} {annee}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {[
                        "Opérateur",
                        "Total Heures",
                        "Jours Travaillés",
                        "Absences",
                        "Retards",
                        "Demi-j.",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {operateurStats.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Aucun résultat pour ce mois
                        </td>
                      </tr>
                    )}
                    {operateurStats.map((s, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{s.nom}</td>
                        <td className="px-4 py-3 font-bold text-primary">
                          {s.heures.toFixed(1)}h
                        </td>
                        <td className="px-4 py-3">{s.jours}</td>
                        <td className="px-4 py-3">
                          {s.absences > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-xs bg-destructive/10 text-destructive border-destructive/20"
                            >
                              {s.absences}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {s.retards > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-xs bg-orange-500/10 text-orange-600 border-orange-400/20"
                            >
                              {s.retards}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {s.demiJ > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-xs bg-yellow-400/10 text-yellow-700 border-yellow-400/20"
                            >
                              {s.demiJ}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
