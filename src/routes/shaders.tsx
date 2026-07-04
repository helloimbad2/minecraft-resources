import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ContentBrowser } from "@/components/ContentBrowser";

export const Route = createFileRoute("/shaders")({
  head: () => ({
    meta: [
      { title: "Minecraft Shaders — Modrinth & CurseForge | Minecraft Resources" },
      { name: "description", content: "Browse and download Minecraft shader packs from Modrinth and CurseForge." },
      { property: "og:title", content: "Minecraft Shaders" },
      { property: "og:description", content: "Shader packs from Modrinth and CurseForge." },
    ],
  }),
  component: () => (
    <Layout>
      <ContentBrowser
        type="shader"
        title="Shaders"
        subtitle="Stunning shader packs from Modrinth & CurseForge."
      />
    </Layout>
  ),
});
