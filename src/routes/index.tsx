import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ItemSprite } from "@/components/ItemSprite";
import { Button } from "@/components/ui/button";
import { MC_VERSION } from "@/data/items";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minecraft Resources — Items, Mods, Packs, Shaders & More" },
      {
        name: "description",
        content:
          "Browse every Minecraft item, plus mods, resource packs, plugins, datapacks and shaders from Modrinth & CurseForge. Look up players, preview seeds and find clients.",
      },
      { property: "og:title", content: "Minecraft Resources" },
      {
        property: "og:description",
        content:
          "Items, mods, resource packs, plugins, datapacks, shaders, seed maps, player lookup and clients — all in one place.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { to: "/items", label: "Items", icon: "diamond", desc: "Browse every Minecraft item with facts, textures and downloads." },
  { to: "/mods", label: "Mods", icon: "crafting_table", desc: "Discover mods from Modrinth & CurseForge." },
  { to: "/resource-packs", label: "Resource Packs", icon: "painting", desc: "Find texture & resource packs for any version." },
  { to: "/plugins", label: "Plugins", icon: "command_block", desc: "Server plugins for Bukkit, Spigot & Paper." },
  { to: "/datapacks", label: "Datapacks", icon: "writable_book", desc: "Game-changing datapacks for your worlds." },
  { to: "/shaders", label: "Shaders", icon: "glowstone_dust", desc: "Stunning shader packs to transform your visuals." },
  { to: "/seed-map", label: "Seed Map", icon: "filled_map", desc: "Preview a seed's biomes & structures." },
  { to: "/players", label: "Players", icon: "player_head", desc: "Look up player skins, avatars & UUIDs." },
  { to: "/clients", label: "Play", icon: "elytra", desc: "Clients, launchers & mod loaders with direct links." },
] as const;

function Home() {
  const featured = ["diamond", "netherite_ingot", "emerald", "golden_apple", "ender_pearl", "totem_of_undying", "nether_star", "elytra"];

  return (
    <Layout>
      <section className="relative overflow-hidden border-2 border-border bg-card pixel-shadow">
        <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div>
            <span className="inline-block border-2 border-border bg-muted/50 px-2 py-1 text-xs font-medium uppercase tracking-widest text-primary">
              Minecraft {MC_VERSION}
            </span>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              Everything <span className="text-primary">Minecraft</span>, in one block-built hub.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Browse items, grab mods, resource packs, shaders and datapacks, look up players, and
              preview seeds — all in a single place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/items">Browse Items</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/mods">Explore Mods</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {featured.map((name) => (
              <div
                key={name}
                className="aspect-square border-2 border-border bg-background p-3 pixel-shadow-sm"
              >
                <ItemSprite name={name} alt={name} size={56} className="size-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Explore</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group flex items-start gap-4 border-2 border-border bg-card p-5 pixel-shadow-sm transition-transform hover:-translate-y-1"
            >
              <div className="size-12 shrink-0 border-2 border-border bg-background p-1.5">
                <ItemSprite name={f.icon} alt={f.label} size={30} className="size-full" />
              </div>
              <div>
                <h3 className="font-display text-lg text-primary">{f.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
