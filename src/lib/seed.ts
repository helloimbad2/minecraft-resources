// Minecraft seed utilities. Slime chunks are computed ACCURATELY using Java's
// Random LCG. Biomes and structures are deterministic stylized approximations.

const MASK48 = (1n << 48n) - 1n;
const MULT = 0x5deece66dn;
const ADD = 0xbn;

/** Faithful port of java.util.Random (enough for slime-chunk math). */
export class JavaRandom {
  private seed = 0n;
  constructor(seed: bigint) {
    this.setSeed(seed);
  }
  setSeed(seed: bigint) {
    this.seed = (seed ^ MULT) & MASK48;
  }
  private next(bits: number): number {
    this.seed = (this.seed * MULT + ADD) & MASK48;
    return Number(BigInt.asIntN(32, this.seed >> BigInt(48 - bits)));
  }
  nextInt(bound: number): number {
    if ((bound & -bound) === bound) {
      // power of two
      return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
    }
    let bits: number;
    let val: number;
    do {
      bits = this.next(31);
      val = bits % bound;
    } while (bits - val + (bound - 1) < 0);
    return val;
  }
}

/** Parse a user-entered seed exactly like Minecraft: numeric -> long, else String.hashCode. */
export function parseSeed(input: string): bigint {
  const s = input.trim();
  if (/^-?\d+$/.test(s)) {
    try {
      return BigInt.asIntN(64, BigInt(s));
    } catch {
      /* too large -> hash */
    }
  }
  // Java String.hashCode
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return BigInt(h);
}

/** Accurate slime chunk test for a given world seed and chunk coordinates. */
export function isSlimeChunk(worldSeed: bigint, cx: number, cz: number): boolean {
  const x = BigInt(cx);
  const z = BigInt(cz);
  const seed = BigInt.asIntN(
    64,
    worldSeed +
      x * x * 0x4c1906n +
      x * 0x5ac0dbn +
      z * z * 0x4307a7n +
      z * 0x5f24fn,
  );
  const rng = new JavaRandom(BigInt.asIntN(64, seed ^ 0x3ad8025fn));
  return rng.nextInt(10) === 0;
}

// ---- Stylized biome generation (value noise on temperature + humidity) ----

function hash2(seed: number, x: number, y: number): number {
  let h = seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
function valueNoise(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const v00 = hash2(seed, x0, y0);
  const v10 = hash2(seed, x0 + 1, y0);
  const v01 = hash2(seed, x0, y0 + 1);
  const v11 = hash2(seed, x0 + 1, y0 + 1);
  const a = v00 + (v10 - v00) * fx;
  const b = v01 + (v11 - v01) * fx;
  return a + (b - a) * fy;
}
function octaveNoise(seed: number, x: number, y: number): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < 4; o++) {
    sum += valueNoise(seed + o * 1013, x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export interface Biome {
  name: string;
  color: string;
}

export const BIOMES: Biome[] = [
  { name: "Ocean", color: "#3a6ea5" },
  { name: "Deep Ocean", color: "#2a5080" },
  { name: "Beach", color: "#e3d59e" },
  { name: "Plains", color: "#8db360" },
  { name: "Forest", color: "#3f6d2a" },
  { name: "Birch Forest", color: "#6f9c5a" },
  { name: "Desert", color: "#dbcd8f" },
  { name: "Savanna", color: "#b0a449" },
  { name: "Badlands", color: "#b3622e" },
  { name: "Jungle", color: "#1f5d2a" },
  { name: "Taiga", color: "#3c5e4a" },
  { name: "Snowy Plains", color: "#e6eef2" },
  { name: "Snowy Taiga", color: "#9fb3a8" },
  { name: "Swamp", color: "#4c5e3a" },
  { name: "Mountains", color: "#8a8d92" },
];

/** Returns the biome index for a world block coordinate. */
export function biomeAt(seedHash: number, wx: number, wz: number): number {
  const scale = 0.0012;
  const continent = octaveNoise(seedHash, wx * scale, wz * scale);
  if (continent < 0.36) return 1; // deep ocean
  if (continent < 0.44) return 0; // ocean
  if (continent < 0.47) return 2; // beach

  const temp = octaveNoise(seedHash + 7919, wx * 0.0016, wz * 0.0016);
  const humid = octaveNoise(seedHash + 104729, wx * 0.0016, wz * 0.0016);
  const elev = octaveNoise(seedHash + 31337, wx * 0.0009, wz * 0.0009);

  if (elev > 0.78) return 14; // mountains

  if (temp < 0.25) {
    return humid < 0.5 ? 11 : 12; // snowy plains / snowy taiga
  }
  if (temp < 0.45) {
    return humid < 0.5 ? 3 : 10; // plains / taiga
  }
  if (temp < 0.7) {
    if (humid < 0.35) return 3; // plains
    if (humid < 0.6) return 5; // birch
    if (humid < 0.8) return 4; // forest
    return 13; // swamp
  }
  // hot
  if (humid < 0.3) return 6; // desert
  if (humid < 0.45) return 8; // badlands
  if (humid < 0.65) return 7; // savanna
  return 9; // jungle
}

export interface StructureType {
  name: string;
  color: string;
  spacing: number; // region size in chunks
  salt: number;
}

/** Water biome indices (ocean / deep ocean / beach edge). */
const WATER = new Set([0, 1]);
export function isWater(idx: number): boolean {
  return WATER.has(idx);
}

/** Thin winding river band over land — stylized, chunkbase-like. */
export function riverAt(seedHash: number, wx: number, wz: number): boolean {
  const r = octaveNoise(seedHash + 555, wx * 0.0022, wz * 0.0022);
  return Math.abs(r - 0.5) < 0.012;
}


export const STRUCTURE_TYPES: StructureType[] = [
  { name: "Village", color: "#ffd24d", spacing: 34, salt: 10387312 },
  { name: "Pillager Outpost", color: "#c084fc", spacing: 32, salt: 165745296 },
  { name: "Desert Temple", color: "#fbbf24", spacing: 32, salt: 14357617 },
  { name: "Jungle Temple", color: "#34d399", spacing: 32, salt: 14357619 },
  { name: "Witch Hut", color: "#a78bfa", spacing: 32, salt: 14357620 },
  { name: "Woodland Mansion", color: "#f87171", spacing: 80, salt: 10387319 },
  { name: "Ocean Monument", color: "#22d3ee", spacing: 32, salt: 10387313 },
  { name: "Ruined Portal", color: "#fb7185", spacing: 25, salt: 34222645 },
  { name: "Shipwreck", color: "#60a5fa", spacing: 24, salt: 165745295 },
  { name: "Stronghold", color: "#e5e7eb", spacing: 0, salt: 0 },
];

export interface StructureMarker {
  type: string;
  color: string;
  x: number; // world block X
  z: number; // world block Z
}

/**
 * Deterministic structure placement using Minecraft's region-grid concept
 * (region -> jittered chunk). Coordinates are stylized approximations.
 */
export function structuresInView(
  worldSeed: bigint,
  seedHash: number,
  minX: number,
  minZ: number,
  maxX: number,
  maxZ: number,
): StructureMarker[] {
  const out: StructureMarker[] = [];
  const seedNum = Number(BigInt.asIntN(32, worldSeed));

  for (const t of STRUCTURE_TYPES) {
    if (t.name === "Stronghold") continue; // handled separately
    const spacingBlocks = t.spacing * 16;
    const r0x = Math.floor(minX / spacingBlocks) - 1;
    const r1x = Math.floor(maxX / spacingBlocks) + 1;
    const r0z = Math.floor(minZ / spacingBlocks) - 1;
    const r1z = Math.floor(maxZ / spacingBlocks) + 1;
    for (let rx = r0x; rx <= r1x; rx++) {
      for (let rz = r0z; rz <= r1z; rz++) {
        const rng = new JavaRandom(
          BigInt.asIntN(
            64,
            worldSeed +
              BigInt(rx) * 341873128712n +
              BigInt(rz) * 132897987541n +
              BigInt(t.salt),
          ),
        );
        // ~30% chance the region actually has the structure (keeps the map readable)
        if (rng.nextInt(10) >= 3) continue;
        const offX = rng.nextInt(Math.max(1, t.spacing - 8));
        const offZ = rng.nextInt(Math.max(1, t.spacing - 8));
        const wx = (rx * t.spacing + offX) * 16 + 8;
        const wz = (rz * t.spacing + offZ) * 16 + 8;
        if (wx < minX || wx > maxX || wz < minZ || wz > maxZ) continue;
        out.push({ type: t.name, color: t.color, x: wx, z: wz });
      }
    }
  }

  // 3 strongholds in a ring (stylized).
  const ringRng = new JavaRandom(BigInt.asIntN(64, worldSeed ^ 0x1234abcdn));
  const baseAngle = (ringRng.nextInt(360) * Math.PI) / 180;
  for (let i = 0; i < 3; i++) {
    const dist = 1280 + ringRng.nextInt(1024);
    const a = baseAngle + (i * 2 * Math.PI) / 3;
    const wx = Math.round(Math.cos(a) * dist);
    const wz = Math.round(Math.sin(a) * dist);
    if (wx < minX || wx > maxX || wz < minZ || wz > maxZ) continue;
    out.push({ type: "Stronghold", color: "#e5e7eb", x: wx, z: wz });
  }

  return out;
}

/** Deterministic stylized spawn point near origin. */
export function spawnPoint(worldSeed: bigint): { x: number; z: number } {
  const rng = new JavaRandom(BigInt.asIntN(64, worldSeed ^ 0x9e3779b9n));
  return { x: rng.nextInt(512) - 256, z: rng.nextInt(512) - 256 };
}

export function seedHashFor(worldSeed: bigint): number {
  return Number(BigInt.asUintN(32, worldSeed ^ (worldSeed >> 32n)));
}
