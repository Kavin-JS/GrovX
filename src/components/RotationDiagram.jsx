import { theta } from '../quantum/grover.js';

/**
 * Geometric picture: the state lives in the plane spanned by |non-secret> (horizontal)
 * and |secret> (vertical). Each Grover iteration rotates it by 2*theta toward |secret>.
 */
export default function RotationDiagram({ N, M = 1, k }) {
  const th = theta(N, M);
  const ang = (2 * k + 1) * th;
  const cx = 200, cy = 190, R = 150;
  const pt = (a) => [cx + R * Math.cos(a), cy - R * Math.sin(a)];
  const [sx, sy] = pt(th);
  const [px, py] = pt(ang);
  const P = Math.pow(Math.sin(ang), 2);
  const deg = (r) => ((r * 180) / Math.PI).toFixed(1);
  const arcEnd = pt(Math.min(ang, Math.PI * 1.99));
  const large = ang % (2 * Math.PI) > Math.PI ? 1 : 0;
  const line = { stroke: 'var(--line)', strokeWidth: 1.5 };

  return (
    <svg viewBox="0 0 440 380" width="100%" style={{ maxWidth: 480, display: 'block' }} role="img"
      aria-label={`State vector at angle ${deg(ang)} degrees; success probability ${(P * 100).toFixed(1)} percent`}>
      <circle cx={cx} cy={cy} r={R} style={{ fill: 'none', ...line }} />
      <line x1={cx - R - 10} x2={cx + R + 10} y1={cy} y2={cy} style={{ stroke: 'var(--muted)', strokeWidth: 1 }} />
      <line x1={cx} x2={cx} y1={cy + R + 10} y2={cy - R - 14} style={{ stroke: 'var(--muted)', strokeWidth: 1 }} />
      <text x={cx + R + 10} y={cy + 18} style={{ fill: 'var(--muted)', fontSize: 12, textAnchor: 'end' }}>|non-secret⟩</text>
      <text x={cx + 8} y={cy - R - 16} style={{ fill: 'var(--hit)', fontSize: 12 }}>|secret⟩</text>
      {/* initial state |s> */}
      <line x1={cx} y1={cy} x2={sx} y2={sy} style={{ stroke: 'var(--muted)', strokeWidth: 2, strokeDasharray: '5 4' }} />
      <text x={sx + 6} y={sy + 14} style={{ fill: 'var(--muted)', fontSize: 12 }}>|s⟩ start</text>
      {/* current state */}
      {k > 0 && (
        <path d={`M ${cx + 40} ${cy} A 40 40 0 ${large} 0 ${cx + 40 * Math.cos(Math.min(ang, Math.PI * 1.99))} ${cy - 40 * Math.sin(Math.min(ang, Math.PI * 1.99))}`}
          style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 1.5 }} />
      )}
      <line x1={px} y1={py} x2={px} y2={cy} style={{ stroke: 'var(--hit)', strokeWidth: 1, strokeDasharray: '3 3' }} />
      <line x1={cx} y1={cy} x2={px} y2={py} style={{ stroke: 'var(--accent)', strokeWidth: 3.5 }} />
      <circle cx={px} cy={py} r="6" style={{ fill: 'var(--accent)' }} />
      <text x={cx} y={cy + 34} style={{ fill: 'var(--ink)', fontSize: 13, textAnchor: 'middle' }}>
        angle (2k+1)θ = {deg(ang)}°
      </text>
      <text x={cx} y={cy + 54} style={{ fill: 'var(--ink)', fontSize: 15, fontWeight: 600, textAnchor: 'middle' }}>
        P(secret) = sin²(angle) = {(P * 100).toFixed(1)}%
      </text>
      <text x={cx} y={cy + 74} style={{ fill: 'var(--muted)', fontSize: 12, textAnchor: 'middle' }}>
        each iteration rotates by 2θ = {deg(2 * th)}°
      </text>
    </svg>
  );
}
