import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "~/app/components/docs/DocsShell";
import classes from "~/app/styles/Docs.module.css";
import { DOC_PAGES } from "~/shared/docs/generated";
import { site } from "~/shared/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = DOC_PAGES.find((p) => p.slug === slug);
  if (!page) return {};
  const url = `/docs/${page.slug}`;
  return {
    title: `${page.title} · Docs`,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: `${page.title} | ${site.name} docs`, description: page.description, url, type: "article" },
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const index = DOC_PAGES.findIndex((p) => p.slug === slug);
  const page = DOC_PAGES[index];
  if (!page) notFound();
  const previous = DOC_PAGES[index - 1];
  const next = DOC_PAGES[index + 1];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.title,
    description: page.description,
    url: `${site.url}/docs/${page.slug}`,
    author: { "@type": "Person", name: site.author.name },
  };
  return (
    <DocsShell current={page.slug}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.html }} />
      <nav className={classes.pager} aria-label="More docs">
        {previous ? <Link href={`/docs/${previous.slug}`}>← {previous.title}</Link> : <span />}
        {next ? <Link href={`/docs/${next.slug}`}>{next.title} →</Link> : <span />}
      </nav>
    </DocsShell>
  );
}
