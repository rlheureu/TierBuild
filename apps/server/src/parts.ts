import {
  CPUS,
  GPUS,
  TIERS,
  cpuEvidence,
  gpuEvidence,
  isPartCategory,
  type PartCategory,
  type PartContent,
  type PartPageResponse,
} from '@tierbuild/shared';
import { CPU_CONTENT } from './content/cpus.js';
import { GPU_CONTENT } from './content/gpus.js';
import type { PageMeta } from './pages.js';

export type ContentByCategory = Record<PartCategory, Record<string, PartContent>>;

const PART_CONTENT: ContentByCategory = { cpu: CPU_CONTENT, gpu: GPU_CONTENT };

// Object.hasOwn keeps ids like "constructor" from matching the record's prototype.
function contentFor(content: ContentByCategory, category: PartCategory, id: string) {
  return Object.hasOwn(content[category], id) ? content[category][id]! : null;
}

export function partPage(
  category: string,
  id: string,
  content: ContentByCategory = PART_CONTENT,
): PartPageResponse | null {
  if (!isPartCategory(category)) return null;

  if (category === 'cpu') {
    const part = CPUS.find((c) => c.id === id);
    if (!part) return null;
    const evidence = cpuEvidence(part);
    return {
      category,
      part,
      tierInfo: TIERS[evidence.tier]!,
      evidence,
      content: contentFor(content, category, id),
    };
  }

  const part = GPUS.find((g) => g.id === id);
  if (!part) return null;
  const evidence = gpuEvidence(part);
  return {
    category,
    part,
    tierInfo: TIERS[evidence.tier]!,
    evidence,
    content: contentFor(content, category, id),
  };
}

export function partMeta(page: PartPageResponse): PageMeta {
  const label = page.category.toUpperCase();
  const title = `${page.part.name} — ${page.tierInfo.name} ${label} — TierBuild`;
  const description =
    page.category === 'cpu'
      ? `The ${page.part.name} is a ${page.tierInfo.name}-tier CPU in TierBuild: about ${page.evidence.sustainedFps} fps sustained. See why, and where you'll find it.`
      : `The ${page.part.name} is a ${page.tierInfo.name}-tier GPU in TierBuild (${page.tierInfo.target} class, ${page.evidence.vram}GB VRAM). See why, and where you'll find it.`;
  return { title, description, ogTitle: title, ogDescription: description };
}
