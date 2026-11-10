export type GoatAccessory =
  | "none"
  | "sombrero"
  | "beret"
  | "laurel"
  | "beanie"
  | "alpine"
  | "crown"
  | "headphones"
  | "martenitsa";

type Props = {
  accessory?: GoatAccessory | string | null;
  fur?: string;
  size?: number;
  className?: string;
  title?: string;
};

const INK = "#2B2235";

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amount));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** The PolyGOAT mascot. Original artwork drawn in SVG. */
export function Goat({ accessory = "none", fur = "#F1E4CF", size = 96, className, title }: Props) {
  const furDark = shade(fur, -40);
  const muzzle = shade(fur, 18);
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? "PolyGOAT goat"}
    >
      {/* horns */}
      <g stroke="#C9B18A" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M47 36 C41 19 29 14 21 22" />
        <path d="M73 36 C79 19 91 14 99 22" />
      </g>
      <g stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35">
        <path d="M40 24 l4 3 M33 19 l2 4" />
        <path d="M80 24 l-4 3 M87 19 l-2 4" />
      </g>

      {accessory === "headphones" && (
        <path d="M30 52 C30 18 90 18 90 52" stroke="#E5484D" strokeWidth="6" fill="none" />
      )}

      {/* ears */}
      <ellipse cx="25" cy="52" rx="15" ry="7" fill={fur} stroke={INK} strokeWidth="2.5" transform="rotate(-22 25 52)" />
      <ellipse cx="95" cy="52" rx="15" ry="7" fill={fur} stroke={INK} strokeWidth="2.5" transform="rotate(22 95 52)" />
      <ellipse cx="25" cy="52" rx="9" ry="3" fill="#F2A7A0" transform="rotate(-22 25 52)" />
      <ellipse cx="95" cy="52" rx="9" ry="3" fill="#F2A7A0" transform="rotate(22 95 52)" />

      {/* beard */}
      <path d="M52 90 Q60 114 68 90 Z" fill={furDark} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />

      {/* head */}
      <path
        d="M60 26 C80 26 90 40 89 58 C88 76 78 92 60 92 C42 92 32 76 31 58 C30 40 40 26 60 26 Z"
        fill={fur}
        stroke={INK}
        strokeWidth="2.5"
      />
      <path d="M52 30 Q60 36 68 30" stroke={furDark} strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* eyes with goat-style horizontal pupils */}
      <ellipse cx="47" cy="56" rx="7.5" ry="6.5" fill="#FFFDF7" stroke={INK} strokeWidth="2" />
      <ellipse cx="73" cy="56" rx="7.5" ry="6.5" fill="#FFFDF7" stroke={INK} strokeWidth="2" />
      <rect x="42" y="54.5" width="10" height="3.2" rx="1.6" fill={INK} />
      <rect x="68" y="54.5" width="10" height="3.2" rx="1.6" fill={INK} />

      {/* cheeks */}
      <circle cx="39" cy="68" r="4" fill="#F2A7A0" opacity="0.6" />
      <circle cx="81" cy="68" r="4" fill="#F2A7A0" opacity="0.6" />

      {/* muzzle */}
      <ellipse cx="60" cy="78" rx="17" ry="12" fill={muzzle} stroke={INK} strokeWidth="2.5" />
      <ellipse cx="54" cy="75" rx="2.2" ry="1.6" fill={INK} />
      <ellipse cx="66" cy="75" rx="2.2" ry="1.6" fill={INK} />
      <path d="M53 82 Q60 88 67 82" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />

      <Accessory kind={accessory ?? "none"} />
    </svg>
  );
}

function Accessory({ kind }: { kind: string }) {
  switch (kind) {
    case "sombrero":
      return (
        <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
          <ellipse cx="60" cy="32" rx="47" ry="8" fill="#E3A13B" />
          <path d="M42 32 Q43 7 60 7 Q77 7 78 32 Z" fill="#EDB64F" />
          <path d="M43 25 Q60 29 77 25" stroke="#C8423B" strokeWidth="5" fill="none" />
          <g fill="#3E8E6A" stroke="none">
            <circle cx="28" cy="33" r="2" />
            <circle cx="92" cy="33" r="2" />
            <circle cx="20" cy="33" r="1.5" />
            <circle cx="100" cy="33" r="1.5" />
          </g>
        </g>
      );
    case "beret":
      return (
        <g stroke={INK} strokeWidth="2.5">
          <ellipse cx="63" cy="29" rx="29" ry="11" fill="#2E3A5C" transform="rotate(-10 63 29)" />
          <path d="M64 18 l2 -6" strokeLinecap="round" />
        </g>
      );
    case "laurel":
      return (
        <g fill="#6BA368" stroke="#2E5E3A" strokeWidth="1.2">
          {[0, 1, 2, 3, 4].map((i) => {
            const t = i / 4;
            const x = 34 + t * 22;
            const y = 40 - Math.sin(t * Math.PI * 0.9) * 12 - t * 2;
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="6" ry="2.6" transform={`rotate(${-50 + t * 40} ${x} ${y})`} />
                <ellipse cx={120 - x} cy={y} rx="6" ry="2.6" transform={`rotate(${50 - t * 40} ${120 - x} ${y})`} />
              </g>
            );
          })}
          <circle cx="60" cy="26" r="2.5" fill="#E9C46A" />
        </g>
      );
    case "beanie":
      return (
        <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M35 38 Q36 9 60 9 Q84 9 85 38 Z" fill="#2F6FB3" />
          <rect x="33" y="31" width="54" height="9" rx="4.5" fill="#F4F6FB" />
          <path d="M47 18 h26 M44 25 h32" stroke="#F4F6FB" strokeWidth="3" />
          <circle cx="60" cy="8" r="6" fill="#F4F6FB" />
        </g>
      );
    case "alpine":
      return (
        <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
          <ellipse cx="60" cy="32" rx="32" ry="6" fill="#335C3E" />
          <path d="M43 32 Q45 11 60 11 Q75 11 77 32 Z" fill="#3E7049" />
          <path d="M44 27 Q60 31 76 27" stroke="#B5463C" strokeWidth="4" fill="none" />
          <path d="M74 25 Q90 8 86 2 Q80 12 72 23 Z" fill="#E9E1D2" strokeWidth="1.8" />
        </g>
      );
    case "crown":
      return (
        <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M40 34 L38 12 L50 22 L60 8 L70 22 L82 12 L80 34 Z" fill="#F2C84B" />
          <circle cx="60" cy="27" r="3" fill="#E5484D" />
          <circle cx="48" cy="29" r="2" fill="#4C8DF6" />
          <circle cx="72" cy="29" r="2" fill="#4C8DF6" />
        </g>
      );
    case "martenitsa":
      // red-and-white twisted cord tied around the horn, with the two tassel dolls
      return (
        <g>
          <path d="M28 22 Q36 30 44 28" stroke="#E5484D" strokeWidth="2.5" fill="none" strokeDasharray="3 3" />
          <path d="M28 22 Q36 30 44 28" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeDasharray="3 3" strokeDashoffset="3" />
          <g stroke={INK} strokeWidth="1.5">
            <circle cx="22" cy="34" r="4" fill="#FFFFFF" />
            <path d="M19 37 L17 47 L27 47 L25 37 Z" fill="#FFFFFF" />
            <circle cx="34" cy="36" r="4" fill="#E5484D" />
            <path d="M31 39 L29 49 L39 49 L37 39 Z" fill="#E5484D" />
          </g>
          <path d="M22 30 Q26 24 30 23 M34 32 Q36 27 36 26" stroke="#E5484D" strokeWidth="1.5" fill="none" />
        </g>
      );
    case "headphones":
      return (
        <g stroke={INK} strokeWidth="2.5">
          <rect x="22" y="44" width="12" height="20" rx="6" fill="#E5484D" />
          <rect x="86" y="44" width="12" height="20" rx="6" fill="#E5484D" />
        </g>
      );
    default:
      return null;
  }
}
