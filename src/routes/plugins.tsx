import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ContentBrowser } from "@/components/ContentBrowser";

export const Route = createFileRoute("/plugins")({
  head: () => ({
    meta: [
      { title: "Minecraft Plugins — Modrinth & CurseForge | Minecraft Resources" },
      { name: "description", content: "Browse and download Minecraft server plugins from Modrinth and CurseForge." },
      { property: "og:title", content: "Minecraft Plugins" },
      { property: "og:description", content: "Server plugins from Modrinth and CurseForge." },
    ],
  }),
  component: () => (
    <Layout>
      <ContentBrowser
        type="plugin"
        title="Plugins"
        subtitle="Server plugins for Bukkit, Spigot & Paper from Modrinth & CurseForge."
      />
    </Layout>
  ),
});
