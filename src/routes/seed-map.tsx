import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Map as MapIcon, RefreshCw, Plus, Minus, Crosshair } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BIOMES,
  STRUCTURE_TYPES,
  biomeAt,
  isSlimeChunk,
  isWater,
  riverAt,
  parseSeed,
  seedHashFor,
  spawnPoint,
  structuresInView,
  type StructureMarker,
} from "@/lib/seed";

export const Route = createFileRoute("/seed-map")({
  head: () => ({
    meta: [
      { title: "Minecraft Seed Map — Biomes, Structures & Slime Chunks | Minecraft Resources" },
      { name: "description", content: "Enter a Minecraft seed to explore biomes, structures, slime chunks and spawn on a zoomable, pannable map." },
      { property: "og:title", content: "Minecraft Seed Map" },
      { property: "og:description", content: "Explore biomes, structures, slime chunks and spawn for any seed." },
    ],
  }),
  component: SeedMapPage,
});

const SIZE = 640;
const CELL = 2;

/** Pick a "nice" round spacing (blocks) for coordinate labels at the current zoom. */
function niceStep(targetBlocks: number): number {
  const steps = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
  for (const s of steps) if (s >= targetBlocks) return s;
  return steps[steps.length - 1];
}

function SeedMapPage() {
  const [input, setInput] = useState("");
  const [seed, setSeed] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // View state (world coords + blocks-per-pixel zoom).
  const [center, setCenter] = useState({ x: 0, z: 0 });
  const [bpp, setBpp] = useState(8);
  const [hover, setHover] = useState<{ x: number; z: number } | null>(null);
  const dragRef = useRef<{ sx: number; sz: number; cx: number; cz: number } | null>(null);

  const [showSlime, setShowSlime] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => Object.fromEntries(STRUCTURE_TYPES.map((s) => [s.name, true])),
  );

  const parsed = useMemo(() => {
    if (!seed) return null;
    const worldSeed = parseSeed(seed);
    return { worldSeed, seedHash: seedHashFor(worldSeed) };
  }, [seed]);

  const generate = (value: string) => {
    const v = value.trim() || String(Math.floor(Math.random() * 1e9));
    setSeed(v);
    const ws = parseSeed(v);
    setCenter(spawnPoint(ws));
    setBpp(8);
  };

  const markers = useMemo<StructureMarker[]>(() => {
    if (!parsed) return [];
    const half = (SIZE / 2) * bpp;
    return structuresInView(
      parsed.worldSeed,
      parsed.seedHash,
      center.x - half,
      center.z - half,
      center.x + half,
      center.z + half,
    );
  }, [parsed, center, bpp]);

  // Draw the map.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !parsed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Biomes (sampled at CELL resolution) with winding rivers over land.
    for (let py = 0; py < SIZE; py += CELL) {
      for (let px = 0; px < SIZE; px += CELL) {
        const wx = center.x + (px - SIZE / 2) * bpp;
        const wz = center.z + (py - SIZE / 2) * bpp;
        const idx = biomeAt(parsed.seedHash, wx, wz);
        if (!isWater(idx) && riverAt(parsed.seedHash, wx, wz)) {
          ctx.fillStyle = "#4a86d8";
        } else {
          ctx.fillStyle = BIOMES[idx].color;
        }
        ctx.fillRect(px, py, CELL, CELL);
      }
    }

    // Slime chunk overlay (only when zoomed in enough to be readable).
    if (showSlime && bpp <= 4) {
      const minCX = Math.floor((center.x - (SIZE / 2) * bpp) / 16);
      const maxCX = Math.ceil((center.x + (SIZE / 2) * bpp) / 16);
      const minCZ = Math.floor((center.z - (SIZE / 2) * bpp) / 16);
      const maxCZ = Math.ceil((center.z + (SIZE / 2) * bpp) / 16);
      ctx.fillStyle = "rgba(80, 220, 90, 0.45)";
      for (let cx = minCX; cx <= maxCX; cx++) {
        for (let cz = minCZ; cz <= maxCZ; cz++) {
          if (!isSlimeChunk(parsed.worldSeed, cx, cz)) continue;
          const sx = (cx * 16 - center.x) / bpp + SIZE / 2;
          const sz = (cz * 16 - center.z) / bpp + SIZE / 2;
          ctx.fillRect(sx, sz, 16 / bpp, 16 / bpp);
        }
      }
    }

    // Chunk grid when very zoomed in.
    if (bpp <= 2) {
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      const step = 16 / bpp;
      const offX = ((center.x % 16) + 16) % 16;
      const offZ = ((center.z % 16) + 16) % 16;
      const startX = SIZE / 2 - offX / bpp;
      const startZ = SIZE / 2 - offZ / bpp;
      for (let x = startX % step; x < SIZE; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, SIZE);
        ctx.stroke();
      }
      for (let z = startZ % step; z < SIZE; z += step) {
        ctx.beginPath();
        ctx.moveTo(0, z);
        ctx.lineTo(SIZE, z);
        ctx.stroke();
      }
    }

    // Origin crosshair.
    const ox = (0 - center.x) / bpp + SIZE / 2;
    const oz = (0 - center.z) / bpp + SIZE / 2;
    if (ox > 0 && ox < SIZE && oz > 0 && oz < SIZE) {
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox - 6, oz);
      ctx.lineTo(ox + 6, oz);
      ctx.moveTo(ox, oz - 6);
      ctx.lineTo(ox, oz + 6);
      ctx.stroke();
    }

    // Spawn marker.
    const sp = spawnPoint(parsed.worldSeed);
    const spx = (sp.x - center.x) / bpp + SIZE / 2;
    const spz = (sp.z - center.z) / bpp + SIZE / 2;
    if (spx > -10 && spx < SIZE + 10 && spz > -10 && spz < SIZE + 10) {
      ctx.fillStyle = "#22c55e";
      ctx.strokeStyle = "#08160c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(spx, spz, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Structure markers.
    for (const m of markers) {
      if (!enabled[m.type]) continue;
      const sx = (m.x - center.x) / bpp + SIZE / 2;
      const sz = (m.z - center.z) / bpp + SIZE / 2;
      if (sx < -8 || sx > SIZE + 8 || sz < -8 || sz > SIZE + 8) continue;
      ctx.fillStyle = "#0c0c0c";
      ctx.fillRect(sx - 5, sz - 5, 10, 10);
      ctx.fillStyle = m.color;
      ctx.fillRect(sx - 3, sz - 3, 6, 6);
    }

    // Coordinate ruler (chunkbase-style labels along the top and left edges).
    const step = niceStep(150 * bpp);
    ctx.font = "600 12px ui-monospace, monospace";
    ctx.textBaseline = "top";
    const worldLeft = center.x - (SIZE / 2) * bpp;
    const worldTop = center.z - (SIZE / 2) * bpp;
    const worldRight = center.x + (SIZE / 2) * bpp;
    const worldBottom = center.z + (SIZE / 2) * bpp;

    const firstX = Math.ceil(worldLeft / step) * step;
    for (let wx = firstX; wx <= worldRight; wx += step) {
      const sx = (wx - center.x) / bpp + SIZE / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, SIZE);
      ctx.stroke();
      const label = wx.toLocaleString();
      const w = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(sx + 3, 4, w + 8, 18);
      ctx.fillStyle = "#e8eef5";
      ctx.fillText(label, sx + 7, 7);
    }

    const firstZ = Math.ceil(worldTop / step) * step;
    for (let wz = firstZ; wz <= worldBottom; wz += step) {
      const sz = (wz - center.z) / bpp + SIZE / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, sz);
      ctx.lineTo(SIZE, sz);
      ctx.stroke();
      const label = wz.toLocaleString();
      const w = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(4, sz + 3, w + 8, 18);
      ctx.fillStyle = "#e8eef5";
      ctx.fillText(label, 8, sz + 6);
    }
  }, [parsed, center, bpp, markers, enabled, showSlime]);

  // Zoom with the wheel without scrolling the page (non-passive listener).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setBpp((b) => {
        const next = e.deltaY > 0 ? b * 1.25 : b / 1.25;
        return Math.min(64, Math.max(0.5, next));
      });
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, []);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * SIZE;
      const py = ((e.clientY - rect.top) / rect.height) * SIZE;
      setHover({
        x: Math.round(center.x + (px - SIZE / 2) * bpp),
        z: Math.round(center.z + (py - SIZE / 2) * bpp),
      });
      const d = dragRef.current;
      if (d) {
        setCenter({
          x: d.cx - ((e.clientX - d.sx) / rect.width) * SIZE * bpp,
          z: d.cz - ((e.clientY - d.sz) / rect.height) * SIZE * bpp,
        });
      }
    },
    [center, bpp],
  );

  const visibleMarkers = markers.filter((m) => enabled[m.type]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-primary">Seed Map</h1>
          <p className="mt-1 text-muted-foreground">
            Explore biomes, structures, spawn and accurate slime chunks. Drag to pan, scroll to zoom.
          </p>
        </div>

        <form
          className="flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            generate(input);
          }}
        >
          <div className="relative flex-1">
            <MapIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a seed (number or text)"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="default">
            Generate
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const r = String(Math.floor(Math.random() * 1e9));
              setInput(r);
              generate(r);
            }}
            aria-label="Random seed"
          >
            <RefreshCw className="size-4" />
          </Button>
        </form>

        {parsed ? (
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <div className="space-y-2">
              <div className="relative border-2 border-border bg-card p-2 pixel-shadow">
                <canvas
                  ref={canvasRef}
                  width={SIZE}
                  height={SIZE}
                  onMouseMove={onMove}
                  onMouseDown={(e) => {
                    dragRef.current = { sx: e.clientX, sz: e.clientY, cx: center.x, cz: center.z };
                  }}
                  onMouseUp={() => (dragRef.current = null)}
                  onMouseLeave={() => {
                    dragRef.current = null;
                    setHover(null);
                  }}
                  className="h-auto w-full max-w-[640px] cursor-grab touch-none overscroll-contain active:cursor-grabbing"
                  style={{ imageRendering: "pixelated" }}
                />
                <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 border border-border bg-background/80 px-2 py-1 font-mono text-xs">
                  <Crosshair className="size-3" />
                  {hover ? `${hover.x}, ${hover.z}` : "—"}
                </div>
                <div className="absolute bottom-3 right-3 flex flex-col gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setBpp((b) => Math.max(0.5, b / 1.5))}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setBpp((b) => Math.min(64, b * 1.5))}
                  >
                    <Minus className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Center: {Math.round(center.x)}, {Math.round(center.z)}</span>
                <span>{(1 / bpp).toFixed(2)}× scale</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-border bg-card p-4 pixel-shadow-sm">
                <h2 className="font-display text-lg">Seed</h2>
                <code className="break-all text-sm text-primary">{seed}</code>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  numeric: {parsed.worldSeed.toString()}
                </p>
              </div>

              <div className="border-2 border-border bg-card p-4 pixel-shadow-sm">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="flex items-center gap-2 font-display text-lg">
                    <span className="size-3 bg-[#50dc5a]" /> Slime Chunks
                  </span>
                  <input
                    type="checkbox"
                    checked={showSlime}
                    onChange={(e) => setShowSlime(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Accurate. Zoom in (scale ≥ 0.25×) to see the overlay.
                </p>
              </div>

              <div className="border-2 border-border bg-card p-4 pixel-shadow-sm">
                <h2 className="font-display text-lg">Structures</h2>
                <div className="mt-2 space-y-1.5">
                  {STRUCTURE_TYPES.map((s) => {
                    const count = visibleMarkers.filter((m) => m.type === s.name).length;
                    return (
                      <label key={s.name} className="flex cursor-pointer items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enabled[s.name]}
                            onChange={(e) =>
                              setEnabled((prev) => ({ ...prev, [s.name]: e.target.checked }))
                            }
                            className="size-3.5 accent-primary"
                          />
                          <span className="size-3" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="border-2 border-border bg-card p-4 pixel-shadow-sm">
                <h2 className="font-display text-lg">Biomes</h2>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                  {BIOMES.map((b) => (
                    <span key={b.name} className="flex items-center gap-2">
                      <span className="size-3" style={{ backgroundColor: b.color }} /> {b.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-border bg-card p-10 text-center text-muted-foreground">
            Enter a seed above to generate a map.
          </div>
        )}

        <div className="border-2 border-amber-500/40 bg-muted/30 p-3 text-xs text-muted-foreground">
          Slime chunks are computed exactly from the seed. Biomes, structures and spawn are
          deterministic, chunkbase-style approximations — not a 1:1 reproduction of Minecraft's
          world generation.
        </div>
      </div>
    </Layout>
  );
}
