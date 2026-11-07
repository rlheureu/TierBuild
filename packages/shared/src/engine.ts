// The bottleneck engine. Each component is scored against the user's monitor target
// (resolution × framerate), not against other components in the abstract:
// GPU on the full workload, CPU on framerate only, RAM can only cap a build,
// PSU is a safety flag (never a bar), storage is a load-time note.

import {
  CPUS,
  GPUS,
  PSUS,
  RAM,
  STORAGE,
  TIERS,
  byId,
  resolveTarget,
  type Cpu,
  type Gpu,
  type Target,
  type TierInfo,
} from './data.js';

// Sustained fps a CPU of each tier can feed the GPU.
export const CPU_FPS_ANCHORS = [30, 60, 100, 144, 180, 240];

// Minimum VRAM (GB) current AAA titles want at each GPU workload tier.
export const VRAM_FLOOR: Record<number, number> = { 0: 2, 1: 6, 2: 10, 3: 12, 4: 16, 5: 20 };

export const NUM_SLOTS = 6;

export const DEFAULT_AFFILIATE_TAG = 'tierbuild-20';

export type Category = 'cpu' | 'gpu' | 'ram';

// Deterministic tie-break when two components share the same negative delta.
const BOTTLENECK_PRIORITY: Record<Category, number> = { gpu: 0, cpu: 1, ram: 2 };

export interface ComponentRow {
  category: Category;
  label: string;
  name: string;
  spec: string;
  price: number;
  tier: number;
  tierInfo: TierInfo;
  delta: number;
  barPct: number;
  notes: string[];
}

export interface Recommendation {
  part: { id: string; name: string; price: number; tier?: number };
  category: Category;
  tier: TierInfo;
  url: string;
  stretch: boolean;
}

export interface PsuStatus {
  level: 'danger' | 'ok';
  text: string;
}

export interface BuildResult {
  target: Target;
  workload: string;
  capacity: string;
  rows: ComponentRow[];
  bottleneck: ComponentRow | null;
  verdict: string;
  recommendation: Recommendation | null;
  stretch: Recommendation | null;
  psuStatus: PsuStatus | null;
  storageNote: string | null;
  targetLinePct: number;
}

export interface EvaluateInput {
  cpuId?: string | null;
  gpuId?: string | null;
  targetId?: string | null;
  resolution?: string | null;
  fps?: string | number | null;
  ramId?: string | null;
  storageId?: string | null;
  psuId?: string | null;
  affiliateTag?: string | null;
}

// A CPU's tier is the highest framerate anchor it sustains.
export function cpuTier(cpu: Cpu): number {
  let tier = 0;
  CPU_FPS_ANCHORS.forEach((fps, i) => {
    if (cpu.sustainedFps >= fps) tier = i;
  });
  return tier;
}

// Lowest CPU tier whose framerate anchor covers the target framerate.
export function cpuTierRequired(targetFps: number): number {
  const i = CPU_FPS_ANCHORS.findIndex((fps) => fps >= targetFps);
  return i === -1 ? CPU_FPS_ANCHORS.length - 1 : i;
}

// Rated wattage needed: component draw plus 50% transient headroom, rounded up to 50W.
export function psuWattsRequired(cpu: Cpu, gpu: Gpu): number {
  return Math.ceil(((cpu.tdp + gpu.tdp) * 1.5) / 50) * 50;
}

// Spaces become '+'; characters that would break the query (&, #, +, %) are percent-encoded.
function queryValue(text: string): string {
  return encodeURIComponent(text).replaceAll('%20', '+');
}

export function affiliateUrl(component: { name: string }, tag?: string | null): string {
  return `https://www.amazon.com/s?k=${queryValue(component.name)}&tag=${queryValue(tag || DEFAULT_AFFILIATE_TAG)}`;
}

function roundTo1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Bar width as % of the 6-slot scale; the bar touches the target line when delta == 0.
function bar(target: Target, delta: number): number {
  const slot = Math.max(0, Math.min(NUM_SLOTS - 1, target.tier + delta));
  return roundTo1(((slot + 1) / NUM_SLOTS) * 100);
}

function componentRow(
  category: Category,
  label: string,
  part: { name: string; price: number },
  tier: number,
  delta: number,
  target: Target,
  spec: string,
  notes: string[] = [],
): ComponentRow {
  return {
    category,
    label,
    name: part.name,
    spec,
    price: part.price,
    tier,
    tierInfo: TIERS[tier]!,
    delta,
    barPct: bar(target, delta),
    notes,
  };
}

// Returns null if the CPU, GPU, or resolution/framerate pair is not recognised.
// Prefer resolution + fps; targetId is accepted for legacy permalinks.
export function evaluate(input: EvaluateInput): BuildResult | null {
  const cpu = byId(CPUS, input.cpuId);
  const gpu = byId(GPUS, input.gpuId);
  const target = resolveTarget({
    resolution: input.resolution,
    fps: input.fps,
    targetId: input.targetId,
  });
  if (!cpu || !gpu || !target) {
    return null;
  }

  const rows: ComponentRow[] = [];

  const cTier = cpuTier(cpu);
  const cDelta = cTier - cpuTierRequired(target.fps);
  rows.push(
    componentRow(
      'cpu',
      'CPU',
      cpu,
      cTier,
      cDelta,
      target,
      `~${cpu.sustainedFps} fps sustained (median AAA title)`,
    ),
  );

  const gDelta = gpu.tier - target.gpuTier;
  const gNotes: string[] = [];
  const vramFloor = VRAM_FLOOR[target.gpuTier]!;
  if (gpu.vram < vramFloor) {
    gNotes.push(`VRAM-limited at this workload (${gpu.vram}GB where titles want ${vramFloor}GB+)`);
  }
  if (gpu.upscaler && gpu.tier < NUM_SLOTS - 1) {
    gNotes.push(
      `${TIERS[gpu.tier]!.name} native / ${TIERS[gpu.tier + 1]!.name} with ${gpu.upscaler} Quality`,
    );
  }
  rows.push(
    componentRow(
      'gpu',
      'GPU',
      gpu,
      gpu.tier,
      gDelta,
      target,
      `${gpu.vram}GB VRAM, ${gpu.tdp}W`,
      gNotes,
    ),
  );

  const ram = input.ramId ? byId(RAM, input.ramId) : undefined;
  if (ram) {
    const rDelta = Math.min(0, ram.tier - target.tier);
    rows.push(
      componentRow('ram', 'RAM', ram, ram.tier, rDelta, target, 'adequacy-tiered', [
        `Adequate through ${TIERS[ram.tier]!.name} builds`,
      ]),
    );
  }

  const storage = input.storageId ? byId(STORAGE, input.storageId) : undefined;
  let storageNote: string | null = null;
  if (storage && storage.tier < target.tier) {
    storageNote =
      `${storage.name} is below ${TIERS[target.tier]!.name}-tier class, which affects load times and ` +
      'DirectStorage titles — not framerate.';
  }

  const psu = input.psuId ? byId(PSUS, input.psuId) : undefined;
  let psuStatus: PsuStatus | null = null;
  const wattsNeeded = psuWattsRequired(cpu, gpu);
  if (psu) {
    if (psu.watts < wattsNeeded) {
      psuStatus = {
        level: 'danger',
        text:
          `${psu.name} is insufficient for this build (~${wattsNeeded}W recommended ` +
          `for a ${cpu.tdp + gpu.tdp}W component draw). This is a safety flag, not a bottleneck.`,
      };
    } else if (psu.watts >= wattsNeeded + 250) {
      psuStatus = {
        level: 'ok',
        text: `${psu.name} is oversized — that's fine, you have headroom for future upgrades.`,
      };
    } else {
      psuStatus = {
        level: 'ok',
        text: `${psu.name} is adequate for this build (~${wattsNeeded}W recommended).`,
      };
    }
  }

  // Bottleneck: most negative delta; ties broken GPU > CPU > RAM.
  let bottleneck: ComponentRow | null = null;
  for (const row of rows) {
    if (row.delta >= 0) continue;
    if (
      !bottleneck ||
      row.delta < bottleneck.delta ||
      (row.delta === bottleneck.delta &&
        BOTTLENECK_PRIORITY[row.category] < BOTTLENECK_PRIORITY[bottleneck.category])
    ) {
      bottleneck = row;
    }
  }

  const workload = target.shortLabel;
  const recommendation = bottleneck
    ? recommend(bottleneck, target, false, input.affiliateTag)
    : null;
  let stretch = bottleneck ? recommend(bottleneck, target, true, input.affiliateTag) : null;
  if (stretch && recommendation && stretch.part.id === recommendation.part.id) {
    stretch = null;
  }

  return {
    target,
    workload,
    capacity: capacitySummary(rows, target),
    rows,
    bottleneck,
    verdict: verdict(bottleneck, rows, workload),
    recommendation,
    stretch,
    psuStatus,
    storageNote,
    targetLinePct: roundTo1(((target.tier + 1) / NUM_SLOTS) * 100),
  };
}

// Plain-language system capacity for the chosen res @ fps.
function capacitySummary(rows: ComponentRow[], target: Target): string {
  const cpuRow = rows.find((r) => r.category === 'cpu');
  const gpuRow = rows.find((r) => r.category === 'gpu');
  const parts: string[] = [];
  if (gpuRow) {
    parts.push(`Your GPU is ${gpuRow.tierInfo.name} (${gpuRow.tierInfo.target} class)`);
  }
  if (cpuRow) {
    const fps = CPUS.find((c) => c.name === cpuRow.name)!.sustainedFps;
    parts.push(`your CPU is ${cpuRow.tierInfo.name} (~${fps} fps sustained)`);
  }
  if (parts.length === 0) {
    return '';
  }
  return `${parts.join('; ')} — for ${target.shortLabel}.`;
}

function verdict(bottleneck: ComponentRow | null, rows: ComponentRow[], workload: string): string {
  const cpuGpu = rows.filter((r) => r.category === 'cpu' || r.category === 'gpu');
  if (!bottleneck) {
    const headroom = Math.min(...cpuGpu.map((r) => r.delta));
    if (headroom > 0) {
      return (
        `Balanced build with headroom — for ${workload} your monitor is ` +
        'now the bottleneck. Time for a nicer panel?'
      );
    }
    return (
      `Balanced build for ${workload}. Every component is pulling its weight ` +
      '— no gray drops in this loot table.'
    );
  }

  let text = `Your ${bottleneck.label} is your bottleneck for ${workload}.`;
  const others = cpuGpu.filter((r) => r !== bottleneck);
  if (others.length > 0) {
    const bestOther = others.reduce((best, r) => (r.delta > best.delta ? r : best));
    const gap = bestOther.delta - bottleneck.delta;
    if (gap >= 2) {
      text += ` You're leaving roughly ${gap} tiers of ${bestOther.label} performance on the table.`;
    } else if (gap === 1) {
      text += ` You're leaving roughly one tier of ${bestOther.label} performance on the table.`;
    }
  }
  return text;
}

// Cheapest single swap that brings the build to target (one tier higher when stretch).
// Deterministic from tier math — the affiliate tag never affects ranking.
function recommend(
  bottleneck: ComponentRow,
  target: Target,
  stretch: boolean,
  affiliateTag?: string | null,
): Recommendation | null {
  const bump = stretch ? 1 : 0;
  let required: number;
  let pool: { id: string; name: string; price: number; tier?: number }[];
  if (bottleneck.category === 'cpu') {
    required = Math.min(NUM_SLOTS - 1, cpuTierRequired(target.fps) + bump);
    pool = CPUS.filter((c) => cpuTier(c) >= required);
  } else if (bottleneck.category === 'gpu') {
    required = Math.min(NUM_SLOTS - 1, target.gpuTier + bump);
    const floor = VRAM_FLOOR[required]!;
    pool = GPUS.filter((g) => g.tier >= required && g.vram >= floor);
  } else {
    required = Math.min(NUM_SLOTS - 1, target.tier + bump);
    pool = RAM.filter((r) => r.tier >= required);
  }
  if (pool.length === 0) {
    return null;
  }
  // First cheapest in catalog order, so ties resolve the same way every time.
  const pick = pool.reduce((best, p) => (p.price < best.price ? p : best));
  return {
    part: pick,
    category: bottleneck.category,
    tier: TIERS[required]!,
    url: affiliateUrl(pick, affiliateTag),
    stretch,
  };
}
