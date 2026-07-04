import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ContentBrowser } from "@/components/ContentBrowser";

export const Route = createFileRoute("/resource-packs")({
  head: () => ({
    meta: [
      { title: "Minecraft Resource Packs — Modrinth & CurseForge | Minecraft Resources" },
      { name: "description", content: "Browse and download Minecraft resource & texture packs from Modrinth and CurseForge." },
      { property: "og:title", content: "Minecraft Resource Packs" },
      { property: "og:description", content: "Texture & resource packs from Modrinth and CurseForge." },
    ],
  }),
  component: () => (
    <Layout>
      <ContentBrowser
        type="resourcepack"
        title="Resource Packs"
        subtitle="Texture & resource packs from Modrinth & CurseForge."
      />
    </Layout>
  ),
});
