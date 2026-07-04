import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/items", label: "Items" },
  { to: "/mods", label: "Mods" },
  { to: "/resource-packs", label: "Resource Packs" },
  { to: "/plugins", label: "Plugins" },
  { to: "/datapacks", label: "Datapacks" },
  { to: "/shaders", label: "Shaders" },
  { to: "/seed-map", label: "Seed Map" },
  { to: "/players", label: "Players" },
  { to: "/clients", label: "Play" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img
              src="/app-icon.png"
              alt="Minecraft Resources"
              width={36}
              height={36}
              className="size-9 border-2 border-border bg-background pixel-shadow-sm"
            />
            <span className="font-display text-lg leading-tight text-primary">
              Minecraft<span className="text-foreground"> Resources</span>
            </span>
          </Link>

          <nav className="-mb-1 ml-auto flex items-center gap-1 overflow-x-auto pb-1">
            {NAV.slice(1).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="shrink-0 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{
                  className:
                    "shrink-0 px-3 py-1.5 text-sm font-medium text-primary border-b-2 border-primary",
                }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t-2 border-border bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground">
          <p>
            Minecraft Resources — content from Modrinth & CurseForge. Textures from the Minecraft
            asset library. Not affiliated with Mojang or Microsoft.
          </p>
        </div>
      </footer>
    </div>
  );
}
