import { marked } from "marked";

/**
 * Convert markdown content to HTML for use in rich text editors
 */
export function markdownToHtml(markdown: string): string {
  try {
    // Configure marked options for better HTML output
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub flavored markdown
    });

    // Convert markdown to HTML
    const html = marked(markdown);

    // Return the HTML string
    return typeof html === "string" ? html : "";
  } catch (error) {
    console.error("Error converting markdown to HTML:", error);
    // Fallback: return the original markdown with basic line break conversion
    return markdown.replace(/\n/g, "<br>");
  }
}

/**
 * Convert HTML content to markdown for storage/export
 */
export function htmlToMarkdown(html: string): string {
  try {
    // Basic HTML to markdown conversion
    // This is a simplified version - for more complex needs, consider using turndown
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1")
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1")
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1")
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1")
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
      .replace(/<i[^>]*>(.*?)<\/i>/gi, "_$1_")
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, "$1")
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, "$1")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<[^>]*>/g, "") // Remove any remaining HTML tags
      .trim();
  } catch (error) {
    console.error("Error converting HTML to markdown:", error);
    // Fallback: return the original HTML with tags stripped
    return html.replace(/<[^>]*>/g, "");
  }
}
