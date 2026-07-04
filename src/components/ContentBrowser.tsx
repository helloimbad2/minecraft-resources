import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  searchContent,
  LOADERS,
  GAME_VERSIONS,
  type ContentType,
} from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ContentBrowserProps {
  type: ContentType;
  title: string;
  subtitle: string;
}

type Sort = "relevance" | "downloads" | "newest";

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const selectClass =
  "h-10 border-2 border-border bg-input px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContentBrowser({ type, title, subtitle }: ContentBrowserProps) {
  const search = useServerFn(searchContent);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");
  const [loader, setLoader] = useState("");
  const [version, setVersion] = useState("");
  const [page, setPage] = useState(0);

  const showLoader = type === "mod";

  const { data, isFetching, isError } = useQuery({
    queryKey: ["content", type, query, sort, loader, version, page],
    queryFn: () => search({ data: { type, query, sort, loader, version, page } }),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const results = data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary">{title}</h1>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setQuery(input);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="default">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(e) => {
                setPage(0);
                setSort(e.target.value as Sort);
              }}
              className={selectClass}
            >
              <option value="relevance">Relevance</option>
              <option value="downloads">Downloads</option>
              <option value="newest">Newest</option>
            </select>
          </label>

          {showLoader && (
            <label className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Loader</span>
              <select
                value={loader}
                onChange={(e) => {
                  setPage(0);
                  setLoader(e.target.value);
                }}
                className={selectClass}
              >
                <option value="">Any</option>
                {LOADERS.map((l) => (
                  <option key={l} value={l} className="capitalize">
                    {l}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Version</span>
            <select
              value={version}
              onChange={(e) => {
                setPage(0);
                setVersion(e.target.value);
              }}
              className={selectClass}
            >
              <option value="">Any</option>
              {GAME_VERSIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          {(loader || version || query) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPage(0);
                setLoader("");
                setVersion("");
                setInput("");
                setQuery("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {data && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Sources:</span>
          <Badge variant={data.sources.modrinth ? "default" : "outline"}>Modrinth</Badge>
          <Badge variant={data.sources.curseforge ? "default" : "outline"}>
            CurseForge{data.sources.curseforge ? "" : " (not configured)"}
          </Badge>
        </div>
      )}

      {isError && (
        <div className="border-2 border-destructive/50 bg-destructive/10 p-4 text-sm">
          Something went wrong while loading results. Please try again.
        </div>
      )}

      {isFetching && results.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Loading…
        </div>
      ) : results.length === 0 ? (
        <div className="border-2 border-border bg-card p-10 text-center text-muted-foreground">
          No results found. Try a different search or filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="group flex flex-col border-2 border-border bg-card p-4 pixel-shadow-sm transition-transform hover:-translate-y-1"
            >
              <div className="flex items-start gap-3">
                <div className="size-14 shrink-0 overflow-hidden border-2 border-border bg-background">
                  {r.iconUrl ? (
                    <img
                      src={r.iconUrl}
                      alt={r.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center font-display text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-base leading-tight">{r.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">by {r.author}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={r.source === "modrinth" ? "default" : "secondary"}>
                      {r.source === "modrinth" ? "Modrinth" : "CurseForge"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDownloads(r.downloads)} downloads
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
                {r.description}
              </p>

              {r.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.categories.map((c) => (
                    <span
                      key={c}
                      className="border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <Button asChild variant="default" size="sm" className="w-full">
                  <a href={r.downloadUrl} target="_blank" rel="noreferrer">
                    <Download className="size-4" /> Get
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0 || isFetching}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={results.length === 0 || isFetching}
          onClick={() => setPage((p) => p + 1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
