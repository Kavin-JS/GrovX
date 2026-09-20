import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PageHead, Stat } from '../components/ui.jsx';
import { useThemeColors } from '../hooks/useThemeColors.js';
import { runBenchmark, rowsToCsv } from '../experiments/benchmark.js';
import { optimalIterations } from '../quantum/grover.js';
import { fmt, pct } from '../utils/format.js';

let cache = null; // keep results when navigating away and back

function ChartBox({ title, caption, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="chart" role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height={280}>{children}</ResponsiveContainer>
      </div>
      <p className="caption">{caption}</p>
    </div>
  );
}

export default function Benchmarks() {
  const c = useThemeColors();
  const [maxN, setMaxN] = useState(cache?.maxN ?? 12);
  const [rows, setRows] = useState(cache?.rows ?? null);
  const [progress, setProgress] = useState(null);

  const run = async (m = maxN) => {
    setProgress(0);
    const r = await runBenchmark(m, (n, mx) => setProgress((n - 1) / (mx - 1)));
    cache = { maxN: m, rows: r };
    setRows(r);
    setProgress(null);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!rows) run(); }, []);

  const scaling = useMemo(() => {
    const out = [];
    for (let n = 2; n <= 40; n++) {
      const N = Math.pow(2, n);
      const measured = rows?.find((r) => r.n === n)?.classicalQueries ?? null;
      out.push({ n, classical: (N + 1) / 2, grover: Math.max(1, optimalIterations(N, 1)), measured });
    }
    return out;
  }, [rows]);

  const download = () => {
    const blob = new Blob([rowsToCsv(rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'grover-benchmark.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const tip = { background: c.surface, border: `1px solid ${c.line}`, color: c.ink };
  const axis = { tick: { fill: c.muted, fontSize: 12 }, stroke: c.muted };
  const maxDev = rows ? Math.max(...rows.map((r) => r.deviation)) : 0;
  const minP = rows ? Math.min(...rows.map((r) => r.groverP)) : 0;
  const timeData = rows?.map((r) => ({ n: r.n, classical: Math.max(r.classicalTimeMs, 1e-6), simulated: Math.max(r.simTimeMs, 1e-6) }));

  return (
    <>
      <PageHead title="Benchmarks">
        A sweep over search-space size N = 2ⁿ with one secret item. Classical numbers are measured by running linear search.
        Grover numbers come from executing the full circuit on the simulator at the optimal iteration count.
      </PageHead>

      <div className="card">
        <div className="controls">
          <div>
            <label htmlFor="mx">Largest n to simulate</label>
            <select id="mx" value={maxN} onChange={(e) => setMaxN(+e.target.value)}>
              {[8, 10, 12, 14].map((v) => <option key={v} value={v}>{v} (N = {(1 << v).toLocaleString()})</option>)}
            </select>
            <span className="hint">n = 14 takes a second or two.</span>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <div className="actions" style={{ marginTop: 0 }}>
              <button className="btn" onClick={() => run(maxN)} disabled={progress !== null}>
                {progress !== null ? `Running… ${Math.round(progress * 100)}%` : 'Run benchmark'}
              </button>
              <button className="btn ghost" onClick={download} disabled={!rows}>Download CSV</button>
            </div>
          </div>
        </div>
        {rows && (
          <div className="stats">
            <Stat value={`n = 2 to ${rows[rows.length - 1].n}`} label="sizes benchmarked" />
            <Stat value={pct(minP)} label="lowest Grover success probability" />
            <Stat value={maxDev.toExponential(1)} label="max |simulated − theory| probability" className="good" />
            <Stat value={fmt(rows[rows.length - 1].classicalQueries / rows[rows.length - 1].groverIterations) + '×'} label={`query reduction at n = ${rows[rows.length - 1].n}`} />
          </div>
        )}
      </div>

      {rows && (
        <>
          <div className="grid-2" style={{ marginTop: 32 }}>
            <ChartBox title="Queries to find the secret (log scale)"
              caption="Lines are analytic and extend to n = 40; dots are measured classical averages over 300 random secrets. The gap between the lines is the quadratic advantage.">
              <LineChart data={scaling} margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
                <CartesianGrid stroke={c.line} />
                <XAxis dataKey="n" {...axis} label={{ value: 'qubits n', position: 'insideBottom', offset: -10, fill: c.muted, fontSize: 12 }} />
                <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow {...axis} width={56} tickFormatter={(v) => v.toExponential(0)} />
                <Tooltip contentStyle={tip} formatter={(v) => fmt(v)} />
                <Legend />
                <Line dataKey="classical" name="classical (N+1)/2" stroke={c.muted} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="grover" name="Grover ≈ (π/4)√N" stroke={c.accent} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Line dataKey="measured" name="classical measured" stroke="none" dot={{ r: 4, fill: c.hit }} isAnimationActive={false} />
              </LineChart>
            </ChartBox>

            <ChartBox title="Grover success probability at the optimal k"
              caption="High for every size, but below 100%: the algorithm is probabilistic. Small N is slightly worse because k must be a whole number.">
              <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
                <CartesianGrid stroke={c.line} />
                <XAxis dataKey="n" {...axis} label={{ value: 'qubits n', position: 'insideBottom', offset: -10, fill: c.muted, fontSize: 12 }} />
                <YAxis domain={[0.8, 1.01]} {...axis} width={44} tickFormatter={(v) => (v * 100).toFixed(0) + '%'} />
                <Tooltip contentStyle={tip} formatter={(v) => pct(v, 2)} />
                <Legend />
                <Line dataKey="pTheory" name="theory" stroke={c.muted} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                <Line dataKey="groverP" name="simulated" stroke={c.hit} strokeWidth={2} dot={{ r: 3, fill: c.hit }} isAnimationActive={false} />
              </LineChart>
            </ChartBox>
          </div>

          <div style={{ marginTop: 32 }}>
            <ChartBox title="Wall-clock time in this browser (log scale)"
              caption="Classical search runs on the CPU. The 'simulated' line is the CPU time needed to imitate Grover's circuit: it grows like 2ⁿ·n·√N, far faster than the classical search. A simulator can never show a speedup; only real quantum hardware can, and only for large N.">
              <LineChart data={timeData} margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
                <CartesianGrid stroke={c.line} />
                <XAxis dataKey="n" {...axis} label={{ value: 'qubits n', position: 'insideBottom', offset: -10, fill: c.muted, fontSize: 12 }} />
                <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow {...axis} width={60} tickFormatter={(v) => v.toExponential(0) + ' ms'} />
                <Tooltip contentStyle={tip} formatter={(v) => v.toExponential(2) + ' ms'} />
                <Legend />
                <Line dataKey="classical" name="classical search" stroke={c.muted} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                <Line dataKey="simulated" name="Grover simulation" stroke={c.accent} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ChartBox>
          </div>

          <div className="card scroll" style={{ marginTop: 32 }}>
            <h3>Raw data</h3>
            <table>
              <thead>
                <tr>
                  <th>n</th><th>N</th><th>Classical queries (avg)</th><th>Classical worst</th><th>Classical time (µs)</th>
                  <th>Grover k</th><th>P(success)</th><th>Sim. time (ms)</th><th>H</th><th>X</th><th>MCZ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n}>
                    <td>{r.n}</td><td>{r.N.toLocaleString()}</td><td>{fmt(r.classicalQueries)}</td><td>{r.classicalWorst.toLocaleString()}</td>
                    <td>{fmt(r.classicalTimeMs * 1000)}</td><td>{r.groverIterations}</td><td>{pct(r.groverP, 2)}</td>
                    <td>{fmt(r.simTimeMs)}</td><td>{r.gatesH.toLocaleString()}</td><td>{r.gatesX.toLocaleString()}</td><td>{r.gatesMCZ.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="caption">
              H, X and MCZ are the logical gate counts of the executed circuit. Timings vary from run to run and between machines.
            </p>
          </div>

          <div className="callout good">
            <p>
              <b>Validation.</b> Across every size above, the gate-level simulation agrees with the closed-form
              probability sin²((2k+1)θ) to within {maxDev.toExponential(1)}, so the implemented circuit is behaving exactly as the theory predicts.
            </p>
          </div>
        </>
      )}
    </>
  );
}
