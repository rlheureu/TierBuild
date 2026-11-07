import json

from flask import (
    Blueprint, current_app, render_template, request, redirect, url_for,
)

from app import engine
from app.data import (
    TIERS, TARGETS, CPUS, GPUS, RAM, STORAGE, PSUS,
    RESOLUTIONS, FPS_BY_RESOLUTION, resolve_target,
)

bp = Blueprint('main', __name__)


def _catalog():
    return {
        'tiers': TIERS,
        'targets': TARGETS,
        'resolutions': RESOLUTIONS,
        'fps_by_resolution': FPS_BY_RESOLUTION,
        'fps_by_resolution_json': json.dumps(FPS_BY_RESOLUTION),
        'cpus': sorted(CPUS, key=lambda c: -c['sustained_fps']),
        'gpus': sorted(GPUS, key=lambda g: (-g['tier'], -g['price'])),
        'ram': RAM,
        'storage': STORAGE,
        'psus': PSUS,
        'cpu_tier': engine.cpu_tier,
    }


@bp.route('/')
def index():
    return render_template('index.html', **_catalog())


@bp.route('/build')
def build():
    res = request.args.get('res')
    fps = request.args.get('fps')
    target_id = request.args.get('target')  # legacy permalinks

    # Prefer res + fps; fall back to legacy target=
    if not res and not fps and target_id:
        legacy = resolve_target(target_id=target_id)
        if legacy:
            res = legacy['resolution']
            fps = legacy['fps']

    result = engine.evaluate(
        cpu_id=request.args.get('cpu'),
        gpu_id=request.args.get('gpu'),
        resolution=res,
        fps=fps,
        target_id=target_id if not res else None,
        ram_id=request.args.get('ram') or None,
        storage_id=request.args.get('storage') or None,
        psu_id=request.args.get('psu') or None,
        affiliate_tag=current_app.config.get('AFFILIATE_TAG'),
    )
    if result is None:
        return redirect(url_for('main.index'))

    # Share meta title
    if result['bottleneck']:
        page_title = '{} bottleneck at {} — TierBuild'.format(
            result['bottleneck']['label'], result['workload'])
    else:
        page_title = 'Balanced at {} — TierBuild'.format(result['workload'])

    return render_template(
        'result.html',
        result=result,
        page_title=page_title,
        **_catalog(),
    )


@bp.route('/methodology')
def methodology():
    return render_template('methodology.html', **_catalog())
