import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Check } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clients, type ClientType } from "@/data/clients";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Play — Minecraft Clients, Launchers & Mod Loaders | Minecraft Resources" },
      {
        name: "description",
        content:
          "Everything you need to play: the best Minecraft clients, launchers and mod loaders with direct links.",
      },
      { property: "og:title", content: "Play — Clients, Launchers & Mod Loaders" },
      {
        property: "og:description",
        content: "The best Minecraft clients, launchers and mod loaders with direct links.",
      },
    ],
  }),
  component: ClientsPage,
});

const SECTIONS: { type: ClientType; title: string; blurb: string }[] = [
  { type: "Client", title: "Clients", blurb: "Enhanced game clients with FPS boosts, cosmetics and mods." },
  { type: "Launcher", title: "Launchers", blurb: "Install and manage modpacks and instances." },
  { type: "Mod Loader", title: "Mods", blurb: "Mod loaders and APIs that power modded Minecraft." },
];

function ClientsPage() {
  return (
    <Layout>
      <div className="space-y-10">
        <div>
          <h1 className="font-display text-3xl text-primary">Play</h1>
          <p className="mt-1 text-muted-foreground">
            Clients, launchers and mod loaders to get you into the game — with direct links.
          </p>
        </div>

        {SECTIONS.map((section) => {
          const list = clients.filter((c) => c.type === section.type);
          if (list.length === 0) return null;
          return (
            <section key={section.type} className="space-y-4">
              <div>
                <h2 className="font-display text-2xl">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.blurb}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <div
                    key={c.name}
                    className="flex flex-col border-2 border-border bg-card p-5 pixel-shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-xl">{c.name}</h3>
                      <Badge variant="secondary">{c.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-primary">{c.tagline}</p>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      {c.free && (
                        <span className="inline-flex items-center gap-1">
                          <Check className="size-3 text-primary" /> Free
                        </span>
                      )}
                    </div>
                    <Button asChild variant="default" className="mt-4">
                      <a href={c.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" /> Visit site
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Layout>
  );
}
