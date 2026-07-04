import rawItems from "./items.json";
import iconMap from "./icon-map.json";

export interface MinecraftItem {
  id: number;
  name: string;
  displayName: string;
  stackSize: number;
  category: string;
}

export const items: MinecraftItem[] = rawItems as MinecraftItem[];

export const MC_VERSION = "1.21";
const TEXTURE_BASE = `https://assets.mcasset.cloud/${MC_VERSION}/assets/minecraft/textures`;
const RENDER_BASE = "https://static.minecraftitemids.com/64";

/**
 * Pre-rendered, ready-to-use item icons from ccLeaf's MCIcons (ccvaults.com).
 * These are consistent, good-looking, up-to-date renders (blocks shown
 * isometrically), so they take priority whenever an icon exists for the item.
 * Map values are URL-encoded "category/subcategory/file.png" path segments.
 */
const MC_ICONS = iconMap as Record<string, string>;
const MC_ICONS_BASE = "https://ccvaults.com/thumbnails";

export interface TextureCandidate {
  url: string;
  /** "flat" = pixel-art sprite, "cube" = CSS isometric block, "render" = smooth pre-rendered icon. */
  type: "flat" | "cube" | "render";
  /** Optional distinct top-face texture for the cube. */
  top?: string;
}

/**
 * Ordered texture candidates. The sprite component preloads each until one
 * resolves:
 * 1. Pre-rendered mc-icons icon (best-looking, when available).
 * 2. Flat item sprite (true items — up-to-date 1.21).
 * 3. Full block texture rendered as a smooth 3D cube.
 * 4. Isometric render (covers complex blocks like the crafting table).
 * 5. Block side texture fallback.
 */
export function getTextureCandidates(name: string): TextureCandidate[] {
  const block = (n: string): TextureCandidate => ({
    url: `${TEXTURE_BASE}/block/${n}.png`,
    type: "cube",
    top: `${TEXTURE_BASE}/block/${n}_top.png`,
  });

  const candidates: TextureCandidate[] = [];

  const icon = MC_ICONS[name];
  if (icon) {
    candidates.push({ url: `${MC_ICONS_BASE}/${icon}`, type: "render" });
  }

  candidates.push(
    { url: `${TEXTURE_BASE}/item/${name}.png`, type: "flat" },
    block(name),
    { url: `${RENDER_BASE}/${name}.png`, type: "flat" },
    { url: `${TEXTURE_BASE}/block/${name}_side.png`, type: "cube", top: `${TEXTURE_BASE}/block/${name}_top.png` },
  );

  // Partial blocks (slabs, stairs, walls, fences…) reuse their base block texture.
  const suffixes = ["_slab", "_stairs", "_wall", "_fence", "_fence_gate", "_button", "_pressure_plate"];
  for (const suf of suffixes) {
    if (name.endsWith(suf)) {
      const base = name.slice(0, -suf.length);
      candidates.push(block(base), block(`${base}s`));
      // e.g. "polished_tuff_brick_slab" → base block is "polished_tuff_bricks"
      if (base.endsWith("_brick")) candidates.push(block(`${base}s`));
      break;
    }
  }

  return candidates;
}


/** The single best download/display URL for an item. */
export function getDownloadUrl(name: string): string {
  const icon = MC_ICONS[name];
  if (icon) return `${MC_ICONS_BASE}/${icon}`;
  return `${TEXTURE_BASE}/item/${name}.png`;
}



export const CATEGORIES = [
  "Building Blocks",
  "Decoration",
  "Redstone",
  "Transportation",
  "Tools",
  "Combat",
  "Food",
  "Brewing",
  "Materials",
  "Natural",
  "Spawn Eggs",
  "Music Discs",
  "Miscellaneous",
] as const;

export function getItemBySlug(slug: string): MinecraftItem | undefined {
  return items.find((i) => i.name === slug);
}

const CATEGORY_FACTS: Record<string, { desc: string; found: string[] }> = {
  "Building Blocks": {
    desc: "A solid block primarily used for construction and shaping the world.",
    found: ["Mined with the appropriate tool", "Crafted at a crafting table", "Naturally generated in the world"],
  },
  Decoration: {
    desc: "A decorative block or item used to add detail and personality to builds.",
    found: ["Crafted at a crafting table", "Found in structures and villages", "Traded with villagers"],
  },
  Redstone: {
    desc: "A redstone component used to build circuits, contraptions and automation.",
    found: ["Crafted at a crafting table", "Found in dungeons and mineshafts", "Mined as redstone ore underground"],
  },
  Transportation: {
    desc: "Used to move players, mobs or items more quickly around the world.",
    found: ["Crafted at a crafting table", "Dropped by mobs", "Found in chests"],
  },
  Tools: {
    desc: "A tool used to harvest, build or interact with the world more efficiently.",
    found: ["Crafted at a crafting table", "Found in chests across structures", "Traded with villagers"],
  },
  Combat: {
    desc: "Gear and weapons used to fight mobs and other players, or to defend yourself.",
    found: ["Crafted at a crafting table or anvil", "Dropped by mobs", "Found in loot chests"],
  },
  Food: {
    desc: "A consumable item that restores hunger and saturation.",
    found: ["Farmed or harvested", "Dropped by animals", "Cooked in a furnace, smoker or campfire"],
  },
  Brewing: {
    desc: "An ingredient or item used in the brewing stand to make potions.",
    found: ["Brewed at a brewing stand", "Dropped by mobs in the Nether", "Found in loot chests"],
  },
  Materials: {
    desc: "A crafting material used as an ingredient for many recipes.",
    found: ["Mined or smelted from ore", "Dropped by mobs", "Found in chests and traded with villagers"],
  },
  Natural: {
    desc: "A naturally generated block or item found throughout the world.",
    found: ["Generated naturally in biomes", "Harvested with hand or tools", "Bonemealed or grown"],
  },
  "Spawn Eggs": {
    desc: "A creative-mode item that spawns its corresponding mob when used.",
    found: ["Creative inventory only", "Obtained via commands"],
  },
  "Music Discs": {
    desc: "A music disc that plays a track when placed in a jukebox.",
    found: ["Dropped when a creeper is killed by a skeleton", "Found in dungeon and structure chests"],
  },
  Miscellaneous: {
    desc: "A useful item with a variety of purposes in the game.",
    found: ["Crafted, found or obtained through gameplay"],
  },
};

export function getItemFacts(item: MinecraftItem) {
  const base = CATEGORY_FACTS[item.category] ?? CATEGORY_FACTS.Miscellaneous;
  return {
    description: base.desc,
    foundIn: base.found,
    stackable: item.stackSize > 1,
    renewable: ["Food", "Natural", "Materials", "Brewing"].includes(item.category),
  };
}
