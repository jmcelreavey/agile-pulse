import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDocsModule } from "~/shared/docs/build";
import { DOC_PAGES } from "~/shared/docs/generated";
import { DOCS_GROUPS, slugForFile } from "~/shared/docs/manifest";
import { renderDoc } from "~/shared/docs/render";

const root = process.cwd();

describe("docs", () => {
  it("generated.ts is up to date with docs/*.md (run npm run docs:build)", () => {
    expect(readFileSync(join(root, "src/shared/docs/generated.ts"), "utf8")).toBe(buildDocsModule(root));
  });

  it("lists every markdown file in docs/", () => {
    const files = readdirSync(join(root, "docs")).filter((name) => name.endsWith(".md")).map((name) => name.replace(/\.md$/, ""));
    expect(DOCS_GROUPS.flatMap((group) => [...group.files]).sort()).toEqual(files.sort());
  });

  it("only links to pages that exist", () => {
    const slugs = new Set(DOC_PAGES.map((page) => page.slug));
    for (const page of DOC_PAGES) {
      for (const [, slug] of page.html.matchAll(/href="\/docs\/([a-z-]+)/g)) expect(slugs, `${page.file} links to ${slug}`).toContain(slug);
    }
  });

  it("makes slugs, titles, descriptions and heading anchors", () => {
    expect(slugForFile("CustomerPortal")).toBe("customer-portal");
    expect(slugForFile("MCP")).toBe("mcp");
    expect(slugForFile("EmailTemplateSystem")).toBe("email-template-system");
    const page = renderDoc("Example", "# Example page\n\nSee [the forecast](Forecast.md#how).\n\n## Set it up\n\n| a | b |\n| - | - |\n| 1 | 2 |\n");
    expect(page.title).toBe("Example page");
    expect(page.description).toBe("See the forecast.");
    expect(page.html).toContain('href="/docs/forecast#how"');
    expect(page.headings).toEqual([{ id: "set-it-up", text: "Set it up" }]);
    expect(page.html).toContain('<div class="docs-table"><table>');
  });
});
