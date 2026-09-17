interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  /** Draw evenly spaced tick marks around the ring (precision-gauge look). */
  ticks?: number;
  /** Emphasize the arc with a soft glow (used for the running/complete timer). */
  glow?: boolean;
  children?: React.ReactNode;
}

/**
 * Circular progress gauge. Optional tick marks and glow turn it into a
 * precision instrument for the timer; without them it stays a clean stat ring.
 * The arc transition is intentionally quick and eased — no bounce.
 */
export default function ProgressRing({
  percent,
  size = 96,
  strokeWidth = 6,
  color = 'var(--color-accent)',
  trackColor = 'var(--color-border)',
  ticks = 0,
  glow = false,
  children,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const tickMarks = [];
  if (ticks > 0) {
    const tickOuter = radius + strokeWidth / 2 + 3;
    const tickInner = tickOuter - 5;
    for (let i = 0; i < ticks; i++) {
      const angle = (i / ticks) * 2 * Math.PI - Math.PI / 2;
      const major = i % 5 === 0;
      tickMarks.push(
        <line
          key={i}
          x1={center + Math.cos(angle) * tickInner}
          y1={center + Math.sin(angle) * tickInner}
          x2={center + Math.cos(angle) * tickOuter}
          y2={center + Math.sin(angle) * tickOuter}
          stroke="var(--color-border-strong)"
          strokeWidth={major ? 1.5 : 0.75}
          opacity={major ? 0.9 : 0.5}
        />,
      );
    }
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="presentation" aria-hidden="true">
        {tickMarks}
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset var(--dur-slow) var(--ease-out), stroke var(--dur-base) var(--ease-out)',
            filter: glow ? `drop-shadow(0 0 6px ${color})` : undefined,
          }}
        />
      </svg>
      {children ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
