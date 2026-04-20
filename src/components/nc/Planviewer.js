import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
// ── Component ─────────────────────────────────────────────────────────────────
export default function PlanViewer({ planUrl, markerX, markerY, onClose, }) {
    const [zoom, setZoom] = useState(1);
    const hasMarker = markerX !== undefined &&
        markerY !== undefined &&
        markerX !== null &&
        markerY !== null;
    return (_jsxs("div", { className: "fixed inset-0 z-[100] flex flex-col bg-black/90", children: [_jsxs("div", { className: "flex items-center gap-2 p-3 bg-black/70 border-b border-white/10", children: [_jsx("span", { className: "text-white text-sm font-medium mr-auto", children: "Plan Viewer \u2014 NC Location" }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-8 gap-1 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20", onClick: () => setZoom((z) => Math.min(z + 0.25, 4)), children: [_jsx(ZoomIn, { className: "w-3.5 h-3.5" }), " Zoom In"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-8 gap-1 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20", onClick: () => setZoom((z) => Math.max(z - 0.25, 0.25)), children: [_jsx(ZoomOut, { className: "w-3.5 h-3.5" }), " Zoom Out"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-8 gap-1 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20", onClick: () => setZoom(1), children: [_jsx(RotateCcw, { className: "w-3.5 h-3.5" }), " Reset"] }), _jsxs("span", { className: "text-white/50 text-xs", children: [Math.round(zoom * 100), "%"] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-white hover:bg-white/20", onClick: onClose, children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "flex-1 overflow-auto flex items-start justify-center p-6", children: _jsx("div", { className: "relative inline-block", style: {
                        transform: `scale(${zoom})`,
                        transformOrigin: "top center",
                    }, children: planUrl ? (_jsxs(_Fragment, { children: [_jsx("img", { src: planUrl, alt: "Plan", className: "block", style: { maxWidth: "90vw" }, draggable: false }), hasMarker && (_jsx("div", { className: "absolute pointer-events-none", style: {
                                    left: `${markerX}%`,
                                    top: `${markerY}%`,
                                    transform: "translate(-50%, -100%)",
                                }, children: _jsx(MapPin, { className: "w-8 h-8 text-destructive drop-shadow-lg", fill: "currentColor" }) }))] })) : (_jsx("div", { className: "text-white/50 text-sm p-8", children: "No plan image available" })) }) })] }));
}
