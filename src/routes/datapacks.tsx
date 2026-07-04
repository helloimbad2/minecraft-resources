import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ContentBrowser } from "@/components/ContentBrowser";

export const Route = createFileRoute("/datapacks")({
  head: () => ({
    meta: [
      { title: "Minecraft Datapacks — Modrinth & CurseForge | Minecraft Resources" },
      { name: "description", content: "Browse and download Minecraft datapacks from Modrinth and CurseForge." },
      { property: "og:title", content: "Minecraft Datapacks" },
      { property: "og:description", content: "Datapacks from Modrinth and CurseForge." },
    ],
  }),
  component: () => (
    <Layout>
      <ContentBrowser
        type="datapack"
        title="Datapacks"
        subtitle="World-changing datapacks from Modrinth & CurseForge."
      />
    </Layout>
  ),
});
