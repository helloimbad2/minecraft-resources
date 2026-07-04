import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Download, Loader2, Copy } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupPlayer, type PlayerProfile } from "@/lib/players.functions";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Minecraft Players — Skins, Avatars & UUIDs | Minecraft Resources" },
      { name: "description", content: "Look up Minecraft players: view skins, avatars, 3D renders and UUIDs, and download skins." },
      { property: "og:title", content: "Minecraft Player Lookup" },
      { property: "og:description", content: "View Minecraft player skins, avatars and UUIDs." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const lookup = useServerFn(lookupPlayer);
  const [input, setInput] = useState("");
  const [players, setPlayers] = useState<PlayerProfile[]>([]);

  const mutation = useMutation({
    mutationFn: (username: string) => lookup({ data: { username } }),
    onSuccess: (profile) => {
      if (profile.found) {
        setPlayers((prev) => [profile, ...prev.filter((p) => p.uuid !== profile.uuid)]);
      }
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-primary">Player Lookup</h1>
          <p className="mt-1 text-muted-foreground">
            Search any Minecraft username to view their skin, 3D render and UUID.
          </p>
        </div>

        <form
          className="flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) mutation.mutate(input.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a username..."
              maxLength={16}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="default" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Look up"}
          </Button>
        </form>

        {mutation.data && !mutation.data.found && (
          <p className="text-sm text-destructive">{mutation.data.error ?? "Player not found."}</p>
        )}

        {players.length === 0 ? (
          <div className="border-2 border-border bg-card p-10 text-center text-muted-foreground">
            No players yet — search a username to get started.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <div key={p.uuid} className="flex flex-col border-2 border-border bg-card p-5 pixel-shadow-sm">
                <div className="flex gap-4">
                  <img
                    src={`https://render.crafty.gg/3d/bust/${p.username}`}
                    alt={p.username}
                    loading="lazy"
                    className="h-40 w-auto object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://render.crafty.gg/2d/head/${p.username}`}
                        alt=""
                        className="size-8 rounded-md border border-border"
                      />
                      <h2 className="truncate font-display text-lg">{p.username}</h2>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">UUID</div>
                    <button
                      onClick={() => navigator.clipboard?.writeText(p.uuid ?? "")}
                      className="mt-1 flex w-full items-center gap-1 break-all border border-border bg-muted/40 p-1.5 text-left text-[10px] hover:text-foreground"
                    >
                      <Copy className="size-3 shrink-0" />
                      {p.uuid}
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="default" size="sm" className="flex-1">
                    <a href={`https://crafthead.net/skin/${p.rawId}`} target="_blank" rel="noreferrer">
                      <Download className="size-4" /> Skin
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <a href={`https://namemc.com/profile/${p.username}`} target="_blank" rel="noreferrer">
                      NameMC
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
