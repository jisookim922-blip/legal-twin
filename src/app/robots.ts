import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://legal-twin.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/admin", "/settings", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
