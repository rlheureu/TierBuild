import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { CatalogResponse, Resolution } from '@tierbuild/shared';
import { partPath, useCatalog, usePageTitle } from '../api';

// Opens in a new tab so a half-filled form isn't lost.
function AboutPartLink({ category, id }: { category: 'cpu' | 'gpu'; id: string }) {
  if (!id) return null;
  return (
    <a className="field-link" href={partPath(category, id)} target="_blank" rel="noopener">
      About this {category.toUpperCase()} ↗
    </a>
  );
}

export function Home() {
  usePageTitle('TierBuild');
  const state = useCatalog();

  return (
    <>
      <section className="hero">
        <h1>What's holding your PC back?</h1>
        <p className="sub">
          Every component gets a loot-rarity tier tied to real performance. Pick your parts, then
          your monitor's <strong>resolution</strong> and <strong>framerate</strong> — we'll show you
          the bottleneck.
        </p>
      </section>

      {state.status === 'loading' && <p className="fine">Loading parts…</p>}
      {state.status === 'error' && (
        <p className="fine">Couldn't load the parts list. Check that the server is running.</p>
      )}
      {state.status === 'ready' && <BuildForm catalog={state.catalog} />}

      <section className="how-to card">
        <h2>How to read a result</h2>
        <ol>
          <li>
            <strong>Bars</strong> show each part's loot tier. The white line is your{' '}
            <strong>resolution @ framerate</strong> target.
          </li>
          <li>
            The shortest bar below the line is the <strong>bottleneck</strong>.
          </li>
          <li>
            <strong>Loot cards</strong> color-code every piece — including display demand.
          </li>
          <li>
            We recommend the <strong>cheapest single swap</strong> that hits your panel.
          </li>
        </ol>
      </section>

      {state.status === 'ready' && <TierLegend tiers={state.catalog.tiers} />}
    </>
  );
}

function BuildForm({ catalog }: { catalog: CatalogResponse }) {
  const navigate = useNavigate();
  const [cpu, setCpu] = useState('');
  const [gpu, setGpu] = useState('');
  const [res, setRes] = useState('');
  const [fps, setFps] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [psu, setPsu] = useState('');

  const fpsOptions = res ? (catalog.fpsByResolution[res as Resolution] ?? []) : [];

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ cpu, gpu, res, fps });
    if (ram) params.set('ram', ram);
    if (storage) params.set('storage', storage);
    if (psu) params.set('psu', psu);
    navigate(`/build?${params}`);
  }

  return (
    <form className="build-form card" onSubmit={onSubmit}>
      <div className="form-grid">
        <div>
          <label>
            <span className="field-label">
              CPU <em>required</em>
            </span>
            <select name="cpu" required value={cpu} onChange={(e) => setCpu(e.target.value)}>
              <option value="" disabled>
                Select your CPU…
              </option>
              {catalog.cpus.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {catalog.tiers[c.tier]?.name} (${c.price})
                </option>
              ))}
            </select>
          </label>
          <AboutPartLink category="cpu" id={cpu} />
        </div>
        <div>
          <label>
            <span className="field-label">
              GPU <em>required</em>
            </span>
            <select name="gpu" required value={gpu} onChange={(e) => setGpu(e.target.value)}>
              <option value="" disabled>
                Select your GPU…
              </option>
              {catalog.gpus.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {catalog.tiers[g.tier]?.name} (${g.price})
                </option>
              ))}
            </select>
          </label>
          <AboutPartLink category="gpu" id={gpu} />
        </div>
      </div>

      <fieldset className="monitor-fields">
        <legend>
          Your monitor <em>the performance target</em>
        </legend>
        <div className="form-grid">
          <label>
            <span className="field-label">
              Resolution <em>required</em>
            </span>
            <select
              name="res"
              required
              value={res}
              onChange={(e) => {
                setRes(e.target.value);
                setFps('');
              }}
            >
              <option value="" disabled>
                Select resolution…
              </option>
              {catalog.resolutions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">
              Framerate <em>required</em>
            </span>
            <select
              name="fps"
              required
              disabled={fpsOptions.length === 0}
              value={fps}
              onChange={(e) => setFps(e.target.value)}
            >
              <option value="" disabled>
                {res ? 'Select framerate…' : 'Pick resolution first…'}
              </option>
              {fpsOptions.map((f) => (
                <option key={f} value={String(f)}>
                  {f} Hz / fps
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="field-hint">
          Resolution drives GPU demand; framerate drives CPU demand. Only calibrated res × fps pairs
          are listed.
        </p>
      </fieldset>

      <details className="optional">
        <summary>Full build (optional — RAM, storage, PSU adequacy checks)</summary>
        <div className="form-grid">
          <OptionalSelect
            label="RAM"
            name="ram"
            parts={catalog.ram}
            value={ram}
            onChange={setRam}
          />
          <OptionalSelect
            label="Storage"
            name="storage"
            parts={catalog.storage}
            value={storage}
            onChange={setStorage}
          />
          <OptionalSelect
            label="Power supply"
            name="psu"
            parts={catalog.psus}
            value={psu}
            onChange={setPsu}
          />
        </div>
      </details>

      <button className="cta" type="submit">
        Check my build
      </button>
    </form>
  );
}

function OptionalSelect(props: {
  label: string;
  name: string;
  parts: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="field-label">{props.label}</span>
      <select
        name={props.name}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        <option value="">Skip (assume adequate)</option>
        {props.parts.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function TierLegend({ tiers }: { tiers: CatalogResponse['tiers'] }) {
  return (
    <section className="tier-legend">
      <h2>The tier ladder</h2>
      <div className="legend-grid">
        {tiers.map((t, i) => (
          <Link
            key={t.name}
            to={`/parts?tier=${t.name.toLowerCase()}`}
            className={`legend-card tier-border-${i}`}
          >
            <span className={`tier-name tier-text-${i}`}>{t.name}</span>
            <span className="tier-target">{t.target}</span>
          </Link>
        ))}
      </div>
      <p className="fine">
        High settings, native resolution, median of the current AAA basket. CPUs are tiered on the
        framerate column only — a Rare CPU next to a Legendary GPU is only a mismatch if{' '}
        <strong>your monitor's framerate</strong> says it is.
      </p>
      <p className="fine">
        <Link to="/parts">Browse all parts →</Link>
      </p>
    </section>
  );
}
