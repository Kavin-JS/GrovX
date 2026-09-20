import { useEffect } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Algorithm from './pages/Algorithm.jsx';
import Lab from './pages/Lab.jsx';
import Benchmarks from './pages/Benchmarks.jsx';
import Resources from './pages/Resources.jsx';
import Evaluation from './pages/Evaluation.jsx';

const links = [
  ['/', 'Home'],
  ['/algorithm', 'Algorithm'],
  ['/lab', 'Lab'],
  ['/benchmarks', 'Benchmarks'],
  ['/resources', 'Resources'],
  ['/evaluation', 'Evaluation'],
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <header className="site-header">
        <div className="inner">
          <Link to="/" className="brand">Quantum Search Lab</Link>
          <nav className="nav" aria-label="Main">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/algorithm" element={<Algorithm />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/benchmarks" element={<Benchmarks />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="inner">
          Quantum Search Lab: an application-driven implementation and evaluation of Grover's search algorithm.
          All simulations run in your browser; nothing is sent to a server.
        </div>
      </footer>
    </>
  );
}
