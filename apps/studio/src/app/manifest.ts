import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "GooOS Studio & 3D Print Farm",
    short_name: "GooOS",
    description:
      "Platform terpadu operasional studio kreatif, produksi pesanan cetak 3D, inventaris filamen, dan monitoring printer",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#020617",
    theme_color: "#020617",
    lang: "id",
    dir: "ltr",
    categories: ["business", "productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Pesanan Cetak 3D",
        short_name: "Pesanan",
        url: "/orders",
        description: "Buka antrean pesanan dan status cetak",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Katalog Produk",
        short_name: "Katalog",
        url: "/products",
        description: "Katalog model dan rincian biaya HPP",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Inventaris Filamen",
        short_name: "Inventaris",
        url: "/inventory",
        description: "Pantau spul filamen dan sisa gramasi",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Armada Printer",
        short_name: "Printer",
        url: "/printers",
        description: "Monitoring printer Creality & Bambu Lab",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Kalkulator Produksi",
        short_name: "Kalkulator",
        url: "/calculator",
        description: "Kalkulator biaya cetak dan margin profit",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
