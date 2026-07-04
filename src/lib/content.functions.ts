import { createServerFn } from "@tanstack/react-start";

export type ContentType = "mod" | "resourcepack" | "plugin" | "datapack" | "shader";

export interface ContentResult {
  id: string;
  source: "modrinth" | "curseforge";
  title: string;
  description: string;
  author: string;
  downloads: number;
  iconUrl: string | null;
  projectUrl: string;
  downloadUrl: string;
  categories: string[];
}

export interface ContentResponse {
  results: ContentResult[];
  sources: { modrinth: boolean; curseforge: boolean };
}

const CURSEFORGE_CLASS: Record<ContentType, number> = {
  mod: 6,
  resourcepack: 12,
  plugin: 5,
  datapack: 6945,
  shader: 6552,
};

// CurseForge modLoaderType enum
const CF_LOADER: Record<string, number> = {
  forge: 1,
  fabric: 4,
  quilt: 5,
  neoforge: 6,
};

const VALID_TYPES: ContentType[] = ["mod", "resourcepack", "plugin", "datapack", "shader"];

export const LOADERS = ["fabric", "forge", "quilt", "neoforge"] as const;
export const GAME_VERSIONS = [
  "1.21.8",
  "1.21.5",
  "1.21.4",
  "1.21.1",
  "1.21",
  "1.20.6",
  "1.20.4",
  "1.20.1",
  "1.19.4",
  "1.18.2",
  "1.16.5",
  "1.12.2",
  "1.8.9",
] as const;

interface SearchInput {
  type: ContentType;
  query: string;
  page: number;
  sort: "relevance" | "downloads" | "newest";
  loader: string;
  version: string;
}

async function searchModrinth(input: SearchInput, limit: number): Promise<ContentResult[]> {
  const index =
    input.sort === "downloads" ? "downloads" : input.sort === "newest" ? "newest" : "relevance";
  const facetGroups: string[][] = [[`project_type:${input.type}`]];
  if (input.loader) facetGroups.push([`categories:${input.loader}`]);
  if (input.version) facetGroups.push([`versions:${input.version}`]);
  const facets = encodeURIComponent(JSON.stringify(facetGroups));
  const url =
    `https://api.modrinth.com/v2/search?limit=${limit}` +
    `&offset=${input.page * limit}` +
    `&index=${index}` +
    `&facets=${facets}` +
    (input.query ? `&query=${encodeURIComponent(input.query)}` : "");

  const res = await fetch(url, {
    headers: { "User-Agent": "minecraft-resources/1.0 (lovable app)" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { hits?: any[] };
  return (data.hits ?? []).map((h) => {
    const projectUrl = `https://modrinth.com/${h.project_type}/${h.slug}`;
    return {
      id: `modrinth-${h.project_id}`,
      source: "modrinth" as const,
      title: h.title ?? "Unknown",
      description: h.description ?? "",
      author: h.author ?? "Unknown",
      downloads: h.downloads ?? 0,
      iconUrl: h.icon_url || null,
      projectUrl,
      downloadUrl: `${projectUrl}/versions`,
      categories: (h.display_categories ?? h.categories ?? []).slice(0, 4),
    };
  });
}

async function searchCurseForge(input: SearchInput, limit: number): Promise<ContentResult[]> {
  const apiKey = process.env.CURSEFORGE_API_KEY;
  if (!apiKey) return [];
  const sortField = input.sort === "newest" ? 11 : input.sort === "downloads" ? 6 : 2; // 2=Popularity,6=TotalDownloads,11=ReleasedDate
  let url =
    `https://api.curseforge.com/v1/mods/search?gameId=432` +
    `&classId=${CURSEFORGE_CLASS[input.type]}` +
    `&pageSize=${limit}` +
    `&index=${input.page * limit}` +
    `&sortField=${sortField}&sortOrder=desc` +
    (input.query ? `&searchFilter=${encodeURIComponent(input.query)}` : "");
  if (input.loader && CF_LOADER[input.loader]) url += `&modLoaderType=${CF_LOADER[input.loader]}`;
  if (input.version) url += `&gameVersion=${encodeURIComponent(input.version)}`;

  const res = await fetch(url, { headers: { "x-api-key": apiKey } });
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: any[] };
  return (data.data ?? []).map((m) => {
    const projectUrl = m.links?.websiteUrl ?? `https://www.curseforge.com/minecraft`;
    return {
      id: `curseforge-${m.id}`,
      source: "curseforge" as const,
      title: m.name ?? "Unknown",
      description: m.summary ?? "",
      author: m.authors?.[0]?.name ?? "Unknown",
      downloads: m.downloadCount ?? 0,
      iconUrl: m.logo?.url || null,
      projectUrl,
      downloadUrl: `${projectUrl}/files`,
      categories: (m.categories ?? []).map((c: any) => c.name).slice(0, 4),
    };
  });
}

export const searchContent = createServerFn({ method: "GET" })
  .inputValidator((data: SearchInput): SearchInput => {
    const type = VALID_TYPES.includes(data?.type) ? data.type : "mod";
    const sort = ["relevance", "downloads", "newest"].includes(data?.sort)
      ? data.sort
      : "relevance";
    return {
      type,
      sort,
      query: String(data?.query ?? "").slice(0, 100),
      page: Math.max(0, Math.min(50, Number(data?.page) || 0)),
      loader: String(data?.loader ?? "").slice(0, 20),
      version: String(data?.version ?? "").slice(0, 20),
    };
  })
  .handler(async ({ data }): Promise<ContentResponse> => {
    const limit = 20;
    const [modrinth, curseforge] = await Promise.all([
      searchModrinth(data, limit).catch(() => []),
      searchCurseForge(data, limit).catch(() => []),
    ]);

    // Interleave the two sources so both are represented near the top.
    const results: ContentResult[] = [];
    const max = Math.max(modrinth.length, curseforge.length);
    for (let i = 0; i < max; i++) {
      if (modrinth[i]) results.push(modrinth[i]);
      if (curseforge[i]) results.push(curseforge[i]);
    }

    return {
      results,
      sources: { modrinth: modrinth.length > 0, curseforge: !!process.env.CURSEFORGE_API_KEY },
    };
  });
