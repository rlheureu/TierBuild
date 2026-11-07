# TierBuild

**Performance-first gaming PC build checker** — every part gets a colored loot-rarity tier, and your monitor’s **resolution + framerate** set the target. The site answers: *what’s holding this PC back for the panel you actually use?*

## Why this exists

Most builders optimize for price and socket compatibility. TierBuild embeds performance into the equation:

1. **Loot tiers** (Common → Mythic) for CPU, GPU, and adequacy parts  
2. **Monitor demand** as first-class inputs: resolution and framerate  
3. **Bottleneck bars** relative to that target — not abstract “% bottleneck”  
4. **One honest upgrade**: the cheapest single swap that hits your res @ fps  

## How scoring works

| Component | Judged on |
|-----------|-----------|
| **GPU** | Full resolution + framerate workload |
| **CPU** | Framerate only (resolution does not re-tier the CPU) |
| **RAM** | Adequacy — can cap a build, never boost it |
| **Storage** | Note only (load times / DirectStorage) |
| **PSU** | Safety / headroom flag, not a bottleneck bar |
| **Monitor** | The demand side — target line on the bars |

**Canonical example:** a midrange CPU + flagship GPU bottlenecks at **1440p @ 144** but is balanced at **4K @ 60** — same hardware, different framerate demand.

### Tier ladder

| Tier | Color | Anchors (high settings, native, no upscale) |
|------|-------|-----------------------------------------------|
| Common | Gray | 1080p @ 30 |
| Uncommon | Green | 1080p @ 60 |
| Rare | Blue | 1440p @ 60 / 1080p @ 144 |
| Epic | Purple | 1440p @ 144 / 4K @ 60 |
| Legendary | Orange | 4K @ 120 |
| Mythic | Red | 4K @ 144+ |

## Run locally

```bash
cd Coding/TierBuild
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python tierbuild.py
```

Open [http://127.0.0.1:5050](http://127.0.0.1:5050).

## Tests

```bash
python -m unittest tests -v
```

## Permalinks

Preferred:

```
/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144
```

Legacy `target=` ids (e.g. `target=1440p144`) still resolve.

Optional: `ram`, `storage`, `psu`.

## Project layout

```
TierBuild/
  app/
    data.py       # Tiers, res×fps matrix, curated catalog
    engine.py     # Bottleneck math, recs, capacity summary
    routes.py     # /  /build  /methodology
    templates/    # Form, result, methodology
    static/       # Dark loot-tier UI
  tests.py
  tierbuild.py    # Dev server entry
  config.py
```

## Notes

- Catalog is a **curated sample set** — prices and tiers are illustrative.  
- Affiliate links are illustrative; **recommendation order is never driven by affiliate rate**.  
- Frame generation is excluded from tier math in v1.  

## Out of scope (v1)

Guided budget builder, live retail pricing, accounts, full mechanical compatibility, genre-specific profiles.
