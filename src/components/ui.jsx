export function PageHead({ title, children }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {children && <p className="lede">{children}</p>}
    </div>
  );
}

export function Stat({ value, label, className = '' }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <b className={className}>{value}</b>
    </div>
  );
}
