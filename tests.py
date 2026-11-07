import unittest

from app import create_app, engine
from app.data import resolve_target, FPS_BY_RESOLUTION


class ResolveTargetTests(unittest.TestCase):
    def test_res_fps_matches_legacy_id(self):
        by_pair = resolve_target(resolution='1440p', fps=144)
        by_id = resolve_target(target_id='1440p144')
        self.assertIsNotNone(by_pair)
        self.assertEqual(by_pair['id'], by_id['id'])
        self.assertEqual(by_pair['short_label'], '1440p @ 144')

    def test_4k_alias(self):
        t = resolve_target(resolution='uhd', fps=60)
        self.assertIsNotNone(t)
        self.assertEqual(t['id'], '4k60')

    def test_invalid_pair_returns_none(self):
        self.assertIsNone(resolve_target(resolution='1440p', fps=30))
        self.assertIsNone(resolve_target(resolution='1080p', fps=999))

    def test_fps_matrix_covers_all_targets(self):
        self.assertEqual(FPS_BY_RESOLUTION['1080p'], [30, 60, 144])
        self.assertEqual(FPS_BY_RESOLUTION['1440p'], [60, 144])
        self.assertEqual(FPS_BY_RESOLUTION['4k'], [60, 120, 144])


class EngineTests(unittest.TestCase):
    """Rare CPU + Legendary GPU is a bottleneck at 1440p@144 but balanced at 4K@60."""

    def test_rare_cpu_bottlenecks_1440p144_via_res_fps(self):
        result = engine.evaluate('i5-13400f', 'rtx4090', resolution='1440p', fps=144)
        self.assertIsNotNone(result['bottleneck'])
        self.assertEqual(result['bottleneck']['category'], 'cpu')
        self.assertEqual(result['workload'], '1440p @ 144')
        self.assertIsNotNone(result['recommendation'])
        self.assertEqual(result['recommendation']['category'], 'cpu')
        self.assertIn('1440p @ 144', result['verdict'])

    def test_same_build_balanced_at_4k60(self):
        result = engine.evaluate('i5-13400f', 'rtx4090', resolution='4k', fps=60)
        self.assertIsNone(result['bottleneck'])
        self.assertEqual(result['workload'], '4K @ 60')
        self.assertIn('monitor', result['verdict'])

    def test_legacy_target_id_still_works(self):
        result = engine.evaluate('i5-13400f', 'rtx4090', target_id='1440p144')
        self.assertEqual(result['bottleneck']['category'], 'cpu')

    def test_gpu_bottleneck_recommends_cheapest_adequate_gpu(self):
        result = engine.evaluate('r7-9800x3d', 'rtx4060', resolution='1440p', fps=144)
        self.assertEqual(result['bottleneck']['category'], 'gpu')
        rec = result['recommendation']['part']
        self.assertGreaterEqual(rec['tier'], 3)
        cheaper = [
            g for g in engine.GPUS
            if g['tier'] >= 3 and g['vram'] >= engine.VRAM_FLOOR[3]
            and g['price'] < rec['price']
        ]
        self.assertEqual(cheaper, [])

    def test_ram_caps_build(self):
        result = engine.evaluate(
            'r7-9800x3d', 'rtx5090', resolution='4k', fps=144, ram_id='ddr4-16')
        self.assertEqual(result['bottleneck']['category'], 'ram')

    def test_insufficient_psu_is_safety_flag_not_bottleneck(self):
        result = engine.evaluate(
            'r7-9800x3d', 'rtx5090', resolution='4k', fps=144, psu_id='psu450')
        self.assertEqual(result['psu_status']['level'], 'danger')
        # Without RAM/CPU/GPU below target, no performance bottleneck from PSU
        # (5090 is mythic for 4k144 — actually 5090 is tier 5, target is tier 5)
        # CPU and GPU should meet target; only PSU is a safety flag
        self.assertIsNone(result['bottleneck'])

    def test_vram_warning_on_8gb_card_at_1440p(self):
        result = engine.evaluate('r5-7600', 'rtx4060ti', resolution='1440p', fps=60)
        gpu_row = next(r for r in result['rows'] if r['category'] == 'gpu')
        self.assertTrue(any('VRAM-limited' in n for n in gpu_row['notes']))

    def test_invalid_input_returns_none(self):
        self.assertIsNone(
            engine.evaluate('nope', 'rtx4090', resolution='4k', fps=60))
        self.assertIsNone(
            engine.evaluate('r5-7600', 'rtx4090', resolution='1440p', fps=30))

    def test_capacity_summary_mentions_res_fps(self):
        result = engine.evaluate('i5-13400f', 'rtx4090', resolution='1440p', fps=144)
        self.assertIn('1440p @ 144', result['capacity'])
        self.assertIn('CPU', result['capacity'])
        self.assertIn('GPU', result['capacity'])

    def test_storage_note_when_under_tier(self):
        result = engine.evaluate(
            'r7-9800x3d', 'rtx5090', resolution='4k', fps=144,
            storage_id='sata-1tb')
        self.assertIsNotNone(result['storage_note'])
        self.assertIn('SATA', result['storage_note'])


class RouteTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def test_index(self):
        resp = self.client.get('/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"What's holding your PC back?", resp.data)
        self.assertIn(b'name="res"', resp.data)
        self.assertIn(b'name="fps"', resp.data)

    def test_build_permalink_res_fps(self):
        resp = self.client.get(
            '/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'bottleneck', resp.data)
        self.assertIn(b'1440p @ 144', resp.data)
        self.assertIn(b'Display demand', resp.data)

    def test_build_legacy_target_param(self):
        resp = self.client.get(
            '/build?cpu=i5-13400f&gpu=rtx4090&target=1440p144')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'1440p @ 144', resp.data)

    def test_build_bad_params_redirects_home(self):
        resp = self.client.get('/build?cpu=bogus&gpu=rtx4090&res=1440p&fps=144')
        self.assertEqual(resp.status_code, 302)

    def test_build_invalid_res_fps_redirects(self):
        resp = self.client.get(
            '/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=30')
        self.assertEqual(resp.status_code, 302)

    def test_methodology(self):
        resp = self.client.get('/methodology')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'Resolution loads the GPU', resp.data)


if __name__ == '__main__':
    unittest.main()
