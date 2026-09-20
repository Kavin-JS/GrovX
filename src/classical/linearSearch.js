/** Classical linear search. `isTarget` is the oracle; every call counts as one query. */
export function linearSearch(N, isTarget) {
  let queries = 0;
  for (let i = 0; i < N; i++) {
    queries++;
    if (isTarget(i)) return { index: i, queries };
  }
  return { index: -1, queries };
}

/** Same search, repeated to average out timer resolution. Returns time per search in ms. */
export function timedLinearSearch(N, isTarget) {
  const reps = Math.max(50, Math.floor(2e6 / N));
  let r;
  const t0 = performance.now();
  for (let i = 0; i < reps; i++) r = linearSearch(N, isTarget);
  return { ...r, timeMs: (performance.now() - t0) / reps };
}
