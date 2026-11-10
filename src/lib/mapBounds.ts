type Bounds = [[number, number], [number, number]];

/** The language's configured map view, or a box around its places with some padding. */
export function boundsFor(map: { bounds?: Bounds } | null | undefined, places: { lat: number; lng: number }[]): Bounds {
  if (map?.bounds) return map.bounds;
  if (!places.length) return [[-30, 30], [40, 70]];
  const lats = places.map((p) => p.lat);
  const lngs = places.map((p) => p.lng);
  const pad = 4;
  return [
    [Math.min(...lngs) - pad, Math.min(...lats) - pad],
    [Math.max(...lngs) + pad, Math.max(...lats) + pad],
  ];
}
