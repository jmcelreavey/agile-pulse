import Link from "next/link";
import { DOC_PAGES } from "~/shared/docs/generated";
import { DOCS_GROUPS, slugForFile } from "~/shared/docs/manifest";
import classes from "~/app/styles/Docs.module.css";

const titleOf = (file: string) => DOC_PAGES.find((page) => page.file === file)?.title ?? file;

/** The docs layout: a grouped page list (collapsible on small screens) beside the content. */
function Groups({ current }: { current?: string }) {
  return (
    <>
      <Link href="/docs" className={classes.navLink} aria-current={current ? undefined : "page"}>
        Documentation home
      </Link>
      {DOCS_GROUPS.map((group) => (
        <div key={group.title}>
          <div className={classes.navGroupTitle}>{group.title}</div>
          {group.files.map((file) => {
            const slug = slugForFile(file);
            return (
              <Link key={slug} href={`/docs/${slug}`} className={classes.navLink} aria-current={slug === current ? "page" : undefined}>
                {titleOf(file)}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

/** The docs layout: a grouped page list beside the content, or a collapsed "Contents" on small screens. */
export function DocsShell({ current, children }: { current?: string; children: React.ReactNode }) {
  const currentTitle = DOC_PAGES.find((page) => page.slug === current)?.title;
  return (
    <div className={classes.layout}>
      <nav className={classes.nav} aria-label="Documentation">
        <details className={classes.navMobile}>
          <summary className={classes.navToggle}>Contents{currentTitle ? `: ${currentTitle}` : ""}</summary>
          <div className={classes.navGroups}>
            <Groups current={current} />
          </div>
        </details>
        <div className={classes.navDesktop}>
          <Groups current={current} />
        </div>
      </nav>
      <article className={classes.content}>{children}</article>
    </div>
  );
}
