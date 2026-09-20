import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { PageHead, Stat } from '../components/ui.jsx';
import { useThemeColors } from '../hooks/useThemeColors.js';
import { useIsNarrow } from '../hooks/useMediaQuery.js';
import { estimateResources, scanResources } from '../quantum/resources.js';
import { fmt, dur } from '../utils/format.js';

export default function Resources() {
  const c = useThemeColors();
  const narrow = useIsNarrow();
  const [n, setN] = useState(14);
  const [p2, setP2] = useState(0.001);
  const [oracle, setOracle] = useState(0);
  const [checkNs, setCheckNs] = useState(1000);
  const [gateNs, setGateNs] = useState(200);

  const params = { p2, oracleToffoli: oracle, checkNs, twoQubitNs: gateNs };
  const r = estimateResources({ n, ...params });
  const scan = useMemo(() => scanResources({ p2, oracleToffoli: oracle, checkNs, twoQubitNs: gateNs }, 60), [p2, oracle, checkNs, gateNs]);
  const chartData = scan.rows.map((x) => ({ n: x.n, quantum: x.quantum, classical: x.classical }));
  const items = [
    ['Logical qubits', `${r.logicalQubits} (${r.n} data + ${r.ancilla} ancilla)`],
    ['Grover iterations = lock queries', r.k.toLocaleString()],
    ['Toffoli gates', fmt(r.toffoli)],
    ['Two-qubit gates (CNOT-equivalent)', fmt(r.twoQ)],
    ['Single-qubit gates', fmt(r.oneQ)],
    ['Whole-circuit fidelity', r.fidelity < 1e-300 ? '≈ 0' : fmt(r.fidelity)],
    ['Success probability, ideal', (r.pIdeal * 100).toFixed(1) + '%'],
    ['Success probability, with noise', (r.pNoisy * 100).toFixed(r.pNoisy < 0.01 ? 4 : 1) + '%'],
    ['Quantum run time (one shot)', dur(r.quantumSeconds)],
    ['Classical run time (one core, average)', dur(r.classicalSeconds)],
    ['Physical qubits if error-corrected', '≈ ' + fmt(r.physicalQubits) + ' (~1000 per logical)'],
  ];

  let verdict;
  if (r.pNoisy < 0.5) {
    verdict = <div className="callout bad"><p><b>Not usable on noisy hardware at these settings.</b> The circuit is so long that the output is mostly noise ({(r.pNoisy * 100).toFixed(2)}% success). Lower the error rate or the qubit count, or assume error correction.</p></div>;
  } else if (r.quantumSeconds < r.classicalSeconds) {
    verdict = <div className="callout good"><p><b>Quantum wins on time here</b>, about {fmt(r.classicalSeconds / r.quantumSeconds)}× faster than one classical core (success {(r.pNoisy * 100).toFixed(1)}%). Classical search also parallelises perfectly across many machines, whereas Grover gains only a √p factor from p machines.</p></div>;
  } else {
    verdict = <div className="callout bad"><p><b>Classical is faster here</b>, about {fmt(r.quantumSeconds / r.classicalSeconds)}× faster than the quantum circuit. Fewer queries do not help when each query is far slower than a classical guess.</p></div>;
  }

  const axis = { tick: { fill: c.muted, fontSize: 12 }, stroke: c.muted };
  return (
    <>
      <PageHead title="Resource requirements">
        What it takes to run Grover's circuit on a real gate-based machine, and whether the quantum run beats one classical
        core once gate speed and noise are accounted for. Single secret item; all figures are estimates.
      </PageHead>

      <div className="card">
        <div className="controls">
          <div>
            <label htmlFor="rn">Qubits n: <output>{n}</output></label>
            <input id="rn" type="range" min="2" max="60" value={n} onChange={(e) => setN(+e.target.value)} />
          </div>
          <div>
            <label htmlFor="rp">Two-qubit gate error rate</label>
            <select id="rp" value={p2} onChange={(e) => setP2(+e.target.value)}>
              <option value={0.01}>1e-2 (early devices)</option>
              <option value={0.001}>1e-3 (best current)</option>
              <option value={0.0001}>1e-4</option>
              <option value={0.000001}>1e-6 (near fault-tolerant)</option>
            </select>
          </div>
          <div>
            <label htmlFor="ro">Lock check cost (Toffoli gates)</label>
            <input id="ro" type="number" min="0" value={oracle} onChange={(e) => setOracle(Math.max(0, +e.target.value || 0))} />
            <span className="hint">0 = simple n-bit comparison. A real hash-based check costs thousands or more.</span>
          </div>
          <div>
            <label htmlFor="rt">Classical time per guess (ns)</label>
            <input id="rt" type="number" min="1" value={checkNs} onChange={(e) => setCheckNs(Math.max(1, +e.target.value || 1))} />
          </div>
          <div>
            <label htmlFor="rg">Two-qubit gate time (ns)</label>
            <input id="rg" type="number" min="1" value={gateNs} onChange={(e) => setGateNs(Math.max(1, +e.target.value || 1))} />
          </div>
        </div>
        <div className="stats">
          {items.map(([a, b]) => <Stat key={a} label={a} value={b} />)}
        </div>
        {verdict}
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <h3>Where is the crossover? (run time in seconds, log scale)</h3>
        <div className="chart" role="img" aria-label="Quantum and classical run time against qubit count, log scale">
          <ResponsiveContainer width="100%" height={narrow ? 260 : 300}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
              <CartesianGrid stroke={c.line} />
              <XAxis dataKey="n" {...axis} label={{ value: 'qubits n', position: 'insideBottom', offset: -10, fill: c.muted, fontSize: 12 }} />
              <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow {...axis} width={narrow ? 44 : 52} tickFormatter={(v) => v.toExponential(0)} />
              <Tooltip contentStyle={{ background: c.surface, border: `1px solid ${c.line}`, color: c.ink }} formatter={(v) => dur(v)} labelFormatter={(l) => 'n = ' + l} />
              <Legend verticalAlign="top" height={narrow ? 48 : 30} />
              <Line dataKey="classical" name="classical (one core)" stroke={c.muted} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line dataKey="quantum" name="quantum circuit (ideal)" stroke={c.accent} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <ReferenceLine x={n} stroke={c.hit} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="caption">
          {scan.sustainedWin
            ? <>If it ran without errors, the quantum circuit would be faster than one classical core from n = <b>{scan.sustainedWin}</b> upward. </>
            : <>Even without errors, the quantum circuit does not stay ahead of one classical core up to n = 60. </>}
          {scan.usableMin !== null
            ? <>With noise included it is both faster and correct at least half the time only for n = <b>{scan.usableMin}</b> to <b>{scan.usableMax}</b>; beyond that the circuit is too long to run reliably.</>
            : <>Once noise is included there is no size at which it is both faster and reliable. Try lowering the error rate.</>}
        </p>
      </div>

      <div className="callout">
        <p><b>Model.</b> A multi-controlled Z is built from 2n−3 Toffoli gates with n−2 ancilla qubits; a Toffoli is 6 CNOT plus 9
          single-qubit gates; single-qubit error is one tenth of the two-qubit error; single-qubit gates take 20 ns; gates run
          one after another. Noise-aware success assumes a failed run returns a uniformly random answer. Error-corrected
          overhead uses a rough 1000 physical qubits per logical qubit. These are back-of-envelope figures for comparing
          trends, not vendor specifications.</p>
      </div>
    </>
  );
}
