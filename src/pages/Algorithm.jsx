import { useState } from 'react';
import { PageHead } from '../components/ui.jsx';
import CircuitDiagram from '../components/CircuitDiagram.jsx';
import RotationDiagram from '../components/RotationDiagram.jsx';
import { optimalIterations } from '../quantum/grover.js';

export default function Algorithm() {
  const [n, setN] = useState(6);
  const N = 1 << n;
  const ko = optimalIterations(N, 1);
  const [k, setK] = useState(3);
  const kk = Math.min(k, 2 * ko + 2);

  return (
    <>
      <PageHead title="How Grover's algorithm works">
        Grover's algorithm finds a marked item among N unsorted items using about (π/4)√N queries to the oracle,
        where any classical method needs on the order of N.
      </PageHead>

      <section>
        <h2>The setting</h2>
        <p>
          We have a function f(x) that returns 1 for the secret item w and 0 for everything else. We can evaluate f
          but cannot look inside it. Classically, each evaluation checks one candidate. On a quantum computer the
          oracle is a unitary U<sub>f</sub> that flips the sign of the secret state, and it can be applied to a
          superposition of all candidates at once.
        </p>
        <div className="formula">U_f |x⟩ = (−1)^f(x) |x⟩</div>
      </section>

      <section className="block">
        <h2>The four steps</h2>
        <ol className="steps">
          <li><b>Superposition.</b> Apply a Hadamard gate to each of the n qubits. Every one of the N = 2ⁿ items now
            has amplitude 1/√N, so each would be measured with probability 1/N.</li>
          <li><b>Oracle.</b> Apply U<sub>f</sub>. This flips the sign of the secret item's amplitude only. Probabilities
            do not change yet, because a sign is invisible to measurement.</li>
          <li><b>Diffusion.</b> Reflect every amplitude about the mean: a → 2·mean − a. The secret item, now below the
            mean, is pushed far above it, and every other amplitude shrinks a little.</li>
          <li><b>Repeat and measure.</b> After about (π/4)√N rounds of steps 2 and 3, the secret item has probability close
            to 1. Measure all qubits to read it out.</li>
        </ol>
      </section>

      <section className="block">
        <h2>The circuit</h2>
        <div className="card">
          <div className="controls">
            <div>
              <label htmlFor="cn">Qubits n: <output>{n}</output></label>
              <input id="cn" type="range" min="2" max="12" value={n} onChange={(e) => setN(+e.target.value)} />
            </div>
          </div>
          <CircuitDiagram n={n} k={ko} />
          <p className="caption">Schematic for n = {n}: N = {N} items, {ko} Grover iteration{ko === 1 ? '' : 's'}.</p>
        </div>
        <div className="grid-2" style={{ marginTop: 32 }}>
          <div className="card">
            <h3>Oracle (one secret item)</h3>
            <p className="mono">X on every qubit where the secret has a 0<br />multi-controlled Z on all n qubits<br />X on the same qubits again</p>
            <p className="caption">Only the secret basis state ends up with its sign flipped.</p>
          </div>
          <div className="card">
            <h3>Diffusion</h3>
            <p className="mono">H on all qubits<br />X on all qubits<br />multi-controlled Z<br />X on all qubits<br />H on all qubits</p>
            <p className="caption">This implements the reflection 2|s⟩⟨s| − I about the uniform superposition (up to a global sign).</p>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>Why it works: a rotation</h2>
        <p>
          The state never leaves a two-dimensional plane: the secret item, and the uniform mix of everything else.
          The oracle reflects the state about the "non-secret" axis and the diffusion reflects it about the starting
          state. Two reflections make a rotation, so each iteration turns the state by 2θ toward the secret item, where
          sin θ = √(M/N).
        </p>
        <div className="card">
          <div className="controls">
            <div>
              <label htmlFor="rn">Qubits n: <output>{n}</output> (N = {N})</label>
              <input id="rn" type="range" min="2" max="12" value={n} onChange={(e) => setN(+e.target.value)} />
            </div>
            <div>
              <label htmlFor="rk">Iterations k: <output>{kk}</output> (optimal: {ko})</label>
              <input id="rk" type="range" min="0" max={2 * ko + 2} value={kk} onChange={(e) => setK(+e.target.value)} />
            </div>
          </div>
          <div className="chart"><RotationDiagram N={N} M={1} k={kk} /></div>
          <p className="caption">
            Drag k past the optimum and the state rotates beyond the secret axis, so the success probability
            falls again. Grover's algorithm needs the right number of iterations.
          </p>
        </div>
      </section>

      <section className="block">
        <h2>Complexity</h2>
        <div className="formula">P(k) = sin²((2k+1)θ),   sin θ = √(M/N)</div>
        <div className="formula">k_opt ≈ (π/4)·√(N/M)</div>
        <ul className="tight">
          <li><b>Queries:</b> Θ(√N) for Grover against Θ(N) classically (about N/2 on average).</li>
          <li><b>Qubits:</b> n = log₂N for the register, plus about n−2 ancilla qubits if the multi-controlled gates are built from Toffoli gates.</li>
          <li><b>Optimality:</b> no quantum algorithm can solve unstructured search with fewer than Ω(√N) queries (Bennett, Bernstein, Brassard and Vazirani, 1997). Grover's algorithm is optimal.</li>
          <li><b>Multiple secrets:</b> with M secret items the iteration count drops to (π/4)√(N/M), and the count must be known or estimated.</li>
        </ul>
      </section>
    </>
  );
}
