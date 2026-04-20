import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { personnelService, articlesService, toolsService, } from "@/services/wape.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import SearchableSelect from "@/components/shared/SearchableSelect";
// ── Component ─────────────────────────────────────────────────────────────────
export default function TaskForm({ task, projects, onSave, onCancel, saving, }) {
    const queryClient = useQueryClient();
    // ── Form state
    const [form, setForm] = useState({
        name: task?.name ?? "",
        projectId: task?.projectId ?? "",
        description: task?.description ?? "",
        startDate: task?.startDate ?? "",
        endDate: task?.endDate ?? "",
        status: task?.status ?? "planned",
        currency: task?.currency ?? "MAD",
        progress: task?.progress ?? 0,
    });
    // Sub-resource rows (local UI state — saved separately after task create/update)
    const [personnelRows, setPersonnelRows] = useState([]);
    const [articleRows, setArticleRows] = useState([]);
    const [toolRows, setToolRows] = useState([]);
    // ── Lookup queries
    const { data: personnelData } = useQuery({
        queryKey: ["personnel"],
        queryFn: () => personnelService.list({ limit: 100 }),
    });
    const { data: articlesData } = useQuery({
        queryKey: ["articles"],
        queryFn: () => articlesService.list({ limit: 100 }),
    });
    const { data: toolsData } = useQuery({
        queryKey: ["tools"],
        queryFn: () => toolsService.list({ limit: 100 }),
    });
    const personnelList = (personnelData?.items ?? []);
    const articlesList = (articlesData?.items ?? []);
    const toolsList = (toolsData?.items ?? []);
    // ── Quick-create mutations
    const quickCreatePersonnel = useMutation({
        mutationFn: (name) => personnelService.create({
            fullName: name,
            role: "Worker",
            costPerHour: 0,
            currency: form.currency,
        }),
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ["personnel"] });
            setPersonnelRows((prev) => [
                ...prev,
                {
                    personnelId: created.id,
                    fullName: created.fullName,
                    plannedHours: 8,
                    costPerHour: 0,
                },
            ]);
        },
    });
    const quickCreateArticle = useMutation({
        mutationFn: (name) => articlesService.create({
            name,
            category: "General",
            unitPrice: 0,
            currency: form.currency,
        }),
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ["articles"] });
            setArticleRows((prev) => [
                ...prev,
                {
                    articleId: created.id,
                    name: created.name,
                    plannedQuantity: 1,
                    unitPrice: 0,
                },
            ]);
        },
    });
    // ── Personnel helpers
    const addPersonnel = (item) => {
        const id = String(item.id);
        if (personnelRows.some((r) => r.personnelId === id))
            return;
        const found = personnelList.find((p) => p.id === id);
        setPersonnelRows((prev) => [
            ...prev,
            {
                personnelId: id,
                fullName: found?.fullName ?? item.label,
                plannedHours: 8,
                costPerHour: found?.costPerHour ?? 0,
            },
        ]);
    };
    const updatePersonnelRow = (id, field, val) => {
        setPersonnelRows((prev) => prev.map((r) => r.personnelId === id ? { ...r, [field]: parseFloat(val) || 0 } : r));
    };
    // ── Article helpers
    const addArticle = (item) => {
        const id = String(item.id);
        if (articleRows.some((r) => r.articleId === id))
            return;
        const found = articlesList.find((a) => a.id === id);
        setArticleRows((prev) => [
            ...prev,
            {
                articleId: id,
                name: found?.name ?? item.label,
                plannedQuantity: 1,
                unitPrice: found?.unitPrice ?? 0,
                unit: found?.unit,
            },
        ]);
    };
    const updateArticleRow = (id, field, val) => {
        setArticleRows((prev) => prev.map((r) => r.articleId === id ? { ...r, [field]: parseFloat(val) || 0 } : r));
    };
    // ── Tool helpers
    const addTool = (item) => {
        const id = String(item.id);
        if (toolRows.some((r) => r.toolId === id))
            return;
        const found = toolsList.find((t) => t.id === id);
        setToolRows((prev) => [
            ...prev,
            {
                toolId: id,
                name: found?.name ?? item.label,
                plannedDays: 1,
            },
        ]);
    };
    const updateToolRow = (id, val) => {
        setToolRows((prev) => prev.map((r) => r.toolId === id ? { ...r, plannedDays: parseFloat(val) || 0 } : r));
    };
    // ── Cost estimates
    const estPersonnel = personnelRows.reduce((s, p) => s + p.costPerHour * p.plannedHours, 0);
    const estArticles = articleRows.reduce((s, a) => s + a.unitPrice * a.plannedQuantity, 0);
    const totalEst = estPersonnel + estArticles;
    // ── Submit
    const handleSave = () => {
        if (task) {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                startDate: form.startDate,
                endDate: form.endDate,
                currency: form.currency,
                progress: form.progress,
            };
            onSave(payload);
        }
        else {
            const payload = {
                name: form.name,
                projectId: form.projectId,
                description: form.description || undefined,
                startDate: form.startDate,
                endDate: form.endDate,
                currency: form.currency,
            };
            onSave(payload);
        }
    };
    // ── Render
    return (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Task Name *" }), _jsx(Input, { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Project *" }), _jsxs(Select, { value: form.projectId, onValueChange: (v) => setForm({ ...form, projectId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project" }) }), _jsx(SelectContent, { children: projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })] }), task && (_jsxs("div", { children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: form.status, onValueChange: (v) => setForm({ ...form, status: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "planned", children: "Planned" }), _jsx(SelectItem, { value: "on_progress", children: "In Progress" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] })] })), _jsxs("div", { children: [_jsx(Label, { children: "Start Date *" }), _jsx(Input, { type: "date", value: form.startDate, onChange: (e) => setForm({ ...form, startDate: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "End Date *" }), _jsx(Input, { type: "date", value: form.endDate, onChange: (e) => setForm({ ...form, endDate: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Currency" }), _jsxs(Select, { value: form.currency, onValueChange: (v) => setForm({ ...form, currency: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "MAD", children: "MAD" }), _jsx(SelectItem, { value: "EUR", children: "EUR" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Progress (%)" }), _jsx(Input, { type: "number", min: 0, max: 100, value: form.progress, onChange: (e) => setForm({
                            ...form,
                            progress: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                        }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Assign Personnel" }), _jsx(SearchableSelect, { items: personnelList.map((p) => ({ id: p.id, label: p.fullName })), onSelect: addPersonnel, onQuickCreate: (name) => quickCreatePersonnel.mutate(name), placeholder: "Search personnel..." }), _jsx("div", { className: "mt-2 space-y-1", children: personnelRows.map((p) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs", children: [_jsx("span", { className: "flex-1 font-medium", children: p.fullName }), _jsx("span", { className: "text-muted-foreground", children: "Hours:" }), _jsx(Input, { type: "number", className: "w-16 h-6 text-xs", value: p.plannedHours, onChange: (e) => updatePersonnelRow(p.personnelId, "plannedHours", e.target.value) }), _jsx("span", { className: "text-muted-foreground", children: "Rate:" }), _jsx(Input, { type: "number", className: "w-20 h-6 text-xs", value: p.costPerHour, onChange: (e) => updatePersonnelRow(p.personnelId, "costPerHour", e.target.value) }), _jsx(X, { className: "w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive", onClick: () => setPersonnelRows((prev) => prev.filter((r) => r.personnelId !== p.personnelId)) })] }, p.personnelId))) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Assign Materials" }), _jsx(SearchableSelect, { items: articlesList.map((a) => ({ id: a.id, label: a.name })), onSelect: addArticle, onQuickCreate: (name) => quickCreateArticle.mutate(name), placeholder: "Search materials..." }), _jsx("div", { className: "mt-2 space-y-1", children: articleRows.map((a) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs", children: [_jsx("span", { className: "flex-1 font-medium", children: a.name }), _jsxs("span", { className: "text-muted-foreground", children: ["Qty", a.unit ? ` (${a.unit})` : "", ":"] }), _jsx(Input, { type: "number", className: "w-16 h-6 text-xs", value: a.plannedQuantity, onChange: (e) => updateArticleRow(a.articleId, "plannedQuantity", e.target.value) }), _jsx("span", { className: "text-muted-foreground", children: "Unit price:" }), _jsx(Input, { type: "number", className: "w-20 h-6 text-xs", value: a.unitPrice, onChange: (e) => updateArticleRow(a.articleId, "unitPrice", e.target.value) }), _jsx(X, { className: "w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive", onClick: () => setArticleRows((prev) => prev.filter((r) => r.articleId !== a.articleId)) })] }, a.articleId))) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Assign Tools" }), _jsx(SearchableSelect, { items: toolsList.map((t) => ({ id: t.id, label: t.name })), onSelect: addTool, placeholder: "Search tools..." }), _jsx("div", { className: "mt-2 space-y-1", children: toolRows.map((t) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs", children: [_jsx("span", { className: "flex-1 font-medium", children: t.name }), _jsx("span", { className: "text-muted-foreground", children: "Days:" }), _jsx(Input, { type: "number", className: "w-16 h-6 text-xs", value: t.plannedDays, onChange: (e) => updateToolRow(t.toolId, e.target.value) }), _jsx(X, { className: "w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive", onClick: () => setToolRows((prev) => prev.filter((r) => r.toolId !== t.toolId)) })] }, t.toolId))) })] }), totalEst > 0 && (_jsxs("div", { className: "col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm", children: [_jsxs("div", { className: "flex justify-between text-muted-foreground flex-wrap gap-2", children: [_jsxs("span", { children: ["Personnel:", " ", _jsxs("strong", { children: [estPersonnel.toFixed(0), " ", form.currency] })] }), _jsxs("span", { children: ["Materials:", " ", _jsxs("strong", { children: [estArticles.toFixed(0), " ", form.currency] })] })] }), _jsxs("p", { className: "mt-1 font-bold text-primary", children: ["Estimated: ", totalEst.toFixed(0), " ", form.currency] })] })), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Description" }), _jsx(Textarea, { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) })] }), task && (_jsx("p", { className: "col-span-2 text-xs text-muted-foreground bg-muted/30 rounded p-2", children: "\u2139\uFE0F To manage assigned personnel, materials and tools on an existing task, open the task details page." })), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: onCancel, children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: saving ||
                            !form.name ||
                            (!task && !form.projectId) ||
                            !form.startDate ||
                            !form.endDate, children: saving ? "Saving..." : "Save Task" })] })] }));
}
