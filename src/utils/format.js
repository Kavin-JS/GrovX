export function fmt(x, d = 2) {
  if (!isFinite(x)) return '∞';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-2) return x.toExponential(d);
  return x.toLocaleString(undefined, { maximumFractionDigits: a < 10 ? 2 : a < 100 ? 1 : 0 });
}

export function dur(s) {
  if (s < 1e-6) return (s * 1e9).toFixed(0) + ' ns';
  if (s < 1e-3) return (s * 1e6).toFixed(1) + ' µs';
  if (s < 1) return (s * 1e3).toFixed(1) + ' ms';
  if (s < 60) return s.toFixed(1) + ' s';
  if (s < 3600) return (s / 60).toFixed(1) + ' min';
  if (s < 86400) return (s / 3600).toFixed(1) + ' hours';
  if (s < 3.15e7) return (s / 86400).toFixed(1) + ' days';
  return fmt(s / 3.15e7) + ' years';
}

export const pct = (p, d = 1) => (p * 100).toFixed(d) + '%';
export const bin = (i, n) => i.toString(2).padStart(n, '0');
