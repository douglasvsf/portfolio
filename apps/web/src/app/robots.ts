import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /api são rotas de dados (e o túnel do Sentry) e /admin é o painel privado: nada a indexar.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
