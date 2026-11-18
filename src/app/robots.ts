import { type MetadataRoute } from "next";
import { site } from "~/shared/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/projects/", "/changelogs", "/customer/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
