import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ContentBrowser } from "@/components/ContentBrowser";

export const Route = createFileRoute("/mods")({
  head: () => ({
    meta: [
      { title: "Minecraft Mods — Modrinth & CurseForge | Minecraft Resources" },
      { name: "description", content: "Browse and download Minecraft mods from Modrinth and CurseForge." },
      { property: "og:title", content: "Minecraft Mods" },
      { property: "og:description", content: "Discover mods from Modrinth and CurseForge." },
    ],
  }),
  component: () => (
    <Layout>
      <ContentBrowser type="mod" title="Mods" subtitle="Mods from Modrinth & CurseForge." />
    </Layout>
  ),
});
