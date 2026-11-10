import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PolyGOAT",
    short_name: "PolyGOAT",
    description: "Learn languages with friends. Become the GOAT.",
    start_url: "/home",
    display: "standalone",
    background_color: "#14111f",
    theme_color: "#14111f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
