import { optimalIterations, theoreticalProbability } from './grover.js';

/**
 * Back-of-envelope resource model for Grover on an ideal gate-based machine.
 *
 *  - Multi-controlled Z on n qubits = 2n-3 Toffoli gates using n-2 ancilla qubits
 *    (compute ladder, one central gate, uncompute ladder). For n = 2 it is one CZ.
 *  - Toffoli = 6 CNOT + 9 single-qubit gates.
 *  - Per iteration: oracle (2n X gates + MCZ, or a user-supplied Toffoli count)
 *    and diffusion (2n H + 2n X + MCZ).
 *  - Single-qubit error rate = two-qubit error rate / 10.
 *  - Gates run one after another (no parallelism), no error correction.
 */
export function estimateResources({
  n,
  p2 = 1e-3,
  oracleToffoli = 0,
  checkNs = 1000,
  twoQubitNs = 200,
  oneQubitNs = 20,
}) {
  const N = Math.pow(2, n);
  const k = Math.max(1, optimalIterations(N, 1));
  const mczToffoli = n >= 3 ? 2 * n - 3 : 0;
  const mczCz = n === 2 ? 1 : 0;
  const oracleT = oracleToffoli > 0 ? oracleToffoli : mczToffoli;

  const toffoli = k * (oracleT + mczToffoli);
  const twoQ = k * 2 * mczCz + 6 * toffoli;
  const oneQ = k * 6 * n + 9 * toffoli;

  const lnF = twoQ * Math.log1p(-p2) + oneQ * Math.log1p(-p2 / 10);
  const fidelity = Math.exp(lnF);
  const pIdeal = theoreticalProbability(N, 1, k);
  const pNoisy = pIdeal * fidelity + (1 - fidelity) / N;

  const quantumSeconds = (twoQ * twoQubitNs + oneQ * oneQubitNs) * 1e-9;
  const classicalSeconds = ((N + 1) / 2) * checkNs * 1e-9;
  const ancilla = n >= 3 ? n - 2 : 0;

  return {
    n, N, k,
    logicalQubits: n + ancilla, ancilla,
    toffoli, twoQ, oneQ,
    fidelity, pIdeal, pNoisy,
    quantumSeconds, classicalSeconds,
    physicalQubits: (n + ancilla) * 1000,
  };
}

/**
 * Scan n = 2..nMax to find where (if anywhere) the quantum circuit wins.
 *
 * "Sustained win" = the smallest n from which the ideal quantum run time stays below the
 * classical run time for every larger n (tiny n can win by accident, so a first win is not enough).
 * "Usable window" = sizes at or above that point where the noisy circuit still succeeds at least half the time.
 */
export function scanResources(params, nMax = 60) {
  const rows = [];
  for (let n = 2; n <= nMax; n++) {
    const r = estimateResources({ ...params, n });
    rows.push({
      n,
      quantum: r.quantumSeconds,
      classical: r.classicalSeconds,
      pNoisy: r.pNoisy,
      idealWin: r.quantumSeconds < r.classicalSeconds,
    });
  }
  let sustainedWin = null;
  for (let i = rows.length - 1; i >= 0 && rows[i].idealWin; i--) sustainedWin = rows[i].n;
  const usable = rows.filter((r) => sustainedWin !== null && r.n >= sustainedWin && r.pNoisy >= 0.5);
  return {
    rows,
    sustainedWin,
    usableMin: usable.length ? usable[0].n : null,
    usableMax: usable.length ? usable[usable.length - 1].n : null,
  };
}
