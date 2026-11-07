import { Link } from 'react-router';
import { usePageTitle } from '../api';

// Placeholder until the result page is ported.
export function BuildPending() {
  usePageTitle('TierBuild');
  return (
    <>
      <section className="hero small">
        <h1>Build check</h1>
        <p className="sub">The result page is coming in the next update.</p>
      </section>
      <p className="back">
        <Link to="/">← Check another build</Link>
      </p>
    </>
  );
}
