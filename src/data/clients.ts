export type ClientType = "Client" | "Launcher" | "Mod Loader";

export interface MinecraftClient {
  name: string;
  tagline: string;
  description: string;
  type: ClientType;
  free: boolean;
  url: string;
}

export const clients: MinecraftClient[] = [
  // ── Clients ──
  {
    name: "Lunar Client",
    tagline: "All-in-one performance & PvP client",
    description:
      "A free modpack-style client bundling FPS boosts, popular mods and cosmetics, supporting versions from 1.7 up to the latest release.",
    type: "Client",
    free: true,
    url: "https://www.lunarclient.com/",
  },
  {
    name: "Feather Client",
    tagline: "Lightweight, fast and modern",
    description:
      "A lightweight client focused on a clean UI, strong performance and seamless server integrations.",
    type: "Client",
    free: true,
    url: "https://feathermc.com/",
  },
  {
    name: "NoRisk Client",
    tagline: "Free client with premium features",
    description:
      "A free, feature-rich client offering FPS boosts, cosmetics, capes and a growing library of mods with no paywalls.",
    type: "Client",
    free: true,
    url: "https://norisk.gg/",
  },
  {
    name: "LabyMod 4",
    tagline: "Feature-rich client with addons",
    description:
      "A highly customizable client with an addon marketplace, cosmetics, voice chat and deep server integrations for modern versions.",
    type: "Client",
    free: true,
    url: "https://www.labymod.net/",
  },

  // ── Launchers ──
  {
    name: "Modrinth App",
    tagline: "Open-source modpack launcher",
    description:
      "A fast, open-source launcher with one-click modpack installs and instant access to the entire Modrinth library.",
    type: "Launcher",
    free: true,
    url: "https://modrinth.com/app",
  },
  {
    name: "CurseForge",
    tagline: "The largest modpack hub",
    description:
      "Official launcher for browsing, installing and managing the massive CurseForge library of mods and modpacks.",
    type: "Launcher",
    free: true,
    url: "https://www.curseforge.com/download/app",
  },
  {
    name: "Prism Launcher",
    tagline: "Open-source instance manager",
    description:
      "A free, open-source launcher for managing multiple modded instances with Modrinth & CurseForge integration.",
    type: "Launcher",
    free: true,
    url: "https://prismlauncher.org/",
  },

  // ── Mod Loaders ──
  {
    name: "Fabric API",
    tagline: "Lightweight modding toolchain",
    description:
      "The essential library and mod loader for Fabric mods, pairing with mods like Sodium for huge performance gains on the latest versions.",
    type: "Mod Loader",
    free: true,
    url: "https://fabricmc.net/",
  },
  {
    name: "NeoForge",
    tagline: "The modern Forge successor",
    description:
      "A community-driven mod loader forked from Forge, now the default platform for many large modpacks on 1.20.2+.",
    type: "Mod Loader",
    free: true,
    url: "https://neoforged.net/",
  },
  {
    name: "Forge",
    tagline: "The classic modding platform",
    description:
      "The long-standing mod loader powering a huge library of Minecraft mods and modpacks across many versions.",
    type: "Mod Loader",
    free: true,
    url: "https://files.minecraftforge.net/",
  },
];
