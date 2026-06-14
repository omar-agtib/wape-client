import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  planUrl?: string;
  markerX?: number; // 0-100%
  markerY?: number; // 0-100%
  annotations?: { tool: string; color: string; points: number[][] }[];
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlanViewer({
  planUrl,
  markerX,
  markerY,
  annotations,
  onClose,
}: Props) {
  const [zoom, setZoom] = useState(1);

  const hasMarker =
    markerX !== undefined &&
    markerY !== undefined &&
    markerX !== null &&
    markerY !== null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-black/70 border-b border-white/10">
        <span className="text-white text-sm font-medium mr-auto">
          Plan Viewer — NC Location
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
        >
          <ZoomIn className="w-3.5 h-3.5" /> Zoom In
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
        >
          <ZoomOut className="w-3.5 h-3.5" /> Zoom Out
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={() => setZoom(1)}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
        <span className="text-white/50 text-xs">{Math.round(zoom * 100)}%</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable plan area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <div
          className="relative inline-block"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          {planUrl ? (
            <>
              <img
                src={planUrl}
                alt="Plan"
                className="block"
                style={{ maxWidth: "90vw" }}
                draggable={false}
              />
              {/* Marker pin at percentage coordinates */}
              {hasMarker && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${markerX}%`,
                    top: `${markerY}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <MapPin
                    className="w-8 h-8 text-destructive drop-shadow-lg"
                    fill="currentColor"
                  />
                </div>
              )}
              {/* Saved annotations overlay (percentage coords → SVG viewBox 0–100) */}
              {annotations && annotations.length > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {annotations.map((p, i) => {
                    if (p.tool === "pin" || p.tool === "warning") {
                      const [x, y] = p.points[0] ?? [0, 0];
                      return (
                        <text
                          key={i}
                          x={x}
                          y={y}
                          fontSize="4"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {p.tool === "pin" ? "📍" : "⚠️"}
                        </text>
                      );
                    }
                    const pts = p.points.map(([x, y]) => `${x},${y}`).join(" ");
                    return (
                      <polyline
                        key={i}
                        points={pts}
                        fill="none"
                        stroke={p.color}
                        strokeWidth={p.tool === "highlight" ? 3 : 0.6}
                        strokeOpacity={p.tool === "highlight" ? 0.35 : 1}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>
              )}
            </>
          ) : (
            <div className="text-white/50 text-sm p-8">
              No plan image available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
