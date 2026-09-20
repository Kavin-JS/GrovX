/** Schematic of Grover's circuit: H layer, then (Oracle + Diffusion) repeated k times, then measurement. */
export default function CircuitDiagram({ n, k }) {
  const rows = n <= 5 ? Array.from({ length: n }, (_, i) => i) : [0, 1, 2, '…', n - 1];
  const gap = 44, top = 62;
  const H = top + rows.length * gap + 20;
  const yOf = (i) => top + i * gap;
  const y0 = yOf(0) - 18, y1 = yOf(rows.length - 1) + 18;
  const box = { fill: 'var(--bg)', stroke: 'var(--ink)', strokeWidth: 1.5 };
  const txt = { fill: 'var(--ink)', fontSize: 13, textAnchor: 'middle' };

  return (
    <div className="scroll chart">
      <svg viewBox={`0 0 700 ${H}`} width="100%" style={{ minWidth: 500, maxWidth: 780, display: 'block' }} role="img"
        aria-label={`Grover circuit on ${n} qubits: Hadamards, then oracle and diffusion repeated ${k} times, then measurement`}>
        {rows.map((r, i) => (
          <g key={i}>
            {r === '…' ? (
              <text x="150" y={yOf(i) + 6} style={{ ...txt, fill: 'var(--muted)' }}>⋮</text>
            ) : (
              <>
                <text x="8" y={yOf(i) + 5} style={{ fill: 'var(--muted)', fontSize: 13 }}>q{r} |0⟩</text>
                <line x1="62" x2="670" y1={yOf(i)} y2={yOf(i)} style={{ stroke: 'var(--muted)', strokeWidth: 1 }} />
                <rect x="84" y={yOf(i) - 15} width="30" height="30" rx="2" style={box} />
                <text x="99" y={yOf(i) + 5} style={txt}>H</text>
                {/* measurement */}
                <rect x="618" y={yOf(i) - 15} width="34" height="30" rx="2" style={box} />
                <path d={`M 624 ${yOf(i) + 7} A 11 11 0 0 1 646 ${yOf(i) + 7}`} style={{ fill: 'none', stroke: 'var(--ink)', strokeWidth: 1.3 }} />
                <line x1="635" y1={yOf(i) + 7} x2="644" y2={yOf(i) - 6} style={{ stroke: 'var(--ink)', strokeWidth: 1.3 }} />
              </>
            )}
          </g>
        ))}
        {/* oracle */}
        <rect x="170" y={y0} width="130" height={y1 - y0} rx="2" style={{ ...box, stroke: 'var(--hit)' }} />
        <text x="235" y={(y0 + y1) / 2 - 4} style={txt}>Oracle U<tspan baselineShift="sub" fontSize="10">f</tspan></text>
        <text x="235" y={(y0 + y1) / 2 + 14} style={{ ...txt, fill: 'var(--muted)', fontSize: 11 }}>flip secret's sign</text>
        {/* diffusion */}
        <rect x="330" y={y0} width="150" height={y1 - y0} rx="2" style={{ ...box, stroke: 'var(--accent)' }} />
        <text x="405" y={(y0 + y1) / 2 - 4} style={txt}>Diffusion</text>
        <text x="405" y={(y0 + y1) / 2 + 14} style={{ ...txt, fill: 'var(--muted)', fontSize: 11 }}>2|s⟩⟨s| − I</text>
        {/* repeat bracket */}
        <path d={`M 160 ${y0 - 12} V ${y0 - 20} H 490 V ${y0 - 12}`} style={{ fill: 'none', stroke: 'var(--muted)', strokeWidth: 1.2 }} />
        <text x="325" y={y0 - 26} style={{ ...txt, fill: 'var(--muted)' }}>repeat {k} time{k === 1 ? '' : 's'}</text>
      </svg>
    </div>
  );
}
