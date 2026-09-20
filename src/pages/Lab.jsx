import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceDot, ResponsiveContainer,
} from 'recharts';
import { PageHead, Stat } from '../components/ui.jsx';
import AmplitudeChart from '../components/AmplitudeChart.jsx';
import CircuitDiagram from '../components/CircuitDiagram.jsx';
import { useThemeColors } from '../hooks/useThemeColors.js';
import { runGrover, optimalIterations, theoreticalProbability, targetsFor } from '../quantum/grover.js';
import { sampleAmplitudes } from '../quantum/simulator.js';
import { timedLinearSearch } from '../classical/linearSearch.js';
import { fmt, pct, bin } from '../utils/format.js';

const SCENARIOS = {
  code: {
    name: 'Secret unlock code',
    field: 'Secret code (decimal)',
    story: 'A lock accepts an n-bit code and only says "open" or "denied". The oracle is the lock check f(x).',
    label: (i, n) => bin(i, n),
  },
  record: {
    name: 'Unsorted database record',
    field: 'Record ID to find',
    story: 'A table holds N unsorted records. The only operation is "does record x match the query?", which is the oracle f(x).',
    label: (i) => 'REC-' + String(i).padStart(5, '0'),
  },
};

export default function Lab() {
  const c = useThemeColors();
  const [scenario, setScenario] = useState('code');
  const [n, setN] = useState(6);
  const [M, setM] = useState(1);
  const [t, setT] = useState(37);
  const [shots, setShots] = useState(1024);
  const [result, setResult] = useState(null);
  const [view, setView] = useState(0);
  const [seed, setSeed] = useState(0);
  const [running, setRunning] = useState(false);

  const N = 1 << n;
  const mMax = Math.max(1, Math.min(4, N >> 2));
  const S = SCENARIOS[result?.scenario ?? scenario];

  const run = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const Nn = 1 << n;
      const m = Math.min(M, Math.max(1, Nn >> 2));
      const t0 = Math.min(Math.max(0, Math.floor(t) || 0), Nn - 1);
      const targets = targetsFor(Nn, m, t0);
      const tset = new Set(targets);
      const ko = optimalIterations(Nn, m);
      const maxK = Math.min(2 * ko + 2, 120);
      const classical = timedLinearSearch(Nn, (i) => tset.has(i));
      const grover = runGrover({ n, targets, maxIterations: maxK });
      setResult({ n, N: Nn, M: m, targets, ko, maxK, classical, grover, scenario });
      setView(ko);
      setSeed((s) => s + 1);
      setRunning(false);
    }, 20);
  }, [n, M, t, scenario]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, []);

  const measured = useMemo(() => {
    if (!result) return null;
    const counts = sampleAmplitudes(result.grover.history[view].amps, shots);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const tset = new Set(result.targets);
    let hits = 0;
    for (const [i, cnt] of counts) if (tset.has(i)) hits += cnt;
    return { top, found: top[0][0], hitRate: hits / shots };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, view, shots, seed]);

  const curve = useMemo(() => {
    if (!result) return [];
    return result.grover.history.map((h) => ({
      k: h.k,
      simulated: h.p,
      theory: theoreticalProbability(result.N, result.M, h.k),
    }));
  }, [result]);

  const tip = { background: c.surface, border: `1px solid ${c.line}`, color: c.ink };

  return (
    <>
      <PageHead title="The lab">
        Run classical linear search and Grover's algorithm on the same search problem. Grover's circuit is executed
        gate by gate on a state-vector simulator.
      </PageHead>

      <div className="card">
        <div className="controls">
          <div>
            <label htmlFor="sc">Application</label>
            <select id="sc" value={scenario} onChange={(e) => setScenario(e.target.value)}>
              {Object.entries(SCENARIOS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="n">Qubits n: <output>{n}</output> (N = {N.toLocaleString()})</label>
            <input id="n" type="range" min="2" max="12" value={n}
              onChange={(e) => { const v = +e.target.value; setN(v); setT((x) => Math.min(x, (1 << v) - 1)); setM((m) => Math.min(m, Math.max(1, (1 << v) >> 2))); }} />
          </div>
          <div>
            <label htmlFor="m">Secret items M: <output>{Math.min(M, mMax)}</output></label>
            <input id="m" type="range" min="1" max={mMax} value={Math.min(M, mMax)} onChange={(e) => setM(+e.target.value)} disabled={mMax === 1} />
          </div>
          <div>
            <label htmlFor="t">{SCENARIOS[scenario].field}</label>
            <input id="t" type="number" min="0" max={N - 1} value={t} onChange={(e) => setT(Math.max(0, Math.min(N - 1, +e.target.value || 0)))} />
          </div>
          <div>
            <label htmlFor="sh">Measurement shots</label>
            <select id="sh" value={shots} onChange={(e) => setShots(+e.target.value)}>
              {[100, 1024, 4096].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <p className="caption" style={{ marginTop: 0 }}>{SCENARIOS[scenario].story}</p>
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn" onClick={run} disabled={running}>{running ? 'Running…' : 'Run experiment'}</button>
          <button className="btn ghost" onClick={() => { setT(Math.floor(Math.random() * N)); }}>Random secret</button>
        </div>
      </div>

      {result && (
        <>
          <div className="grid-2" style={{ marginTop: 32 }}>
            <div className="card">
              <h3>Classical: linear search</h3>
              <div className="stats">
                <Stat value={S.label(result.targets[0], result.n)} label="found" />
                <Stat value={result.classical.queries.toLocaleString()} label="queries (this run)" />
                <Stat value={fmt((result.N + 1) / (result.M + 1))} label="queries on average" />
                <Stat value={fmt(result.N - result.M + 1)} label="queries, worst case" />
                <Stat value={fmt(result.classical.timeMs * 1000) + ' µs'} label="measured time" />
              </div>
              <p className="caption">Deterministic: always finds the answer, and always exactly.</p>
            </div>
            <div className="card">
              <h3>Quantum: Grover's search</h3>
              <div className="stats">
                <Stat value={S.label(measured.found, result.n)} label="most frequent measurement" className={result.targets.includes(measured.found) ? 'good' : 'bad'} />
                <Stat value={result.ko} label="oracle queries (optimal k)" />
                <Stat value={pct(result.grover.history[result.ko].p)} label="success probability at optimum" />
                <Stat value={pct(measured.hitRate)} label={`hit rate over ${shots} shots`} />
                <Stat value={fmt(result.grover.timeMs) + ' ms'} label="simulation time" />
              </div>
              <p className="caption">Probabilistic. The simulation time is CPU time spent imitating the quantum machine, not quantum hardware time.</p>
            </div>
          </div>

          <div className="card">
            <h3>Amplitudes after iteration {view}</h3>
            <div className="controls" style={{ marginBottom: 6 }}>
              <div>
                <label htmlFor="v">Iteration: <output>{view}</output> (optimal: {result.ko})</label>
                <input id="v" type="range" min="0" max={result.maxK} value={view} onChange={(e) => setView(+e.target.value)} />
              </div>
            </div>
            <AmplitudeChart amps={result.grover.history[view].amps} targets={result.targets} />
            <p className="caption">
              <span className="legend-dot" style={{ background: 'var(--hit)' }} />secret item{result.M > 1 ? 's' : ''}
              &nbsp;&nbsp;<span className="legend-dot" style={{ background: 'var(--bar)' }} />all others.
              {result.N > 128 && ' States are grouped into 128 bins; hover for the range. '}
              The vertical axis rescales at every iteration. Probability of finding the secret now:{' '}
              <b>{pct(result.grover.history[view].p)}</b>.
            </p>
          </div>

          <div className="grid-2" style={{ marginTop: 32 }}>
            <div className="card">
              <h3>Success probability vs iterations</h3>
              <div className="chart" role="img" aria-label="Success probability against Grover iterations, simulated and theoretical">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={curve} margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
                    <CartesianGrid stroke={c.line} />
                    <XAxis dataKey="k" tick={{ fill: c.muted, fontSize: 12 }} stroke={c.muted} label={{ value: 'Grover iterations', position: 'insideBottom', offset: -10, fill: c.muted, fontSize: 12 }} />
                    <YAxis domain={[0, 1]} tick={{ fill: c.muted, fontSize: 12 }} stroke={c.muted} width={40} />
                    <Tooltip contentStyle={tip} formatter={(v) => Number(v).toFixed(4)} />
                    <Legend />
                    <Line dataKey="theory" name="theory sin²((2k+1)θ)" stroke={c.muted} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                    <Line dataKey="simulated" name="simulated" stroke={c.hit} strokeWidth={2} dot={{ r: 3, fill: c.hit }} isAnimationActive={false} />
                    <ReferenceDot x={view} y={result.grover.history[view].p} r={7} fill={c.accent} stroke="none" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="caption">Simulation and theory coincide. Past the optimum the probability falls again.</p>
            </div>

            <div className="card">
              <h3>{shots} measurements at iteration {view}</h3>
              <div className="chart" role="img" aria-label="Histogram of the most frequent measurement outcomes">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={measured.top.map(([i, cnt]) => ({ label: S.label(i, result.n), cnt, hit: result.targets.includes(i) }))}
                    margin={{ top: 8, right: 12, bottom: 30, left: 0 }}>
                    <CartesianGrid stroke={c.line} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 10 }} stroke={c.muted} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: c.muted, fontSize: 12 }} stroke={c.muted} width={40} />
                    <Tooltip contentStyle={tip} />
                    <Bar dataKey="cnt" name="count" isAnimationActive={false}>
                      {measured.top.map(([i], j) => <Cell key={j} fill={result.targets.includes(i) ? c.hit : c.bar} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="caption">
                Top 8 outcomes. <button className="btn ghost" style={{ padding: '2px 10px' }} onClick={() => setSeed((s) => s + 1)}>Measure again</button>
              </p>
            </div>
          </div>

          <div className="card">
            <h3>Circuit executed</h3>
            <CircuitDiagram n={result.n} k={result.ko} />
            <p className="caption">
              Gates per iteration: {result.grover.gatesPerIteration.H} H, {result.grover.gatesPerIteration.X} X,{' '}
              {result.grover.gatesPerIteration.MCZ} multi-controlled Z. Whole circuit at k = {result.ko}:{' '}
              {result.n + result.ko * result.grover.gatesPerIteration.H} H,{' '}
              {result.ko * result.grover.gatesPerIteration.X} X,{' '}
              {result.ko * result.grover.gatesPerIteration.MCZ} multi-controlled Z.
            </p>
          </div>

          <div className="card scroll">
            <h3>Side-by-side comparison for this run</h3>
            <table className="text">
              <thead><tr><th>Metric</th><th>Classical linear search</th><th>Grover's algorithm</th></tr></thead>
              <tbody>
                <tr><td>Query complexity</td><td>O(N)</td><td>O(√N)</td></tr>
                <tr><td>Queries here (N = {result.N.toLocaleString()}, M = {result.M})</td><td>{fmt((result.N + 1) / (result.M + 1))} average</td><td>{result.ko} (plus one classical check of the answer)</td></tr>
                <tr><td>Result</td><td>Exact</td><td>Probabilistic ({pct(result.grover.history[result.ko].p)} at k = {result.ko})</td></tr>
                <tr><td>Extra knowledge needed</td><td>None</td><td>Number of secret items M, to pick k</td></tr>
                <tr><td>Time in this browser</td><td>{fmt(result.classical.timeMs * 1000)} µs (real CPU)</td><td>{fmt(result.grover.timeMs)} ms (simulating the quantum machine)</td></tr>
                <tr><td>Hardware</td><td>Ordinary CPU</td><td>Fault-tolerant quantum computer for large N</td></tr>
              </tbody>
            </table>
            <p className="caption">
              Simulating n qubits costs 2ⁿ numbers per gate, so the simulator is far slower than the classical search.
              The advantage is in oracle queries on real quantum hardware, not in simulator wall-clock time.
            </p>
          </div>
        </>
      )}
    </>
  );
}
