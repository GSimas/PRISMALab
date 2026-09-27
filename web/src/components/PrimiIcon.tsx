/**
 * Primi's own mark: a small prism-shaped character (Primi comes from PRISMA / prism)
 * with a spark of refracted light. Drawn in currentColor so it follows its container.
 */
export function PrimiIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`primi-icon ${className}`.trim()} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Head: a soft, slightly tilted prism, so it reads as a character rather than a warning sign. */}
      <g transform="rotate(-7 12 13)">
        <path d="M10.92 5.52Q12 3.6 13.08 5.52L19.92 17.68Q21 19.6 18.8 19.6H5.2Q3 19.6 4.08 17.68Z" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        {/* Eyes blink via CSS (see .primi-eye). */}
        <g fill="currentColor">
          <ellipse className="primi-eye" cx="9.6" cy="14.1" rx="1.2" ry="1.4" />
          <ellipse className="primi-eye" cx="14.4" cy="14.1" rx="1.2" ry="1.4" />
        </g>
        <path d="M10.5 16.9q1.5 1 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      {/* Spark: light leaving the prism. */}
      <path className="primi-spark" d="M18.6 2.2v3.2M17 3.8h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
