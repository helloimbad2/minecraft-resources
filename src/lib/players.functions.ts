import { createServerFn } from "@tanstack/react-start";

export interface PlayerProfile {
  found: boolean;
  username: string;
  uuid: string | null;
  rawId: string | null;
  error?: string;
}

function formatUuid(id: string): string {
  const raw = id.replace(/-/g, "");
  if (raw.length !== 32) return id;
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

export const lookupPlayer = createServerFn({ method: "GET" })
  .inputValidator((data: { username: string }) => ({
    username: String(data?.username ?? "").trim().slice(0, 16),
  }))
  .handler(async ({ data }): Promise<PlayerProfile> => {
    const username = data.username;
    if (!username) {
      return { found: false, username, uuid: null, rawId: null, error: "Enter a username" };
    }
    if (!/^[A-Za-z0-9_]{1,16}$/.test(username)) {
      return { found: false, username, uuid: null, rawId: null, error: "Invalid username" };
    }

    // playerdb.co is reliable from edge/datacenter IPs (Mojang's API blocks many).
    try {
      const res = await fetch(
        `https://playerdb.co/api/player/minecraft/${encodeURIComponent(username)}`,
        { headers: { "User-Agent": "minecraft-resources/1.0 (lovable app)" } },
      );
      if (res.ok) {
        const json = (await res.json()) as any;
        const player = json?.data?.player;
        if (player?.id) {
          return {
            found: true,
            username: player.username ?? username,
            uuid: formatUuid(player.id),
            rawId: player.raw_id ?? String(player.id).replace(/-/g, ""),
          };
        }
      }
    } catch {
      /* fall through to Mojang */
    }

    // Fallback: Mojang API.
    try {
      const res = await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
        { headers: { "User-Agent": "minecraft-resources/1.0 (lovable app)" } },
      );
      if (res.status === 404 || res.status === 204) {
        return { found: false, username, uuid: null, rawId: null, error: "Player not found" };
      }
      if (res.ok) {
        const profile = (await res.json()) as { id: string; name: string };
        return {
          found: true,
          username: profile.name,
          uuid: formatUuid(profile.id),
          rawId: profile.id.replace(/-/g, ""),
        };
      }
    } catch {
      /* ignore */
    }

    return { found: false, username, uuid: null, rawId: null, error: "Player not found" };
  });
