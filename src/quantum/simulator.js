/**
 * Minimal state-vector quantum simulator.
 *
 * Grover's circuit only needs the gates H, X and multi-controlled Z, all of which
 * have real matrix entries, so a real-valued amplitude vector is an exact
 * simulation (no approximation). Qubit q corresponds to bit q of the basis index.
 */
export class QuantumState {
  constructor(n) {
    this.n = n;
    this.N = 1 << n;
    this.a = new Float64Array(this.N);
    this.a[0] = 1; // |00...0>
  }

  /** Hadamard on qubit q. */
  h(q) {
    const { a, N } = this;
    const bit = 1 << q;
    const s = Math.SQRT1_2;
    for (let i = 0; i < N; i++) {
      if (i & bit) continue;
      const j = i | bit;
      const x = a[i], y = a[j];
      a[i] = (x + y) * s;
      a[j] = (x - y) * s;
    }
  }

  /** Pauli-X (NOT) on qubit q. */
  x(q) {
    const { a, N } = this;
    const bit = 1 << q;
    for (let i = 0; i < N; i++) {
      if (i & bit) continue;
      const j = i | bit;
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
  }

  /** Multi-controlled Z on the listed qubits: flips the sign of |1...1> on them. */
  mcz(qubits) {
    let mask = 0;
    for (const q of qubits) mask |= 1 << q;
    const { a, N } = this;
    for (let i = mask; i < N; i = (i + 1) | mask) a[i] = -a[i];
  }

  /** Global phase of -1 (unobservable; used only to keep amplitude plots readable). */
  negate() {
    const { a, N } = this;
    for (let i = 0; i < N; i++) a[i] = -a[i];
  }

  apply(op) {
    switch (op.g) {
      case 'H': this.h(op.q); break;
      case 'X': this.x(op.q); break;
      case 'MCZ': this.mcz(op.qs); break;
      case 'GP': this.negate(); break;
      default: throw new Error('Unknown gate ' + op.g);
    }
  }

  applyAll(ops) {
    for (const op of ops) this.apply(op);
  }

  probabilityOf(indices) {
    let p = 0;
    for (const i of indices) p += this.a[i] * this.a[i];
    return p;
  }

  norm() {
    let s = 0;
    for (let i = 0; i < this.N; i++) s += this.a[i] * this.a[i];
    return s;
  }
}

/**
 * Sample measurement outcomes from an amplitude vector.
 * Returns a Map(index -> count).
 */
export function sampleAmplitudes(amps, shots, rng = Math.random) {
  const N = amps.length;
  const cdf = new Float64Array(N);
  let acc = 0;
  for (let i = 0; i < N; i++) {
    acc += amps[i] * amps[i];
    cdf[i] = acc;
  }
  const counts = new Map();
  for (let s = 0; s < shots; s++) {
    const r = rng() * acc;
    let lo = 0, hi = N - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < r) lo = mid + 1; else hi = mid;
    }
    counts.set(lo, (counts.get(lo) || 0) + 1);
  }
  return counts;
}
