import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daree",
    short_name: "Daree",
    description: "Dare your friends. Prove yourself.",
    id: "/",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}

