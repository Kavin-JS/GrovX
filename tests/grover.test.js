import { describe, it, expect } from 'vitest';
import { QuantumState, sampleAmplitudes } from '../src/quantum/simulator.js';
import {
  runGrover, optimalIterations, theoreticalProbability, targetsFor, initOps,
} from '../src/quantum/grover.js';
import { linearSearch } from '../src/classical/linearSearch.js';
import { estimateResources, scanResources } from '../src/quantum/resources.js';

describe('simulator', () => {
  it('Hadamard on every qubit gives a uniform superposition', () => {
    const s = new QuantumState(4);
    s.applyAll(initOps(4));
    for (const a of s.a) expect(a).toBeCloseTo(1 / 4, 12);
    expect(s.norm()).toBeCloseTo(1, 12);
  });

  it('H is its own inverse and X flips |0> to |1>', () => {
    const s = new QuantumState(3);
    s.h(1); s.h(1);
    expect(s.a[0]).toBeCloseTo(1, 12);
    s.x(2);
    expect(s.a[4]).toBeCloseTo(1, 12);
  });

  it('multi-controlled Z flips only |1...1>', () => {
    const s = new QuantumState(3);
    s.applyAll(initOps(3));
    s.mcz([0, 1, 2]);
    expect(s.a[7]).toBeLessThan(0);
    expect(s.a[3]).toBeGreaterThan(0);
  });

  it('sampling respects the distribution', () => {
    const counts = sampleAmplitudes(Float64Array.from([0, 1, 0, 0]), 100);
    expect(counts.get(1)).toBe(100);
  });
});

describe("Grover's algorithm", () => {
  it('gate-level simulation matches sin^2((2k+1)theta) for every k', () => {
    for (const n of [2, 3, 4, 5, 6, 8, 10]) {
      for (const M of [1, 2]) {
        const N = 1 << n;
        if (M > N >> 2) continue;
        const targets = targetsFor(N, M, 1);
        const kMax = 2 * optimalIterations(N, M) + 2;
        const { history } = runGrover({ n, targets, maxIterations: kMax, keepAmplitudes: false });
        for (let k = 0; k <= kMax; k++) {
          expect(history[k].p).toBeCloseTo(theoreticalProbability(N, M, k), 9);
        }
      }
    }
  });

  it('keeps the state normalised', () => {
    const { history } = runGrover({ n: 6, targets: [10], maxIterations: 6 });
    const last = history[6].amps;
    let s = 0;
    for (const a of last) s += a * a;
    expect(s).toBeCloseTo(1, 5);
  });

  it('succeeds with high probability at the optimal iteration count', () => {
    for (const n of [4, 6, 8, 10]) {
      const N = 1 << n;
      const k = optimalIterations(N, 1);
      const { history } = runGrover({ n, targets: [3], maxIterations: k, keepAmplitudes: false });
      expect(history[k].p).toBeGreaterThan(0.94);
    }
  });

  it('optimal iteration counts follow ~ (pi/4) sqrt(N)', () => {
    expect(optimalIterations(4)).toBe(1);
    expect(optimalIterations(16)).toBe(3);
    expect(optimalIterations(1024)).toBe(25);
    expect(optimalIterations(2 ** 20)).toBe(804);
  });

  it('overshooting lowers the success probability', () => {
    const N = 64, k = optimalIterations(N, 1);
    expect(theoreticalProbability(N, 1, 2 * k)).toBeLessThan(theoreticalProbability(N, 1, k));
  });
});

describe('classical baseline and resources', () => {
  it('linear search finds the item in index+1 queries', () => {
    expect(linearSearch(100, (i) => i === 41)).toEqual({ index: 41, queries: 42 });
  });

  it('resource model is monotonic in n', () => {
    const a = estimateResources({ n: 8 }), b = estimateResources({ n: 12 });
    expect(b.twoQ).toBeGreaterThan(a.twoQ);
    expect(b.fidelity).toBeLessThan(a.fidelity);
  });

  it('crossover scan reports a sustained win, not an accidental one at tiny n', () => {
    const scan = scanResources({ p2: 1e-3, oracleToffoli: 0, checkNs: 1000 }, 60);
    expect(scan.sustainedWin).toBeGreaterThan(2);
    for (const r of scan.rows.filter((x) => x.n >= scan.sustainedWin)) expect(r.idealWin).toBe(true);
  });
});
