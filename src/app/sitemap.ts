import { type MetadataRoute } from "next";
import { site } from "~/shared/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/sign-in`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
