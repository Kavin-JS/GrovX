import { runGrover, optimalIterations, theoreticalProbability } from '../quantum/grover.js';
import { linearSearch, timedLinearSearch } from '../classical/linearSearch.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Sweep N = 2^n for n = 2..maxN with one secret item.
 * Classical: measured queries (average over random secrets) and time.
 * Grover: gate-level simulation at the optimal iteration count.
 */
export async function runBenchmark(maxN = 12, onProgress = () => {}) {
  const rows = [];
  for (let n = 2; n <= maxN; n++) {
    const N = 1 << n;
    const k = optimalIterations(N, 1);

    // Classical: average queries over 300 random secrets, average time over 5.
    let qSum = 0;
    for (let i = 0; i < 300; i++) {
      const t = Math.floor(Math.random() * N);
      qSum += linearSearch(N, (x) => x === t).queries;
    }
    let tSum = 0;
    for (let i = 0; i < 5; i++) {
      const t = Math.floor(Math.random() * N);
      tSum += timedLinearSearch(N, (x) => x === t).timeMs;
    }

    // Grover: gate-level simulation.
    const target = Math.floor(Math.random() * N);
    const g = runGrover({ n, targets: [target], maxIterations: k, keepAmplitudes: false });
    const gates = g.gatesPerIteration;
    const pSim = g.history[k].p;
    const pTheory = theoreticalProbability(N, 1, k);

    rows.push({
      n, N,
      classicalQueries: qSum / 300,
      classicalWorst: N,
      classicalTimeMs: tSum / 5,
      groverIterations: k,
      groverP: pSim,
      pTheory,
      deviation: Math.abs(pSim - pTheory),
      simTimeMs: g.timeMs,
      gatesH: n + k * gates.H,
      gatesX: k * gates.X,
      gatesMCZ: k * gates.MCZ,
    });
    onProgress(n, maxN);
    await tick();
  }
  return rows;
}

export function rowsToCsv(rows) {
  const cols = [
    'n', 'N', 'classicalQueries', 'classicalWorst', 'classicalTimeMs',
    'groverIterations', 'groverP', 'pTheory', 'deviation', 'simTimeMs',
    'gatesH', 'gatesX', 'gatesMCZ',
  ];
  return [cols.join(','), ...rows.map((r) => cols.map((c) => r[c]).join(','))].join('\n');
}
