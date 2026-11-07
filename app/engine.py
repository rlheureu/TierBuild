"""The bottleneck engine.

Each performance component is scored against the user's monitor target
(resolution × framerate), not against other components in the abstract.

- GPUs: full resolution + framerate workload
- CPUs: framerate column only
- RAM: can only cap a build
- PSU insufficiency: safety warning, never a bottleneck bar
- Storage: load-time note only
"""
import math
import os

from app.data import (
    TIERS, TARGETS, CPUS, GPUS, RAM, STORAGE, PSUS,
    by_id, resolve_target,
)

# CPU framerate ladder: sustained fps a CPU of each tier can feed the GPU.
CPU_FPS_ANCHORS = [30, 60, 100, 144, 180, 240]

# Minimum VRAM (GB) current AAA titles want at each GPU workload tier.
VRAM_FLOOR = {0: 2, 1: 6, 2: 10, 3: 12, 4: 16, 5: 20}

NUM_SLOTS = 6  # tier indices 0..5 on the bar scale

# Deterministic tie-break when two components share the same negative delta.
_BOTTLENECK_PRIORITY = {'gpu': 0, 'cpu': 1, 'ram': 2}


def cpu_tier(cpu):
    """A CPU's tier is the highest framerate anchor it sustains."""
    tier = 0
    for i, fps in enumerate(CPU_FPS_ANCHORS):
        if cpu['sustained_fps'] >= fps:
            tier = i
    return tier


def cpu_tier_required(target_fps):
    """Lowest CPU tier whose framerate anchor covers the target framerate."""
    for i, fps in enumerate(CPU_FPS_ANCHORS):
        if fps >= target_fps:
            return i
    return len(CPU_FPS_ANCHORS) - 1


def psu_watts_required(cpu, gpu):
    """Rated wattage needed: component draw plus 50% transient headroom."""
    return math.ceil((cpu['tdp'] + gpu['tdp']) * 1.5 / 50) * 50


def affiliate_url(component, tag=None):
    tag = tag or os.environ.get('AFFILIATE_TAG') or 'tierbuild-20'
    return ('https://www.amazon.com/s?k=' + component['name'].replace(' ', '+')
            + '&tag=' + tag)


def _bar(target, delta):
    """Bar width as % of the 6-slot scale; bar touches the target line when delta == 0."""
    slot = max(0, min(NUM_SLOTS - 1, target['tier'] + delta))
    return round((slot + 1) / NUM_SLOTS * 100, 1)


def _component_row(category, label, part, tier, delta, target, spec, notes=None):
    return {
        'category': category,
        'label': label,
        'name': part['name'],
        'spec': spec,
        'price': part['price'],
        'tier': tier,
        'tier_info': TIERS[tier],
        'delta': delta,
        'bar_pct': _bar(target, delta),
        'notes': notes or [],
    }


def evaluate(cpu_id, gpu_id, target_id=None, resolution=None, fps=None,
             ram_id=None, storage_id=None, psu_id=None, affiliate_tag=None):
    """Run the bottleneck engine. Returns None if required inputs are bad.

    Prefer resolution + fps; target_id is accepted for legacy permalinks.
    """
    cpu = by_id(CPUS, cpu_id)
    gpu = by_id(GPUS, gpu_id)
    target = resolve_target(resolution=resolution, fps=fps, target_id=target_id)
    if not (cpu and gpu and target):
        return None

    rows = []

    # CPU: framerate column only
    c_tier = cpu_tier(cpu)
    c_required = cpu_tier_required(target['fps'])
    c_delta = c_tier - c_required
    rows.append(_component_row(
        'cpu', 'CPU', cpu, c_tier, c_delta, target,
        '~{} fps sustained (median AAA title)'.format(cpu['sustained_fps'])))

    # GPU: full resolution + framerate workload
    g_delta = gpu['tier'] - target['gpu_tier']
    g_notes = []
    if gpu['vram'] < VRAM_FLOOR[target['gpu_tier']]:
        g_notes.append(
            'VRAM-limited at this workload ({}GB where titles want {}GB+)'.format(
                gpu['vram'], VRAM_FLOOR[target['gpu_tier']]))
    if gpu['upscaler'] and gpu['tier'] < NUM_SLOTS - 1:
        g_notes.append('{} native / {} with {} Quality'.format(
            TIERS[gpu['tier']]['name'], TIERS[gpu['tier'] + 1]['name'],
            gpu['upscaler']))
    rows.append(_component_row(
        'gpu', 'GPU', gpu, gpu['tier'], g_delta, target,
        '{}GB VRAM, {}W'.format(gpu['vram'], gpu['tdp']), g_notes))

    # RAM: adequacy only — can cap, never boost
    ram = by_id(RAM, ram_id) if ram_id else None
    if ram:
        r_delta = min(0, ram['tier'] - target['tier'])
        notes = ['Adequate through {} builds'.format(TIERS[ram['tier']]['name'])]
        rows.append(_component_row(
            'ram', 'RAM', ram, ram['tier'], r_delta, target,
            'adequacy-tiered', notes))

    # Storage: note only
    storage = by_id(STORAGE, storage_id) if storage_id else None
    storage_note = None
    if storage and storage['tier'] < target['tier']:
        storage_note = (
            '{} is below {}-tier class, which affects load times and '
            'DirectStorage titles — not framerate.'.format(
                storage['name'], TIERS[target['tier']]['name']))

    # PSU: safety / headroom only
    psu = by_id(PSUS, psu_id) if psu_id else None
    psu_status = None
    watts_needed = psu_watts_required(cpu, gpu)
    if psu:
        if psu['watts'] < watts_needed:
            psu_status = {
                'level': 'danger',
                'text': (
                    '{} is insufficient for this build (~{}W recommended '
                    'for a {}W component draw). This is a safety flag, '
                    'not a bottleneck.').format(
                        psu['name'], watts_needed, cpu['tdp'] + gpu['tdp']),
            }
        elif psu['watts'] >= watts_needed + 250:
            psu_status = {
                'level': 'ok',
                'text': (
                    '{} is oversized — that\'s fine, you have headroom '
                    'for future upgrades.').format(psu['name']),
            }
        else:
            psu_status = {
                'level': 'ok',
                'text': '{} is adequate for this build (~{}W recommended).'.format(
                    psu['name'], watts_needed),
            }

    # Bottleneck: most negative delta; tie-break GPU > CPU > RAM
    candidates = [r for r in rows if r['delta'] < 0]
    if candidates:
        bottleneck = min(
            candidates,
            key=lambda r: (r['delta'], _BOTTLENECK_PRIORITY.get(r['category'], 9)),
        )
    else:
        bottleneck = None

    workload = target['short_label']
    capacity = _capacity_summary(rows, target)
    verdict = _verdict(bottleneck, rows, target, workload)
    recommendation = (
        _recommend(bottleneck, target, affiliate_tag=affiliate_tag)
        if bottleneck else None)
    stretch = (
        _recommend(bottleneck, target, stretch=True, affiliate_tag=affiliate_tag)
        if bottleneck else None)
    if stretch and recommendation and stretch['part']['id'] == recommendation['part']['id']:
        stretch = None

    return {
        'target': target,
        'workload': workload,
        'capacity': capacity,
        'rows': rows,
        'bottleneck': bottleneck,
        'verdict': verdict,
        'recommendation': recommendation,
        'stretch': stretch,
        'psu_status': psu_status,
        'storage_note': storage_note,
        'target_line_pct': round((target['tier'] + 1) / NUM_SLOTS * 100, 1),
    }


def _capacity_summary(rows, target):
    """Plain-language system capacity for the chosen res @ fps."""
    cpu_row = next((r for r in rows if r['category'] == 'cpu'), None)
    gpu_row = next((r for r in rows if r['category'] == 'gpu'), None)
    parts = []
    if gpu_row:
        parts.append(
            'Your GPU is {} ({} class)'.format(
                gpu_row['tier_info']['name'], gpu_row['tier_info']['target']))
    if cpu_row:
        parts.append(
            'your CPU is {} (~{} fps sustained)'.format(
                cpu_row['tier_info']['name'],
                next(c['sustained_fps'] for c in CPUS if c['name'] == cpu_row['name'])))
    if not parts:
        return ''
    return '{} — for {}.'.format('; '.join(parts), target['short_label'])


def _verdict(bottleneck, rows, target, workload):
    if not bottleneck:
        headroom = min(
            r['delta'] for r in rows if r['category'] in ('cpu', 'gpu'))
        if headroom > 0:
            return (
                'Balanced build with headroom — for {} your monitor is '
                'now the bottleneck. Time for a nicer panel?'.format(workload))
        return (
            'Balanced build for {}. Every component is pulling its weight '
            '— no gray drops in this loot table.'.format(workload))

    others = [
        r for r in rows
        if r['category'] in ('cpu', 'gpu') and r is not bottleneck
    ]
    text = 'Your {} is your bottleneck for {}.'.format(
        bottleneck['label'], workload)
    if others:
        best_other = max(others, key=lambda r: r['delta'])
        gap = best_other['delta'] - bottleneck['delta']
        if gap >= 2:
            text += (
                ' You\'re leaving roughly {} tiers of {} performance '
                'on the table.'.format(gap, best_other['label']))
        elif gap == 1:
            text += (
                ' You\'re leaving roughly one tier of {} performance '
                'on the table.'.format(best_other['label']))
    return text


def _recommend(bottleneck, target, stretch=False, affiliate_tag=None):
    """Cheapest single swap that brings the build to target.
    Recommendation logic is deterministic from tier math — affiliate never ranks.
    """
    bump = 1 if stretch else 0
    if bottleneck['category'] == 'cpu':
        required = min(NUM_SLOTS - 1, cpu_tier_required(target['fps']) + bump)
        pool = [c for c in CPUS if cpu_tier(c) >= required]
    elif bottleneck['category'] == 'gpu':
        required = min(NUM_SLOTS - 1, target['gpu_tier'] + bump)
        pool = [
            g for g in GPUS
            if g['tier'] >= required and g['vram'] >= VRAM_FLOOR[required]
        ]
    else:  # ram
        required = min(NUM_SLOTS - 1, target['tier'] + bump)
        pool = [r for r in RAM if r['tier'] >= required]
    if not pool:
        return None
    pick = min(pool, key=lambda p: p['price'])
    return {
        'part': pick,
        'category': bottleneck['category'],
        'tier': TIERS[required],
        'url': affiliate_url(pick, tag=affiliate_tag),
        'stretch': stretch,
    }
