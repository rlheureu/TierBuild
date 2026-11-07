// Editorial content for a part page. Every claim points at a source, so uncited copy can't be written.

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  // ISO date the source was last checked, e.g. '2026-11-07'.
  accessed: string;
}

export interface CitedParagraph {
  text: string;
  sourceIds: string[];
}

export interface OemEntry {
  name: string;
  sku?: string;
  sourceId: string;
}

export interface LaptopEntry extends OemEntry {
  // True when the laptop uses the mobile chip of the same name rather than the desktop part.
  mobileVariant: boolean;
}

export interface PartContent {
  history: CitedParagraph[];
  oems: {
    boardPartners: OemEntry[];
    prebuilts: OemEntry[];
    laptops: LaptopEntry[];
  };
  sources: Source[];
  // ISO date the content was last reviewed.
  reviewedOn: string;
}
