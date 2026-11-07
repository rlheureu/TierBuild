export interface TierItem {
  id: string;
  label: string;
  imageUrl?: string;
}

export interface Tier {
  id: string;
  name: string;
  color: string;
  itemIds: string[];
}

export interface TierList {
  id: string;
  title: string;
  tiers: Tier[];
  items: Record<string, TierItem>;
  unrankedItemIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthResponse {
  status: 'ok';
}
