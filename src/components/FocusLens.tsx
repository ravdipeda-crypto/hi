import './FocusLens.css';

type LensState = 'idle' | 'running' | 'paused' | 'done';

interface FocusLensProps {
  /** 0-100 fill level. */
  percent: number;
  size?: number;
  state?: LensState;
  /** 'drop' = teardrop (timer hero), 'round' = circular gauge (stats). */
  variant?: 'drop' | 'round';
  children?: React.ReactNode;
  className?: string;
}

/**
 * The Aqua Lens signature object: a translucent liquid lens that literally
 * fills with water as `percent` rises (a wavy meniscus crest included).
 * Purely presentational — used by the timer, Today context, and Progress.
 */
export default function FocusLens({
  percent,
  size = 220,
  state = 'idle',
  variant = 'round',
  children,
  className,
}: FocusLensProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`focus-lens variant-${variant} state-${state} ${className ?? ''}`}
      style={{ width: size, height: size }}
      role="presentation"
    >
      <div className="focus-lens-water" style={{ height: `calc(${clamped}% + 8px)` }} aria-hidden="true">
        <span className="crest crest-a" />
        <span className="crest crest-b" />
      </div>
      <div className="focus-lens-sheen" aria-hidden="true" />
      <div className="focus-lens-content">{children}</div>
    </div>
  );
}
