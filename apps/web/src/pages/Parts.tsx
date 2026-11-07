import { Link, useSearchParams } from 'react-router';
import { TIERS, type CatalogResponse } from '@tierbuild/shared';
import { partPath, useCatalog, usePageTitle } from '../api';

type Tiered = { id: string; name: string; tier: number; spec: string };

export function Parts() {
  const [searchParams] = useSearchParams();
  const tierParam = searchParams.get('tier')?.toLowerCase();
  const found = TIERS.findIndex((t) => t.name.toLowerCase() === tierParam);
  // An unknown ?tier= value shows every tier.
  const onlyTier = found >= 0 ? found : null;
  const tierLabel = onlyTier === null ? null : TIERS[onlyTier]!.name;

  usePageTitle(tierLabel ? `${tierLabel} parts — TierBuild` : 'Parts — TierBuild');
  const state = useCatalog();

  return (
    <>
      <section className="hero small">
        {onlyTier === null ? (
          <>
            <h1>Parts</h1>
            <p className="sub">
              Every CPU and GPU TierBuild rates, grouped by tier. Pick one to see why it earned its
              tier and where you'll find it.
            </p>
          </>
        ) : (
          <>
            <h1>
              <span className={`tier-text-${onlyTier}`}>{tierLabel}</span> parts
            </h1>
            <p className="sub">
              {TIERS[onlyTier]!.target} class. <Link to="/parts">Show all tiers</Link>
            </p>
          </>
        )}
      </section>

      {state.status === 'loading' && <p className="fine">Loading parts…</p>}
      {state.status === 'error' && (
        <p className="fine">Couldn't load the parts list. Check that the server is running.</p>
      )}
      {state.status === 'ready' && <PartGroups catalog={state.catalog} onlyTier={onlyTier} />}
    </>
  );
}

function PartGroups({ catalog, onlyTier }: { catalog: CatalogResponse; onlyTier: number | null }) {
  const gpus: Tiered[] = catalog.gpus.map((g) => ({
    id: g.id,
    name: g.name,
    tier: g.tier,
    spec: `${g.vram}GB VRAM · ${g.tdp}W`,
  }));
  const cpus: Tiered[] = catalog.cpus.map((c) => ({
    id: c.id,
    name: c.name,
    tier: c.tier,
    spec: `~${c.sustainedFps} fps sustained`,
  }));

  return (
    <>
      <TierGroups title="GPUs" category="gpu" parts={gpus} onlyTier={onlyTier} />
      <TierGroups title="CPUs" category="cpu" parts={cpus} onlyTier={onlyTier} />
    </>
  );
}

function TierGroups(props: {
  title: string;
  category: 'cpu' | 'gpu';
  parts: Tiered[];
  onlyTier: number | null;
}) {
  const tiers = TIERS.map((info, tier) => ({
    info,
    tier,
    parts: props.parts.filter((p) => p.tier === tier),
  }))
    .filter((group) => group.parts.length > 0)
    .filter((group) => props.onlyTier === null || group.tier === props.onlyTier)
    .reverse();

  if (tiers.length === 0) return null;

  return (
    <section className="part-groups">
      <h2>{props.title}</h2>
      {tiers.map(({ info, tier, parts }) => (
        <div key={info.name} className="tier-group">
          <h3 className={`tier-text-${tier}`}>{info.name}</h3>
          <div className="loot-cards">
            {parts.map((p) => (
              <Link
                key={p.id}
                to={partPath(props.category, p.id)}
                className={`loot-card part-card tier-border-${tier}`}
              >
                <p className="loot-name">{p.name}</p>
                <p className="loot-spec">{p.spec}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
