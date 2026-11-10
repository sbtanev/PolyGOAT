import "server-only";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-50m.json";

type Country = Feature<Geometry, { name: string }>;

let countries: Country[] | null = null;
function getCountries() {
  if (!countries) {
    const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
    countries = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features;
  }
  return countries;
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
  const path = geoPath(projection);

  const shapes = getCountries()
    .map((c) => ({ name: c.properties.name, d: path(c) ?? "" }))
    .filter((c) => c.d && c.d.length > 0);

  const placed = points.map((p) => {
    const [x, y] = projection([p.lng, p.lat]) ?? [0, 0];
    return { id: p.id, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });

  return {
    width,
    height,
    countries: shapes.map((c) => ({ ...c, highlighted: highlight.includes(c.name) })),
    points: placed,
  };
}
