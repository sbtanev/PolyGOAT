import { Goat } from "./Goat";
import { getPreset } from "@/lib/avatars";

type Props = {
  url?: string | null;
  preset?: string | null;
  size?: number;
  online?: boolean;
  alt?: string;
};

export function Avatar({ url, preset, size = 48, online, alt = "" }: Props) {
  const p = getPreset(preset);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full rounded-full object-cover ring-2 ring-white/10"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-full ring-2 ring-white/10"
          style={{ background: p.background }}
        >
          <Goat accessory={p.accessory} fur={p.fur} size={size * 0.92} title={alt} />
        </span>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 block rounded-full bg-mint ring-2 ring-night"
          style={{ width: Math.max(10, size / 5), height: Math.max(10, size / 5) }}
        />
      )}
    </span>
  );
}
