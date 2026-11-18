import { type MetadataRoute } from "next";
import { DOC_PAGES } from "~/shared/docs/generated";
import { site } from "~/shared/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/docs`, changeFrequency: "monthly", priority: 0.8 },
    ...DOC_PAGES.map((page) => ({ url: `${site.url}/docs/${page.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${site.url}/sign-in`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
