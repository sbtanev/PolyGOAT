import { Goat } from "./Goat";
import { buildMap } from "@/lib/geo";

export type JourneyStop = { id: string; name: string; lat: number; lng: number; unlocked: boolean; href?: string };

/** Stylized SVG map with the route between places and the goat at the furthest unlocked stop. */
export function JourneyMap({
  bounds,
  stops,
  accessory,
  highlight = [],
  height = 560,
}: {
  bounds: [[number, number], [number, number]];
  stops: JourneyStop[];
  accessory?: string | null;
  highlight?: string[];
  height?: number;
}) {
  const map = buildMap(bounds, stops, 800, height, highlight);
  const pts = map.points;
  const lastUnlocked = stops.reduce((acc, s, i) => (s.unlocked ? i : acc), -1);

  // gentle curve between consecutive stops
  const segment = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - Math.min(60, Math.hypot(b.x - a.x, b.y - a.y) / 5);
    return `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`;
  };

  return (
    <svg viewBox={`0 0 ${map.width} ${map.height}`} className="h-auto w-full rounded-3xl bg-[#17223b]" role="img" aria-label="Journey map">
      <defs>
        <pattern id="waves" width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6 Q6 2 12 6 T24 6" stroke="#22304f" strokeWidth="1.2" fill="none" />
        </pattern>
      </defs>
      <rect width={map.width} height={map.height} fill="url(#waves)" />
      <g stroke="#14111f" strokeWidth="0.8" strokeLinejoin="round">
        {map.countries.map((c) => (
          <path key={c.name} d={c.d} fill={c.highlighted ? "#3b3358" : "#2a2440"} />
        ))}
      </g>

      {pts.slice(1).map((p, i) => (
        <path
          key={`seg-${i}`}
          d={segment(pts[i], p)}
          fill="none"
          stroke={i < lastUnlocked ? "#f2c84b" : "#6b6385"}
          strokeWidth="3"
          strokeDasharray={i < lastUnlocked ? "0" : "3 8"}
          strokeLinecap="round"
        />
      ))}

      {stops.map((s, i) => {
        const p = pts[i];
        const nudged = Math.hypot(p.x - p.tx, p.y - p.ty) > 2;
        const marker = (
          <g>
            {nudged && (
              <>
                <line x1={p.tx} y1={p.ty} x2={p.x} y2={p.y} stroke="#f6f1e7" strokeOpacity="0.5" strokeWidth="1.5" />
                <circle cx={p.tx} cy={p.ty} r="3.5" fill="#f6f1e7" />
              </>
            )}
          <g transform={`translate(${p.x} ${p.y})`}>
            <circle r="15" fill={s.unlocked ? "#f2c84b" : "#3a3354"} stroke="#14111f" strokeWidth="3" />
            <text textAnchor="middle" dy="5" fontSize="14" fontWeight="800" fill={s.unlocked ? "#14111f" : "#a7a0bb"}>
              {s.unlocked ? i + 1 : "🔒"}
            </text>
            <text
              textAnchor="middle"
              y="34"
              fontSize="15"
              fontWeight="800"
              fill="#f6f1e7"
              stroke="#14111f"
              strokeWidth="4"
              paintOrder="stroke"
            >
              {s.name}
            </text>
          </g>
          </g>
        );
        return s.href ? (
          <a key={s.id} href={s.href} aria-label={s.name}>
            {marker}
          </a>
        ) : (
          <g key={s.id}>{marker}</g>
        );
      })}

      {lastUnlocked >= 0 && (
        <g transform={`translate(${pts[lastUnlocked].x - 34} ${pts[lastUnlocked].y - 82})`}>
          <Goat accessory={accessory} size={68} />
        </g>
      )}
    </svg>
  );
}
