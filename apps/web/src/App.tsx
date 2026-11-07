import { Link, Outlet, Route, Routes } from 'react-router';
import { BuildPending } from './pages/BuildPending';
import { Home } from './pages/Home';
import { Methodology } from './pages/Methodology';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="methodology" element={<Methodology />} />
        <Route path="build" element={<BuildPending />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <>
      <nav className="nav">
        <Link className="brand" to="/">
          <span className="brand-tier">Tier</span>
          <span className="brand-build">Build</span>
        </Link>
        <div className="nav-links">
          <Link to="/methodology">Methodology</Link>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          Tiers calibrated against the median of a rotating basket of demanding AAA titles, high
          settings, native resolution, no upscaling. Sample data for demo purposes.
        </p>
        <p>
          <strong>Resolution loads the GPU; framerate loads the CPU.</strong> Recommendation logic
          is deterministic from tier math. Affiliate links are illustrative.
        </p>
      </footer>
    </>
  );
}
