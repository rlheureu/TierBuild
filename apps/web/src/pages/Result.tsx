import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { TIERS, type BuildResult, type ComponentRow, type TierInfo } from '@tierbuild/shared';
import { usePageTitle } from '../api';

type BuildState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'error' }
  | { status: 'ready'; result: BuildResult };

// Each answer remembers which query it was for, so a new query reads as loading.
function useBuild(search: string): BuildState {
  const [answer, setAnswer] = useState<{ search: string; state: BuildState } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const settle = (state: BuildState) => {
      if (!cancelled) setAnswer({ search, state });
    };
    fetch(`/api/build${search}`)
      .then(async (res) => {
        if (res.status === 400) {
          settle({ status: 'invalid' });
        } else if (!res.ok) {
          settle({ status: 'error' });
        } else {
          settle({ status: 'ready', result: (await res.json()) as BuildResult });
        }
      })
      .catch(() => settle({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [search]);

  return answer?.search === search ? answer.state : { status: 'loading' };
}

export function Result() {
  const { search } = useLocation();
  const state = useBuild(search);

  if (state.status === 'invalid') {
    // Same as the Flask app: a bad or outdated link goes back to the form.
    return <Navigate to="/" replace />;
  }
  if (state.status === 'loading') {
    return <p className="fine">Checking your build…</p>;
  }
  if (state.status === 'error') {
    return (
      <>
        <p className="fine">Couldn't check this build. Check that the server is running.</p>
        <BackLink />
      </>
    );
  }
  return <ResultView result={state.result} />;
}

function tierIndex(tier: TierInfo): number {
  return TIERS.findIndex((t) => t.name === tier.name);
}

// The API returns copies, so compare rows by category rather than identity.
function isBottleneck(result: BuildResult, row: ComponentRow): boolean {
  return result.bottleneck?.category === row.category;
}

function ResultView({ result }: { result: BuildResult }) {
  const { bottleneck, workload, target, recommendation, stretch } = result;
  usePageTitle(
    bottleneck
      ? `${bottleneck.label} bottleneck at ${workload} — TierBuild`
      : `Balanced at ${workload} — TierBuild`,
  );
  const status = bottleneck ? 'has-bottleneck' : 'balanced';
  const targetTier = TIERS[target.tier]!;

  return (
    <>
      <section className="hero small">
        <h1>
          Build check: <span className={`tier-text-${target.tier}`}>{workload}</span>
        </h1>
        <p className="sub capacity">{result.capacity}</p>
      </section>

      <div className={`sticky-summary ${status}`}>
        <span className="sticky-workload">{workload}</span>
        <span className="sticky-verdict">
          {bottleneck ? `${bottleneck.label} bottleneck` : 'Balanced'}
        </span>
      </div>

      <section className="card tier-bar-card">
        <div className="tier-bars">
          {result.rows.map((row) => (
            <div className="bar-row" key={row.category}>
              <div className="bar-label">
                <span className="bar-cat">{row.label}</span>
                <span className="bar-part">{row.name}</span>
              </div>
              <div className="bar-track">
                <div
                  className={`bar-fill${isBottleneck(result, row) ? ' bottleneck' : ''}`}
                  style={{ width: `${row.barPct}%`, background: row.tierInfo.color }}
                >
                  <span className="bar-tier-label">{row.tierInfo.name}</span>
                </div>
                <div
                  className="target-line"
                  style={{ left: `${result.targetLinePct}%` }}
                  title={`Target: ${workload}`}
                />
              </div>
            </div>
          ))}
          <div className="target-caption" style={{ paddingLeft: '180px' }}>
            <span
              className="target-flag"
              style={{ marginLeft: `calc(${result.targetLinePct}% - 40px)` }}
            >
              ▲ target: {workload}
            </span>
          </div>
        </div>
      </section>

      <section className={`verdict card ${status}`}>
        <h2>{bottleneck ? '⚠ Bottleneck found' : '✔ Nicely balanced'}</h2>
        <p>{result.verdict}</p>
        {result.psuStatus && (
          <p className={`psu-${result.psuStatus.level}`}>{result.psuStatus.text}</p>
        )}
        {result.storageNote && <p className="fine">{result.storageNote}</p>}
      </section>

      {recommendation && (
        <section className="card reco">
          <h2>Highest-impact upgrade</h2>
          <div className="reco-row">
            <div>
              <p className={`reco-part tier-text-${tierIndex(recommendation.tier)}`}>
                {recommendation.part.name}
              </p>
              <p className="reco-why">
                The cheapest single swap that brings this build to <strong>{workload}</strong> —
                approximately <strong>${recommendation.part.price}</strong>.
              </p>
            </div>
            <a
              className="cta affiliate"
              href={recommendation.url}
              target="_blank"
              rel="noopener sponsored"
            >
              See price — ${recommendation.part.price}
            </a>
          </div>
          {stretch && (
            <p className="stretch">
              Stretch pick, one tier higher: <strong>{stretch.part.name}</strong> (~$
              {stretch.part.price}) —{' '}
              <a href={stretch.url} target="_blank" rel="noopener sponsored">
                see price
              </a>
              .
            </p>
          )}
        </section>
      )}

      <section className="loot-cards">
        <div className={`loot-card demand-card tier-border-${target.tier}`}>
          <div className="loot-head">
            <span className="loot-cat">Display demand</span>
            <span className="tier-pill" style={{ background: targetTier.color }}>
              {targetTier.name}
            </span>
          </div>
          <p className="loot-name">{workload}</p>
          <p className="loot-spec">Resolution + framerate target · {target.fps} Hz panel</p>
          <p className="loot-target">Resolution loads GPU · framerate loads CPU</p>
        </div>

        {result.rows.map((row) => (
          <div
            key={row.category}
            className={`loot-card tier-border-${row.tier}${isBottleneck(result, row) ? ' is-bottleneck' : ''}`}
          >
            <div className="loot-head">
              <span className="loot-cat">{row.label}</span>
              <span className="tier-pill" style={{ background: row.tierInfo.color }}>
                {row.tierInfo.name}
              </span>
            </div>
            <p className="loot-name">{row.name}</p>
            <p className="loot-spec">{row.spec}</p>
            <p className="loot-target">Tier target: {row.tierInfo.target}</p>
            {row.notes.map((note) => (
              <p className="loot-note" key={note}>
                {note}
              </p>
            ))}
          </div>
        ))}
      </section>

      <ShareCard workload={workload} />
      <BackLink />
    </>
  );
}

function ShareCard({ workload }: { workload: string }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  return (
    <section className="share card">
      <h2>Share this result</h2>
      <div className="share-row">
        <input id="permalink" type="text" readOnly value={url} aria-label="Link to this result" />
        <button
          className="cta secondary"
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(() => setCopied(true));
          }}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      <p className="fine">
        Helping a friend on Reddit or Discord? Send them this link — the tier bar and {workload}{' '}
        target explain themselves.
      </p>
    </section>
  );
}

function BackLink() {
  return (
    <p className="back">
      <Link to="/">← Check another build</Link>
    </p>
  );
}
