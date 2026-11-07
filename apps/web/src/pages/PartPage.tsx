import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  TIERS,
  type CpuEvidence,
  type GpuEvidence,
  type OemEntry,
  type PartContent,
  type PartPageResponse,
} from '@tierbuild/shared';
import { useApiData, usePageTitle } from '../api';
import { NotFound } from './NotFound';

export function PartPage() {
  const { category = '', id = '' } = useParams();
  const state = useApiData<PartPageResponse>(
    `/api/parts/${encodeURIComponent(category)}/${encodeURIComponent(id)}`,
  );

  if (state.status === 'notFound') return <NotFound />;
  if (state.status === 'loading') return <p className="fine">Loading part…</p>;
  if (state.status === 'error') {
    return (
      <>
        <p className="fine">Couldn't load this part. Check that the server is running.</p>
        <PartLinks />
      </>
    );
  }
  return <PartView page={state.data} />;
}

function tierName(tier: number): string {
  return TIERS[tier]?.name ?? '';
}

function tiersWord(n: number): string {
  return n === 1 ? '1 tier' : `${n} tiers`;
}

function PartView({ page }: { page: PartPageResponse }) {
  const { part, tierInfo, evidence, content } = page;
  const label = page.category.toUpperCase();
  usePageTitle(`${part.name} — ${tierInfo.name} ${label} — TierBuild`);

  const specs =
    page.category === 'cpu'
      ? [`~${page.evidence.sustainedFps} fps sustained`]
      : [
          `${page.evidence.vram}GB VRAM`,
          `${page.evidence.tdp}W`,
          ...(page.evidence.upscaler ? [page.evidence.upscaler] : []),
        ];

  return (
    <>
      <section className="hero small">
        <h1 className={`tier-text-${evidence.tier}`}>{part.name}</h1>
        <p className="sub part-hero-meta">
          <span className="tier-pill" style={{ background: tierInfo.color }}>
            {tierInfo.name}
          </span>
          <span>{[label, ...specs].join(' · ')}</span>
        </p>
      </section>

      <section className="card prose">
        <h2>Why it's {tierInfo.name}</h2>
        {page.category === 'cpu' ? (
          <CpuReasoning name={part.name} evidence={page.evidence} />
        ) : (
          <GpuReasoning name={part.name} evidence={page.evidence} />
        )}
        <p className="fine left">
          Tier inputs come from TierBuild's sample catalog data.{' '}
          <Link to="/methodology">How tiers are earned</Link>
        </p>
      </section>

      <TargetTable page={page} />

      {content ? (
        <ContentSections content={content} category={page.category} />
      ) : (
        <section className="card prose">
          <h2>History and where you'll find it</h2>
          <p>
            Details coming soon: the story of the {part.name},{' '}
            {page.category === 'gpu'
              ? 'the graphics cards, prebuilt desktops'
              : 'the prebuilt desktops'}{' '}
            and laptops that use it, and sources for each.
          </p>
        </section>
      )}

      <PartLinks />
    </>
  );
}

function CpuReasoning({ name, evidence }: { name: string; evidence: CpuEvidence }) {
  const current = evidence.anchors[evidence.tier]!;
  const next = evidence.anchors[evidence.tier + 1];
  return (
    <>
      <p>
        CPUs are tiered on <strong>framerate only</strong>. The {name} sustains about{' '}
        <strong>{evidence.sustainedFps} fps</strong> in the median title of TierBuild's AAA
        benchmark basket.{' '}
        {current.sustained
          ? `That clears the ${current.fps} fps line for ${tierName(current.tier)}`
          : `That's below even the ${current.fps} fps line, so it sits at the bottom of the ladder`}
        {current.sustained &&
          (next
            ? `, but not the ${next.fps} fps needed for ${tierName(next.tier)}.`
            : ', the top of the ladder.')}
      </p>
      <div className="table-scroll">
        <table className="part-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Needs</th>
              <th>This CPU</th>
            </tr>
          </thead>
          <tbody>
            {evidence.anchors.map((a) => (
              <tr key={a.tier}>
                <td className={`tier-text-${a.tier}`}>{tierName(a.tier)}</td>
                <td>{a.fps} fps</td>
                <td className={a.sustained ? 'meets' : 'short'}>
                  {a.sustained ? '✔ Sustains it' : '✗ Below it'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function GpuReasoning({ name, evidence }: { name: string; evidence: GpuEvidence }) {
  const tierTarget = TIERS[evidence.tier]!.target;
  const vramLimited = evidence.targets.some((t) => t.met && !t.vramOk);
  return (
    <>
      <p>
        GPUs are tiered on the <strong>full resolution + framerate workload</strong>. TierBuild
        rates the {name} <strong>{tierName(evidence.tier)}</strong>: it carries{' '}
        <strong>{tierTarget}</strong> at high settings, native resolution, no upscaling.
      </p>
      <p>
        It has <strong>{evidence.vram}GB of VRAM</strong>.{' '}
        {vramLimited
          ? 'That is below what current games want at some workloads its tier covers, so those are flagged below.'
          : 'That is enough for every workload its tier covers.'}
      </p>
      {evidence.upscaledTier !== null && (
        <p>
          With {evidence.upscaler} Quality upscaling it plays like{' '}
          {/^[AEIOU]/.test(tierName(evidence.upscaledTier)) ? 'an' : 'a'}{' '}
          <strong>{tierName(evidence.upscaledTier)}</strong> card. Upscaling is shown separately and
          never changes the base tier.
        </p>
      )}
    </>
  );
}

function TargetTable({ page }: { page: PartPageResponse }) {
  const isGpu = page.category === 'gpu';
  return (
    <section className="card prose">
      <h2>Against each monitor target</h2>
      <p>
        {isGpu
          ? 'Each resolution and framerate needs a GPU of a certain tier, and enough VRAM.'
          : 'Each framerate needs a CPU of a certain tier. Resolution does not change what the CPU needs.'}
      </p>
      <div className="table-scroll">
        <table className="part-table stack-on-phone">
          <thead>
            <tr>
              <th>Monitor</th>
              <th>Needs</th>
              <th>Result</th>
              {isGpu && <th>VRAM</th>}
            </tr>
          </thead>
          <tbody>
            {page.evidence.targets.map((check) => (
              <tr key={check.target.id}>
                <td>{check.target.shortLabel}</td>
                <td className={`tier-text-${check.requiredTier}`} data-label="Needs">
                  {tierName(check.requiredTier)}
                </td>
                <td className={check.met ? 'meets' : 'short'}>
                  {check.met
                    ? check.margin > 0
                      ? `✔ Meets, ${tiersWord(check.margin)} spare`
                      : '✔ Meets'
                    : `✗ Short by ${tiersWord(-check.margin)}`}
                </td>
                {'vramOk' in check && (
                  <td className={check.vramOk ? '' : 'warn'} data-label="VRAM">
                    {check.vramOk ? `OK (${check.vramFloor}GB+)` : `⚠ Wants ${check.vramFloor}GB+`}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ContentSections({ content, category }: { content: PartContent; category: 'cpu' | 'gpu' }) {
  const sourceNumber = (id: string) => content.sources.findIndex((s) => s.id === id) + 1;
  const cite = (ids: string[]) =>
    ids.map((id) => (
      <sup key={id} className="citation">
        <a href={`#source-${id}`}>{sourceNumber(id)}</a>
      </sup>
    ));

  const { boardPartners, prebuilts, laptops } = content.oems;
  const groups = [
    {
      title: category === 'gpu' ? 'Graphics cards from board partners' : 'Board partners',
      entries: boardPartners,
    },
    { title: 'Prebuilt desktops', entries: prebuilts },
  ].filter((g) => g.entries.length > 0);

  return (
    <>
      {content.history.length > 0 && (
        <section className="card prose">
          <h2>History</h2>
          {content.history.map((p, i) => (
            <p key={i}>
              {p.text}
              {cite(p.sourceIds)}
            </p>
          ))}
        </section>
      )}

      <section className="card prose">
        <h2>Where you'll find it</h2>
        <p className="fine left">Examples, as of {content.reviewedOn}. Not a complete list.</p>
        {groups.length === 0 && laptops.length === 0 && <p>None listed yet.</p>}
        {groups.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            <OemList entries={g.entries} cite={cite} />
          </div>
        ))}
        {laptops.length > 0 && (
          <div>
            <h3>Laptops</h3>
            <p className="fine left">
              Laptops marked "mobile version" use the mobile chip of the same name, which performs
              differently from the desktop part TierBuild rates.
            </p>
            <ul>
              {laptops.map((l) => (
                <li key={`${l.name}-${l.sku ?? ''}`}>
                  {l.name}
                  {l.sku && ` — ${l.sku}`}
                  {l.mobileVariant && <span className="tag"> mobile version</span>}
                  {cite([l.sourceId])}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card prose sources">
        <h2>Sources</h2>
        <ol>
          {content.sources.map((s) => (
            <li key={s.id} id={`source-${s.id}`}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>{' '}
              — {s.publisher}, accessed {s.accessed}
            </li>
          ))}
        </ol>
        <p className="fine left">Last reviewed {content.reviewedOn}.</p>
      </section>
    </>
  );
}

function OemList({ entries, cite }: { entries: OemEntry[]; cite: (ids: string[]) => ReactNode }) {
  return (
    <ul>
      {entries.map((e) => (
        <li key={`${e.name}-${e.sku ?? ''}`}>
          {e.name}
          {e.sku && ` — ${e.sku}`}
          {cite([e.sourceId])}
        </li>
      ))}
    </ul>
  );
}

function PartLinks() {
  return (
    <p className="back">
      <Link to="/parts">← All parts</Link> · <Link to="/">Check a build</Link>
    </p>
  );
}
