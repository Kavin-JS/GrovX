import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useThemeColors } from '../hooks/useThemeColors.js';
import { useIsNarrow } from '../hooks/useMediaQuery.js';

/**
 * Signed amplitude of every basis state. For large N the states are grouped into
 * at most 128 bins (largest amplitude per bin, and the marked item always wins its bin).
 */
export default function AmplitudeChart({ amps, targets, height = 260 }) {
  const c = useThemeColors();
  const narrow = useIsNarrow();
  const data = useMemo(() => {
    const N = amps.length;
    const bins = Math.min(N, 128);
    const tset = new Set(targets);
    const out = [];
    for (let b = 0; b < bins; b++) {
      const s = Math.floor((b * N) / bins);
      const e = Math.floor(((b + 1) * N) / bins);
      let best = 0, isT = false;
      for (let i = s; i < e; i++) {
        if (Math.abs(amps[i]) > Math.abs(best)) best = amps[i];
        if (tset.has(i)) { isT = true; best = amps[i]; }
      }
      out.push({ label: e - s === 1 ? String(s) : `${s}–${e - 1}`, v: best, isT });
    }
    return out;
  }, [amps, targets]);

  return (
    <div className="chart" role="img" aria-label="Bar chart of the amplitude of every basis state, secret item highlighted">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }} barCategoryGap={data.length > 64 ? 0 : '12%'}>
          <CartesianGrid stroke={c.line} vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis tick={{ fill: c.muted, fontSize: 12 }} stroke={c.muted} width={narrow ? 40 : 52} tickFormatter={(v) => v.toFixed(2)} domain={['auto', 'auto']} />
          <Tooltip
            formatter={(v) => [Number(v).toFixed(4), 'amplitude']}
            labelFormatter={(l) => 'state ' + l}
            contentStyle={{ background: c.surface, border: `1px solid ${c.line}`, color: c.ink }}
          />
          <ReferenceLine y={0} stroke={c.muted} />
          <Bar dataKey="v" isAnimationActive={false}>
            {data.map((d, i) => <Cell key={i} fill={d.isT ? c.hit : c.bar} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
