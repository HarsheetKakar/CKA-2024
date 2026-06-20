import './HelmCompass.css';

export interface HelmCompassProps {
  total: number;
  /** Ordered completion state per day (index 0 = day 1). */
  completed: boolean[];
  size?: number;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, rOut, a0);
  const p1 = polar(cx, cy, rOut, a1);
  const p2 = polar(cx, cy, rIn, a1);
  const p3 = polar(cx, cy, rIn, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${p3.x} ${p3.y}`,
    'Z',
  ].join(' ');
}

export function HelmCompass({ total, completed, size = 220 }: HelmCompassProps) {
  const cx = size / 2;
  const cy = size / 2;
  const rOut = size / 2 - 6;
  const rIn = rOut * 0.62;
  const gap = 3; // degrees between segments
  const seg = 360 / total;
  const doneCount = completed.filter(Boolean).length;

  return (
    <svg
      className="helm"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Voyage progress: ${doneCount} of ${total} ports charted`}
    >
      {/* spokes */}
      {Array.from({ length: total }, (_, i) => {
        const a = i * seg;
        const outer = polar(cx, cy, rOut, a);
        const inner = polar(cx, cy, rIn * 0.5, a);
        return (
          <line
            key={`spoke-${i}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            className="helm__spoke"
          />
        );
      })}

      {/* segments */}
      {Array.from({ length: total }, (_, i) => {
        const a0 = i * seg + gap / 2;
        const a1 = (i + 1) * seg - gap / 2;
        return (
          <path
            key={`seg-${i}`}
            d={arcPath(cx, cy, rIn, rOut, a0, a1)}
            className={`helm__seg ${completed[i] ? 'is-done' : ''}`}
          />
        );
      })}

      {/* outer ring */}
      <circle cx={cx} cy={cy} r={rOut} className="helm__ring" fill="none" />
      <circle cx={cx} cy={cy} r={rIn} className="helm__ring-inner" fill="none" />

      {/* hub */}
      <circle cx={cx} cy={cy} r={rIn * 0.46} className="helm__hub" />
      <text x={cx} y={cy - 4} className="helm__count" textAnchor="middle">
        {doneCount}
      </text>
      <text x={cx} y={cy + 14} className="helm__count-sub" textAnchor="middle">
        / {total} ports
      </text>
    </svg>
  );
}
