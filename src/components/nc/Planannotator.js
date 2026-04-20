import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pen, Highlighter, MapPin, AlertTriangle, Trash2, Undo2, } from "lucide-react";
// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
];
const TOOLS = [
    { id: "pen", icon: Pen, label: "Pen" },
    { id: "highlight", icon: Highlighter, label: "Highlight" },
    { id: "pin", icon: MapPin, label: "Pin" },
    { id: "warning", icon: AlertTriangle, label: "Warning" },
];
// ── Component ─────────────────────────────────────────────────────────────────
export default function PlanAnnotator({ planUrl, marker, onChange, onPathsChange, }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [tool, setTool] = useState("pen");
    const [color, setColor] = useState("#ef4444");
    const [drawing, setDrawing] = useState(false);
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState([]);
    const [imgLoaded, setImgLoaded] = useState(false);
    const drawPath = (ctx, p) => {
        if (!p.points?.length)
            return;
        ctx.save();
        if (p.tool === "highlight") {
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = 20;
        }
        else {
            ctx.globalAlpha = 1;
            ctx.lineWidth = 3;
        }
        ctx.strokeStyle = p.color;
        ctx.fillStyle = p.color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (p.tool === "pin" || p.tool === "warning") {
            const [x, y] = p.points[0];
            ctx.font = "28px serif";
            ctx.fillText(p.tool === "pin" ? "📍" : "⚠️", x - 14, y + 10);
        }
        else {
            ctx.beginPath();
            ctx.moveTo(p.points[0][0], p.points[0][1]);
            p.points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
            ctx.stroke();
        }
        ctx.restore();
    };
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paths.forEach((p) => drawPath(ctx, p));
        if (marker && imgLoaded) {
            const x = (marker.x / 100) * canvas.width;
            const y = (marker.y / 100) * canvas.height;
            ctx.font = "28px serif";
            ctx.fillText("📍", x - 14, y + 10);
        }
    }, [paths, imgLoaded, marker]);
    useEffect(() => {
        redraw();
    }, [redraw]);
    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        return [(clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY];
    };
    const onDown = (e) => {
        e.preventDefault();
        const pos = getPos(e);
        if (tool === "pin" || tool === "warning") {
            const newPath = { tool, color, points: [pos] };
            const next = [...paths, newPath];
            setPaths(next);
            onPathsChange?.(next);
            // Also update marker position for backend
            const canvas = canvasRef.current;
            onChange({
                x: Math.round((pos[0] / canvas.width) * 1000) / 10,
                y: Math.round((pos[1] / canvas.height) * 1000) / 10,
            });
        }
        else {
            setDrawing(true);
            setCurrentPath([pos]);
        }
    };
    const onMove = (e) => {
        if (!drawing)
            return;
        e.preventDefault();
        const pos = getPos(e);
        const next = [...currentPath, pos];
        setCurrentPath(next);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        redraw();
        drawPath(ctx, { tool, color, points: next });
    };
    const onUp = () => {
        if (!drawing)
            return;
        setDrawing(false);
        if (currentPath.length > 1) {
            const newPath = { tool, color, points: currentPath };
            const next = [...paths, newPath];
            setPaths(next);
            onPathsChange?.(next);
            // Update marker to last point drawn
            if (currentPath.length > 0) {
                const canvas = canvasRef.current;
                const lastPt = currentPath[currentPath.length - 1];
                onChange({
                    x: Math.round((lastPt[0] / canvas.width) * 1000) / 10,
                    y: Math.round((lastPt[1] / canvas.height) * 1000) / 10,
                });
            }
        }
        setCurrentPath([]);
    };
    const undo = () => {
        const next = paths.slice(0, -1);
        setPaths(next);
        onPathsChange?.(next);
    };
    const clear = () => {
        setPaths([]);
        onPathsChange?.([]);
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap p-2 rounded-lg bg-muted/30 border border-border", children: [TOOLS.map((t) => (_jsxs(Button, { variant: tool === t.id ? "default" : "ghost", size: "sm", className: "h-8 gap-1 text-xs", onClick: () => setTool(t.id), type: "button", children: [_jsx(t.icon, { className: "w-3.5 h-3.5" }), t.label] }, t.id))), _jsx("div", { className: "h-5 w-px bg-border mx-1" }), COLORS.map((c) => (_jsx("button", { type: "button", style: { background: c }, className: cn("w-5 h-5 rounded-full border-2 transition-transform", color === c
                            ? "border-foreground scale-110"
                            : "border-transparent"), onClick: () => setColor(c) }, c))), _jsx("div", { className: "h-5 w-px bg-border mx-1" }), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs gap-1", onClick: undo, type: "button", children: [_jsx(Undo2, { className: "w-3.5 h-3.5" }), " Undo"] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs gap-1 text-destructive", onClick: clear, type: "button", children: [_jsx(Trash2, { className: "w-3.5 h-3.5" }), " Clear"] })] }), _jsx("div", { ref: containerRef, className: "relative border border-border rounded-lg overflow-hidden bg-muted/20", style: { minHeight: 300 }, children: planUrl ? (_jsxs(_Fragment, { children: [_jsx("img", { src: planUrl, alt: "Plan", className: "w-full block select-none", draggable: false, onLoad: (e) => {
                                const canvas = canvasRef.current;
                                if (canvas) {
                                    canvas.width = e.target.naturalWidth;
                                    canvas.height = e.target.naturalHeight;
                                    setImgLoaded(true);
                                }
                            } }), _jsx("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full cursor-crosshair", onMouseDown: onDown, onMouseMove: onMove, onMouseUp: onUp, onMouseLeave: onUp, onTouchStart: onDown, onTouchMove: onMove, onTouchEnd: onUp })] })) : (_jsx("div", { className: "flex items-center justify-center h-48 text-muted-foreground text-sm", children: "Select a plan to annotate" })) })] }));
}
