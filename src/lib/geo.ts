import "server-only";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import world50 from "world-atlas/countries-50m.json";
import world110 from "world-atlas/countries-110m.json";

type Country = Feature<Geometry, { name: string }>;

const cache: Record<string, Country[]> = {};
/** Detailed outlines for small regions, lighter ones for continent-sized maps. */
function getCountries(detailed: boolean) {
  const key = detailed ? "50m" : "110m";
  if (!cache[key]) {
    const topo = (detailed ? world50 : world110) as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
    cache[key] = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features;
  }
  return cache[key];
}

export type MapPoint = { id: string; lat: number; lng: number };

/**
 * Projects the countries and places that fall inside `bounds` onto a width×height canvas.
 * Returns plain SVG path strings and pixel positions, so the page can draw a stylized map.
 */
export function buildMap(
  bounds: [[number, number], [number, number]],
  points: MapPoint[],
  width = 800,
  height = 560,
  highlight: string[] = [],
) {
  const [[w, s], [e, n]] = bounds;
  const box: Feature = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[[w, s], [w, n], [e, n], [e, s], [w, s]]],
    },
  };
  const projection = geoMercator().fitExtent(
    [
      [16, 16],
      [width - 16, height - 16],
    ],
    box,
  ).clipExtent([
    [0, 0],
    [width, height],
  ]);
  const path = geoPath(projection).digits(1);

  const shapes = getCountries(e - w < 45)
    .map((c) => ({ name: c.properties.name, d: path(c) ?? "" }))
    .filter((c) => c.d && c.d.length > 0);

  const placed = spread(
    points.map((p) => {
      const [x, y] = projection([p.lng, p.lat]) ?? [0, 0];
      return { id: p.id, x, y, tx: x, ty: y };
    }),
    width,
    height,
  ).map((p) => ({ id: p.id, x: r1(p.x), y: r1(p.y), tx: r1(p.tx), ty: r1(p.ty) }));

  return {
    width,
    height,
    countries: shapes.map((c) => ({ ...c, highlighted: highlight.includes(c.name) })),
    points: placed,
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Nudges markers that sit on top of each other (Madrid, Sevilla and Barcelona on a
 * world-sized map) apart, keeping (tx, ty) = the true location for a leader line.
 */
function spread<T extends { x: number; y: number; tx: number; ty: number }>(pts: T[], width: number, height: number, min = 58) {
  const out = pts.map((p) => ({ ...p }));
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 0.01) {
          dx = Math.cos(j * 2.4);
          dy = Math.sin(j * 2.4);
          d = 1;
        }
        const push = (min - d) / 2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
        moved = true;
      }
    }
    for (const p of out) {
      p.x = Math.min(width - 30, Math.max(30, p.x));
      p.y = Math.min(height - 40, Math.max(30, p.y));
    }
    if (!moved) break;
  }
  return out;
}
