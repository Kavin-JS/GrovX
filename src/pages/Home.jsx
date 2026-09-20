import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AmplitudeChart from '../components/AmplitudeChart.jsx';
import { runGrover, optimalIterations } from '../quantum/grover.js';
import { fmt } from '../utils/format.js';

function MiniDemo() {
  const n = 5, target = 19;
  const { history, ko } = useMemo(() => {
    const ko = optimalIterations(1 << n, 1);
    return { ko, history: runGrover({ n, targets: [target], maxIterations: ko }).history };
  }, []);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [k, setK] = useState(reduced ? ko : 0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setK((x) => (x >= ko + 2 ? 0 : x + 1)), 900);
    return () => clearInterval(id);
  }, [ko, reduced]);

  const shown = Math.min(k, ko);
  return (
    <div className="card">
      <div className="label">Grover on 32 items · iteration {shown} of {ko}</div>
      <AmplitudeChart amps={history[shown].amps} targets={[target]} height={230} />
      <p className="caption">
        Amplitude of each of the 32 items. The secret item (red) gains amplitude with every iteration while the rest shrink.
        Probability of measuring it: <b>{(history[shown].p * 100).toFixed(1)}%</b>.
      </p>
    </div>
  );
}

const contents = [
  ['/algorithm', 'Algorithm', 'Oracle, diffusion, the rotation picture, the circuit, and the complexity argument.'],
  ['/lab', 'Lab', 'Classical and Grover search side by side on a search space of your choice.'],
  ['/benchmarks', 'Benchmarks', 'Measured queries and time over N = 2ⁿ, validation against theory, CSV export.'],
  ['/resources', 'Resources', 'Qubits, gate counts, noise, run time, and the classical/quantum crossover.'],
  ['/evaluation', 'Evaluation', 'Findings, limitations, application to key search, conclusion and references.'],
];

export default function Home() {
  return (
    <>
      <header className="page-head" style={{ maxWidth: 'none' }}>
        <div className="kicker">Quantum computing · Grover's search algorithm</div>
        <h1>Quantum Search Lab</h1>
        <p className="standfirst">
          An implementation and evaluation of Grover's algorithm against classical linear search, on queries, run time, qubits, gates and noise.
        </p>
      </header>

      <div className="two-col">
        <div>
          <div className="label">Abstract</div>
          <p>
            Unstructured search asks for one marked item among N = 2<sup>n</sup> candidates when the only tool is a
            yes/no check. Classically that takes about N/2 checks. Grover's algorithm needs about 0.785·√N.
          </p>
          <p>
            This site implements the algorithm as an explicit gate-level circuit on a state-vector simulator, verifies it against
            theory, benchmarks it against linear search, and estimates what a real machine would need in qubits, gates and error rates.
          </p>
          <p>
            The quadratic query advantage is real and provably optimal, but it is not yet a practical advantage: circuit depth and
            noise dominate.
          </p>
          <div className="actions">
            <Link className="btn" to="/lab">Open the lab</Link>
            <Link className="btn ghost" to="/benchmarks">View the results</Link>
          </div>
        </div>
        <MiniDemo />
      </div>

      <section className="block">
        <h2>The problem</h2>
        <div className="grid-2">
          <div className="card">
            <h3>Application</h3>
            <p>
              A device accepts an n-bit code and answers only "correct" or "wrong". Equivalently, a table holds N unsorted records and
              the only operation is "does record x match?". With no structure to exploit this is unstructured search, and recovering a
              secret key from a yes/no check has the same shape.
            </p>
          </div>
          <div className="card">
            <h3>Question</h3>
            <p>
              How many queries, qubits and gates does Grover's algorithm need compared with the classical solution, how much noise
              can it tolerate, and does it give a practical advantage today or only in theory?
            </p>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>Result at a glance</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Qubits n</th><th>Items N = 2ⁿ</th><th>Classical queries (average)</th><th>Grover iterations</th><th>Reduction</th></tr>
            </thead>
            <tbody>
              {[10, 20, 30, 40].map((n) => {
                const N = Math.pow(2, n), k = optimalIterations(N, 1);
                return (
                  <tr key={n}>
                    <td>{n}</td><td>{fmt(N)}</td><td>{fmt((N + 1) / 2)}</td><td>{fmt(k)}</td><td>{fmt((N + 1) / 2 / k)}×</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="caption">
          A quadratic reduction in oracle queries, from O(N) to O(√N). It is not exponential, and by itself it does not mean a quantum
          computer finishes sooner; see Resources and Evaluation.
        </p>
      </section>

      <section className="block">
        <h2>Contents</h2>
        <ol className="toc">
          {contents.map(([to, t, d], i) => (
            <li key={to}>
              <Link to={to}><span className="n">{String(i + 1).padStart(2, '0')}</span><span className="t">{t}</span><span className="d">{d}</span></Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
