import { type Metadata } from "next";
import Link from "next/link";
import { DocsShell } from "~/app/components/docs/DocsShell";
import classes from "~/app/styles/Docs.module.css";
import { DOC_PAGES } from "~/shared/docs/generated";
import { DOCS_GROUPS, slugForFile } from "~/shared/docs/manifest";
import { site } from "~/shared/site";

const description =
  "How Agile Pulse works: the sprint chart, forecasts, standups, retros, the planner, GitHub and Jira sync, MCP, the customer portal, and why it's built the way it is.";

export const metadata: Metadata = {
  title: "Documentation",
  description,
  alternates: { canonical: "/docs" },
  openGraph: { title: `Documentation | ${site.name}`, description, url: "/docs", type: "website" },
};

export default function DocsHome() {
  return (
    <DocsShell>
      <h1>Agile Pulse documentation</h1>
      <p className={classes.lead}>
        Agile Pulse lays each sprint out as a chart of people against days. These pages cover every feature: what it does, how to use it, what to
        configure and why it works the way it does. New here? Start with the <Link href="/docs/overview">overview and rationale</Link>.
      </p>
      {DOCS_GROUPS.map((group) => (
        <section key={group.title}>
          <h2>{group.title}</h2>
          <div className={classes.cards}>
            {group.files.map((file) => {
              const page = DOC_PAGES.find((p) => p.file === file);
              if (!page) return null;
              return (
                <Link key={file} href={`/docs/${slugForFile(file)}`} className={classes.card}>
                  <strong>{page.title}</strong>
                  <span>{page.description}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </DocsShell>
  );
}
