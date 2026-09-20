import { QuantumState } from './simulator.js';

/* ---------- Theory ---------- */

/** Rotation angle: sin(theta) = sqrt(M/N). */
export const theta = (N, M = 1) => Math.asin(Math.sqrt(M / N));

/** Optimal number of Grover iterations for M solutions among N items. */
export const optimalIterations = (N, M = 1) =>
  Math.max(0, Math.round(Math.PI / (4 * theta(N, M)) - 0.5));

/** Success probability after k iterations: sin^2((2k+1) theta). */
export const theoreticalProbability = (N, M, k) =>
  Math.pow(Math.sin((2 * k + 1) * theta(N, M)), 2);

/** Spread M marked items evenly over the search space, starting at t0. */
export function targetsFor(N, M, t0) {
  const out = [];
  for (let j = 0; j < M; j++) out.push((t0 + Math.floor((j * N) / M)) % N);
  return out;
}

/* ---------- Circuit construction ---------- */

const range = (n) => Array.from({ length: n }, (_, i) => i);

/** H on every qubit: builds the uniform superposition. */
export const initOps = (n) => range(n).map((q) => ({ g: 'H', q }));

/**
 * Oracle U_f for one marked basis state: X on qubits where the target bit is 0,
 * multi-controlled Z, then undo the X gates. Net effect: |target> -> -|target>.
 */
export function oracleOps(n, target) {
  const flips = range(n).filter((q) => !((target >> q) & 1)).map((q) => ({ g: 'X', q }));
  return [...flips, { g: 'MCZ', qs: range(n) }, ...flips];
}

/** Diffusion operator: H^n X^n (MCZ) X^n H^n, equal to -(2|s><s| - I). */
export function diffusionOps(n) {
  const qs = range(n);
  return [
    ...qs.map((q) => ({ g: 'H', q })),
    ...qs.map((q) => ({ g: 'X', q })),
    { g: 'MCZ', qs },
    ...qs.map((q) => ({ g: 'X', q })),
    ...qs.map((q) => ({ g: 'H', q })),
    { g: 'GP' }, // cancel the global -1 so amplitudes read as 2*mean - a
  ];
}

/** One full Grover iteration (oracle for every marked item, then diffusion). */
export function iterationOps(n, targets) {
  const ops = [];
  for (const t of targets) ops.push(...oracleOps(n, t));
  ops.push(...diffusionOps(n));
  return ops;
}

/** Count logical gates (the global-phase helper is not a real gate). */
export function countGates(ops) {
  const c = { H: 0, X: 0, MCZ: 0 };
  for (const op of ops) if (op.g in c) c[op.g]++;
  return c;
}

/* ---------- Execution ---------- */

/**
 * Run Grover's circuit gate by gate on the state-vector simulator.
 * history[k] = { k, p, amps } where p = probability of measuring a marked item
 * after k iterations and amps is a snapshot of the amplitudes.
 */
export function runGrover({ n, targets, maxIterations, keepAmplitudes = true }) {
  const t0 = performance.now();
  const state = new QuantumState(n);
  state.applyAll(initOps(n));
  const ops = iterationOps(n, targets);
  const snap = (k) => ({
    k,
    p: state.probabilityOf(targets),
    amps: keepAmplitudes ? Float32Array.from(state.a) : null,
  });
  const history = [snap(0)];
  for (let k = 1; k <= maxIterations; k++) {
    state.applyAll(ops);
    history.push(snap(k));
  }
  return {
    n,
    N: state.N,
    history,
    gatesPerIteration: countGates(ops),
    timeMs: performance.now() - t0,
  };
}
