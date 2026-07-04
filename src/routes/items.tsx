import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Check, X, Download } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ItemSprite } from "@/components/ItemSprite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  items,
  CATEGORIES,
  getItemFacts,
  getDownloadUrl,
  MC_VERSION,
  type MinecraftItem,
} from "@/data/items";

export const Route = createFileRoute("/items")({
  head: () => ({
    meta: [
      { title: "Minecraft Items — Browse Every Item | Minecraft Resources" },
      {
        name: "description",
        content:
          "Browse every Minecraft item in a grid. View facts and where each item is found.",
      },
      { property: "og:title", content: "Minecraft Items" },
      { property: "og:description", content: "Every Minecraft item with facts and textures." },
    ],
  }),
  component: ItemsPage,
});

const PAGE_SIZE = 120;
type Sort = "default" | "az" | "za" | "stack";

function ItemsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [sort, setSort] = useState<Sort>("default");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [active, setActive] = useState<MinecraftItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((it) => {
      if (category !== "All" && it.category !== category) return false;
      if (q && !it.displayName.toLowerCase().includes(q) && !it.name.includes(q)) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "az") sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
    else if (sort === "za") sorted.sort((a, b) => b.displayName.localeCompare(a.displayName));
    else if (sort === "stack") sorted.sort((a, b) => b.stackSize - a.stackSize);
    return sorted;
  }, [query, category, sort]);

  const visible = filtered.slice(0, limit);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-primary">Minecraft Items</h1>
          <p className="mt-1 text-muted-foreground">
            Browse every item — click any item to view its facts. Updated for {MC_VERSION}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE_SIZE);
              }}
              placeholder="Search items..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 border-2 border-border bg-input px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="default">Default</option>
              <option value="az">Name A–Z</option>
              <option value="za">Name Z–A</option>
              <option value="stack">Stack size</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setLimit(PAGE_SIZE);
              }}
              className={
                category === c
                  ? "border-2 border-primary bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                  : "border-2 border-border bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {c}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="border-2 border-border bg-card p-10 text-center text-muted-foreground">
            No items match your search.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {visible.map((it) => (
              <div
                key={it.id}
                className="group relative aspect-square border-2 border-border bg-card p-2 pixel-shadow-sm transition-colors hover:border-primary"
              >
                <button
                  onClick={() => setActive(it)}
                  className="absolute inset-0 z-0"
                  aria-label={`View ${it.displayName}`}
                />
                <ItemSprite name={it.name} alt={it.displayName} size={54} className="pointer-events-none size-full" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-background/80 px-1 py-0.5 text-center text-[10px] text-muted-foreground">
                  {it.displayName}
                </span>
                <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center gap-1 bg-background/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setActive(it)}
                    className="pointer-events-auto flex-1 border border-primary bg-primary px-1 py-1 text-[10px] font-medium text-primary-foreground"
                  >
                    View
                  </button>
                  <a
                    href={getDownloadUrl(it.name)}
                    download={`${it.name}.png`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto flex flex-1 items-center justify-center gap-1 border border-border bg-card px-1 py-1 text-[10px] font-medium text-foreground hover:border-primary"
                  >
                    <Download className="size-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {limit < filtered.length && (
          <div className="flex justify-center pt-2">
            <Button variant="block" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
              Load more
            </Button>
          </div>
        )}
      </div>

      <ItemDialog item={active} onClose={() => setActive(null)} />
    </Layout>
  );
}

function ItemDialog({ item, onClose }: { item: MinecraftItem | null; onClose: () => void }) {
  const facts = item ? getItemFacts(item) : null;
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {item && facts && (
          <>
            <div className="checker-bg flex aspect-square w-full items-center justify-center border-2 border-border p-10">
              <ItemSprite name={item.name} alt={item.displayName} size={150} className="size-full" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center font-display text-2xl">
                {item.displayName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">{item.category}</Badge>
              <Badge variant="outline">Stack: {item.stackSize}</Badge>
              <Badge variant="outline">{facts.renewable ? "Renewable" : "Non-renewable"}</Badge>
            </div>
            <p className="text-center text-sm text-muted-foreground">{facts.description}</p>
            <div className="border-2 border-border bg-card p-4">
              <h3 className="font-display text-sm uppercase tracking-wide text-primary">
                Where it's found
              </h3>
              <ul className="mt-2 space-y-1.5">
                {facts.foundIn.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <code>minecraft:{item.name}</code>
              <span className="flex items-center gap-1">
                Stackable{" "}
                {facts.stackable ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <X className="size-3.5" />
                )}
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
