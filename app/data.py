"""Curated component catalog for TierBuild.

Tiers are indices 0-5 into TIERS (Common .. Mythic). GPU tiers are assigned
directly (human-reviewed). CPUs carry a sustained-fps figure; their tier is
derived from the framerate ladder in engine.py.

Monitor demand is first-class: every TARGET has explicit resolution + fps.
The form exposes those as separate fields; the engine scores against the
composed target (gpu_tier from the full workload, fps for the CPU only).

Prices are sample data for demo purposes.
"""

TIERS = [
    {'name': 'Common',    'color': '#9d9d9d', 'target': '1080p @ 30'},
    {'name': 'Uncommon',  'color': '#1eff00', 'target': '1080p @ 60'},
    {'name': 'Rare',      'color': '#0070dd', 'target': '1440p @ 60 / 1080p @ 144'},
    {'name': 'Epic',      'color': '#a335ee', 'target': '1440p @ 144 / 4K @ 60'},
    {'name': 'Legendary', 'color': '#ff8000', 'target': '4K @ 120'},
    {'name': 'Mythic',    'color': '#ff4a4a', 'target': '4K @ 144+'},
]

# Performance targets = user's monitor resolution × framerate.
# resolution: '1080p' | '1440p' | '4k'
# fps: target framerate the CPU must sustain
# gpu_tier: tier the GPU must reach (full resolution+framerate workload)
# tier: overall tier for the target line on the bar chart
# short_label: concrete res @ fps used in UI headlines
TARGETS = [
    {'id': '1080p30',  'label': '1080p @ 30Hz (bare playability)',
     'resolution': '1080p', 'fps': 30,  'gpu_tier': 0, 'tier': 0,
     'short_label': '1080p @ 30'},
    {'id': '1080p60',  'label': '1080p @ 60Hz',
     'resolution': '1080p', 'fps': 60,  'gpu_tier': 1, 'tier': 1,
     'short_label': '1080p @ 60'},
    {'id': '1440p60',  'label': '1440p @ 60Hz',
     'resolution': '1440p', 'fps': 60,  'gpu_tier': 2, 'tier': 2,
     'short_label': '1440p @ 60'},
    {'id': '1080p144', 'label': '1080p @ 144Hz',
     'resolution': '1080p', 'fps': 144, 'gpu_tier': 2, 'tier': 2,
     'short_label': '1080p @ 144'},
    {'id': '1440p144', 'label': '1440p @ 144Hz',
     'resolution': '1440p', 'fps': 144, 'gpu_tier': 3, 'tier': 3,
     'short_label': '1440p @ 144'},
    {'id': '4k60',     'label': '4K @ 60Hz',
     'resolution': '4k',    'fps': 60,  'gpu_tier': 3, 'tier': 3,
     'short_label': '4K @ 60'},
    {'id': '4k120',    'label': '4K @ 120Hz',
     'resolution': '4k',    'fps': 120, 'gpu_tier': 4, 'tier': 4,
     'short_label': '4K @ 120'},
    {'id': '4k144',    'label': '4K @ 144Hz+',
     'resolution': '4k',    'fps': 144, 'gpu_tier': 5, 'tier': 5,
     'short_label': '4K @ 144'},
]

RESOLUTIONS = [
    {'id': '1080p', 'label': '1080p (Full HD)'},
    {'id': '1440p', 'label': '1440p (QHD)'},
    {'id': '4k',    'label': '4K (UHD)'},
]

# Framerates available for each resolution — derived from TARGETS so the form
# never offers an uncalibrated combination.
_FPS_BY_RES = {}
for _t in TARGETS:
    _FPS_BY_RES.setdefault(_t['resolution'], []).append(_t['fps'])
FPS_BY_RESOLUTION = {
    res: sorted(set(fps_list)) for res, fps_list in _FPS_BY_RES.items()
}

# sustained_fps: median CPU-side fps across the AAA benchmark basket.
CPUS = [
    {'id': 'r7-9800x3d',  'name': 'AMD Ryzen 7 9800X3D',     'sustained_fps': 260, 'price': 479, 'tdp': 120},
    {'id': 'r9-9950x3d',  'name': 'AMD Ryzen 9 9950X3D',     'sustained_fps': 255, 'price': 699, 'tdp': 170},
    {'id': 'r7-7800x3d',  'name': 'AMD Ryzen 7 7800X3D',     'sustained_fps': 210, 'price': 349, 'tdp': 120},
    {'id': 'cu9-285k',    'name': 'Intel Core Ultra 9 285K', 'sustained_fps': 195, 'price': 589, 'tdp': 250},
    {'id': 'r9-9900x',    'name': 'AMD Ryzen 9 9900X',       'sustained_fps': 185, 'price': 429, 'tdp': 120},
    {'id': 'r7-9700x',    'name': 'AMD Ryzen 7 9700X',       'sustained_fps': 165, 'price': 329, 'tdp': 65},
    {'id': 'cu7-265k',    'name': 'Intel Core Ultra 7 265K', 'sustained_fps': 158, 'price': 399, 'tdp': 250},
    {'id': 'r5-9600x',    'name': 'AMD Ryzen 5 9600X',       'sustained_fps': 150, 'price': 279, 'tdp': 65},
    {'id': 'cu5-245k',    'name': 'Intel Core Ultra 5 245K', 'sustained_fps': 135, 'price': 259, 'tdp': 159},
    {'id': 'r5-7600',     'name': 'AMD Ryzen 5 7600',        'sustained_fps': 128, 'price': 199, 'tdp': 65},
    {'id': 'i5-13400f',   'name': 'Intel Core i5-13400F',    'sustained_fps': 108, 'price': 159, 'tdp': 65},
    {'id': 'r5-5600',     'name': 'AMD Ryzen 5 5600',        'sustained_fps': 92,  'price': 119, 'tdp': 65},
    {'id': 'i3-14100f',   'name': 'Intel Core i3-14100F',    'sustained_fps': 78,  'price': 99,  'tdp': 58},
    {'id': 'r5-5500',     'name': 'AMD Ryzen 5 5500',        'sustained_fps': 72,  'price': 89,  'tdp': 65},
    {'id': 'i3-10100f',   'name': 'Intel Core i3-10100F',    'sustained_fps': 52,  'price': 79,  'tdp': 65},
    {'id': 'r3-3200g',    'name': 'AMD Ryzen 3 3200G',       'sustained_fps': 40,  'price': 69,  'tdp': 65},
]

# tier: human-reviewed raster tier at high settings, native res.
# rad780m is an iGPU baseline for entry-level only.
GPUS = [
    {'id': 'rtx5090',    'name': 'NVIDIA RTX 5090',       'tier': 5, 'vram': 32, 'price': 1999, 'tdp': 575, 'upscaler': 'DLSS'},
    {'id': 'rtx4090',    'name': 'NVIDIA RTX 4090',       'tier': 4, 'vram': 24, 'price': 1499, 'tdp': 450, 'upscaler': 'DLSS'},
    {'id': 'rtx5080',    'name': 'NVIDIA RTX 5080',       'tier': 4, 'vram': 16, 'price': 999,  'tdp': 360, 'upscaler': 'DLSS'},
    {'id': 'rtx5070ti',  'name': 'NVIDIA RTX 5070 Ti',    'tier': 3, 'vram': 16, 'price': 749,  'tdp': 300, 'upscaler': 'DLSS'},
    {'id': 'rx7900xtx',  'name': 'AMD RX 7900 XTX',       'tier': 3, 'vram': 24, 'price': 699,  'tdp': 355, 'upscaler': 'FSR'},
    {'id': 'rx9070xt',   'name': 'AMD RX 9070 XT',        'tier': 3, 'vram': 16, 'price': 649,  'tdp': 304, 'upscaler': 'FSR'},
    {'id': 'rtx4070s',   'name': 'NVIDIA RTX 4070 Super', 'tier': 3, 'vram': 12, 'price': 549,  'tdp': 220, 'upscaler': 'DLSS'},
    {'id': 'rtx5060ti',  'name': 'NVIDIA RTX 5060 Ti',    'tier': 2, 'vram': 16, 'price': 429,  'tdp': 180, 'upscaler': 'DLSS'},
    {'id': 'rx7700xt',   'name': 'AMD RX 7700 XT',        'tier': 2, 'vram': 12, 'price': 399,  'tdp': 245, 'upscaler': 'FSR'},
    {'id': 'rtx4060ti',  'name': 'NVIDIA RTX 4060 Ti',    'tier': 2, 'vram': 8,  'price': 379,  'tdp': 160, 'upscaler': 'DLSS'},
    {'id': 'arcb580',    'name': 'Intel Arc B580',        'tier': 2, 'vram': 12, 'price': 249,  'tdp': 190, 'upscaler': 'XeSS'},
    {'id': 'rtx4060',    'name': 'NVIDIA RTX 4060',       'tier': 1, 'vram': 8,  'price': 289,  'tdp': 115, 'upscaler': 'DLSS'},
    {'id': 'rx7600',     'name': 'AMD RX 7600',           'tier': 1, 'vram': 8,  'price': 259,  'tdp': 165, 'upscaler': 'FSR'},
    {'id': 'arcb570',    'name': 'Intel Arc B570',        'tier': 1, 'vram': 10, 'price': 219,  'tdp': 150, 'upscaler': 'XeSS'},
    {'id': 'gtx1650',    'name': 'NVIDIA GTX 1650',       'tier': 0, 'vram': 4,  'price': 139,  'tdp': 75,  'upscaler': None},
    {'id': 'rad780m',    'name': 'AMD Radeon 780M (iGPU)', 'tier': 0, 'vram': 2, 'price': 0,   'tdp': 15,  'upscaler': 'FSR'},
]

# Adequacy components: tier = highest build tier they support.
# They can only cap a build, never boost it.
RAM = [
    {'id': 'ddr4-8',     'name': '8GB DDR4-2666',   'tier': 1, 'price': 22},
    {'id': 'ddr4-16',    'name': '16GB DDR4-3200',  'tier': 2, 'price': 39},
    {'id': 'ddr4-32',    'name': '32GB DDR4-3600',  'tier': 3, 'price': 69},
    {'id': 'ddr5-32',    'name': '32GB DDR5-6000',  'tier': 4, 'price': 109},
    {'id': 'ddr5-64',    'name': '64GB DDR5-6400',  'tier': 5, 'price': 199},
]

# Storage: load times / DirectStorage note only — not a bottleneck bar.
STORAGE = [
    {'id': 'sata-1tb',   'name': '1TB SATA SSD',      'tier': 1, 'price': 59},
    {'id': 'gen3-1tb',   'name': '1TB NVMe Gen3',     'tier': 2, 'price': 69},
    {'id': 'gen4-2tb',   'name': '2TB NVMe Gen4',     'tier': 3, 'price': 119},
    {'id': 'gen5-2tb',   'name': '2TB NVMe Gen5',     'tier': 4, 'price': 179},
]

PSUS = [
    {'id': 'psu450',   'name': '450W 80+ Bronze',    'watts': 450,  'price': 45},
    {'id': 'psu650',   'name': '650W 80+ Bronze',    'watts': 650,  'price': 69},
    {'id': 'psu750',   'name': '750W 80+ Gold',      'watts': 750,  'price': 99},
    {'id': 'psu850',   'name': '850W 80+ Gold',      'watts': 850,  'price': 129},
    {'id': 'psu1000',  'name': '1000W 80+ Platinum', 'watts': 1000, 'price': 189},
    {'id': 'psu1200',  'name': '1200W 80+ Titanium', 'watts': 1200, 'price': 299},
]


def by_id(items, item_id):
    return next((i for i in items if i['id'] == item_id), None)


def resolve_target(resolution=None, fps=None, target_id=None):
    """Map monitor resolution + framerate (or legacy target id) to a TARGET.

    Returns None if the combination is not in the calibrated matrix.
    """
    if target_id:
        return by_id(TARGETS, target_id)
    if resolution is None or fps is None:
        return None
    try:
        fps = int(fps)
    except (TypeError, ValueError):
        return None
    res = str(resolution).lower().strip()
    if res in ('2160p', 'uhd'):
        res = '4k'
    for t in TARGETS:
        if t['resolution'] == res and t['fps'] == fps:
            return t
    return None
