import { Marked } from "marked";
import { slugForFile } from "~/shared/docs/manifest";

export type DocPage = {
  slug: string;
  file: string;
  title: string;
  description: string;
  headings: { id: string; text: string }[];
  html: string;
};

const marked = new Marked({ gfm: true });

const stripInline = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const decode = (text: string) =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const idFor = (text: string) =>
  decode(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Turn one docs/*.md file into a page: title from the H1, description from the first paragraph. */
export function renderDoc(file: string, markdown: string): DocPage {
  const source = markdown.replace(/\r\n/g, "\n");
  const title = /^#\s+(.+)$/m.exec(source)?.[1]?.trim() ?? file;
  const body = source.replace(/^#\s+.+\n+/m, "");
  const firstParagraph = body.split(/\n{2,}/).find((block) => block.trim() && !/^[#|>`\-*\d]/.test(block.trim())) ?? "";
  let description = stripInline(firstParagraph);
  if (description.length > 160) description = `${description.slice(0, 157).replace(/\s+\S*$/, "")}…`;

  const headings: DocPage["headings"] = [];
  let html = marked.parse(body, { async: false });
  html = html
    .replace(/href="(?:\.\/)?([A-Za-z]+)\.md(#[^"]*)?"/g, (_m, name: string, hash?: string) => `href="/docs/${slugForFile(name)}${hash ?? ""}"`)
    .replace(/href="(https?:\/\/[^"]+)"/g, 'href="$1" target="_blank" rel="noopener noreferrer"')
    .replace(/<h([23])>(.*?)<\/h\1>/g, (_m, level: string, text: string) => {
      const id = idFor(text);
      if (level === "2") headings.push({ id, text: decode(text) });
      return `<h${level} id="${id}">${text}</h${level}>`;
    })
    .replace(/<table>/g, '<div class="docs-table"><table>')
    .replace(/<\/table>/g, "</table></div>");

  return { slug: slugForFile(file), file, title, description, headings, html };
}
