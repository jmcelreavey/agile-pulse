/**
 * Converts hash-based lists to proper HTML lists
 * # item -> <ol><li>item</li></ol> (numbered)
 * ## item -> nested numbered sub-list
 * ### item -> nested numbered sub-sub-list
 */
function convertHashListsToHtml(html: string): string {
  const lines = html.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line) {
      result.push(line || "");
      i++;
      continue;
    }

    // Check if this line starts a hash-based list (support up to 6 levels)
    const hashRegex = /^(\s*)(#{1,6})\s+(.+)$/;
    const hashMatch = hashRegex.exec(line);
    if (hashMatch) {
      const [, indent, hashes, content] = hashMatch;
      if (hashes === undefined || content === undefined) {
        result.push(line);
        i++;
        continue;
      }

      // Collect all consecutive list items at this level and deeper
      const listItems: Array<{
        indent: string;
        level: number;
        content: string;
        isNumbered: boolean;
      }> = [];
      let j = i;

      while (j < lines.length) {
        const currentLine = lines[j];
        if (!currentLine?.trim()) {
          j++;
          continue;
        }

        const currentRegex = /^(\s*)(#{1,6})\s+(.+)$/;
        const currentMatch = currentRegex.exec(currentLine);
        if (!currentMatch) break;

        const [, currentIndent, currentHashes, currentContent] = currentMatch;
        if (currentHashes === undefined || currentContent === undefined) break;

        const currentLevel = currentHashes.length;
        const currentIsNumbered = currentHashes === "#";

        // Stop if we encounter a different base indent level (but allow same or deeper)
        if (currentIndent && indent && currentIndent.length < indent.length)
          break;

        listItems.push({
          indent: currentIndent || "",
          level: currentLevel,
          content: currentContent,
          isNumbered: currentIsNumbered,
        });
        j++;
      }

      // Convert collected items to nested HTML lists
      const htmlList = convertItemsToNestedList(listItems);
      result.push(htmlList);
      i = j;
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join("\n");
}

/**
 * Converts a flat array of list items to nested HTML lists
 */
function convertItemsToNestedList(
  items: Array<{
    indent: string;
    level: number;
    content: string;
    isNumbered: boolean;
  }>
): string {
  if (items.length === 0) return "";

  const result: string[] = [];
  let currentLevel = 0;
  const openTags: string[] = [];

  for (const item of items) {
    if (!item) continue;

    const targetLevel = item.level;

    // Close lists if we're going to a shallower level
    while (currentLevel > targetLevel) {
      const closingTag = openTags.pop();
      if (closingTag) {
        result.push(`</${closingTag}>`);
      }
      currentLevel--;
    }

    // Open new lists if we're going to a deeper level
    while (currentLevel < targetLevel) {
      currentLevel++;
      // Use numbered lists (ol) for all levels of hash-based lists
      // Different numbering styles for different levels
      const listType = "ol";
      const listStyle = getListStyle(currentLevel);
      result.push(
        `<${listType} style="margin: 8px 0; padding-left: 20px; ${listStyle}">`
      );
      openTags.push("ol");
    }

    // Add the list item
    result.push(`<li style="margin-bottom: 4px;">${item.content}</li>`);
  }

  // Close all remaining open lists
  while (openTags.length > 0) {
    const closingTag = openTags.pop();
    if (closingTag) {
      result.push(`</${closingTag}>`);
    }
  }

  return result.join("");
}

/**
 * Gets the appropriate list style for different nesting levels
 */
function getListStyle(level: number): string {
  switch (level) {
    case 1:
      return "list-style-type: decimal;"; // 1, 2, 3
    case 2:
      return "list-style-type: lower-alpha;"; // a, b, c
    case 3:
      return "list-style-type: lower-roman;"; // i, ii, iii
    case 4:
      return "list-style-type: decimal;"; // 1, 2, 3 (repeat)
    case 5:
      return "list-style-type: lower-alpha;"; // a, b, c (repeat)
    case 6:
      return "list-style-type: lower-roman;"; // i, ii, iii (repeat)
    default:
      return "list-style-type: decimal;";
  }
}

/**
 * Converts basic markdown formatting to HTML
 * Specifically designed to handle JIRA-style markdown content
 * NO HEADERS - everything is kept as regular text with bold formatting
 */
export function markdownToHtml(markdown: string | null | undefined): string {
  if (!markdown) return "";

  // Debug: Log the raw content to see what we're working with
  console.log("🔍 Raw JIRA content:", JSON.stringify(markdown, null, 2));

  let html = markdown;

  // STEP 1: Clean up JIRA-specific patterns first
  // Remove JIRA attachment references like [^filename.pdf]
  html = html.replace(/\[\^[^\]]+\]/g, "");

  // STEP 2: Handle lists FIRST (before bold text processing)
  html = convertHashListsToHtml(html);

  // Handle traditional numbered lists (1. 2. 3. etc)
  html = html.replace(
    /^(\s*)(\d+)\.\s+(.+)$/gm,
    (match: string, indent: string, num: string, content: string) => {
      const indentPx = indent.length * 15;
      return `<div style="margin-left: ${indentPx}px; margin-bottom: 8px;"><strong>${num}.</strong> ${content}</div>`;
    }
  );

  // Handle traditional lettered sub-lists (a. b. c. etc)
  html = html.replace(
    /^(\s*)([a-z])\.\s+(.+)$/gm,
    (match: string, indent: string, letter: string, content: string) => {
      const indentPx = (indent.length + 4) * 15;
      return `<div style="margin-left: ${indentPx}px; margin-bottom: 6px;"><strong>${letter}.</strong> ${content}</div>`;
    }
  );

  // Handle bullet points with proper HTML lists
  html = convertBulletPointsToHtml(html);

  // STEP 3: Handle bold text patterns (after lists are processed)
  // Handle **text** for bold
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");

  // Handle *text* for bold, but avoid bullet point conflicts
  // Since bullet points require a space after *, we can safely convert *text*
  // where there's no space immediately after the opening *
  html = html.replace(/\*([^\s*\n][^*\n]*?)\*/g, "<strong>$1</strong>");

  // STEP 4: Handle code formatting
  html = html.replace(
    /```([\s\S]*?)```/g,
    "<pre style='background: #f5f5f5; padding: 8px; border-radius: 4px;'><code>$1</code></pre>"
  );
  html = html.replace(
    /`(.*?)`/g,
    "<code style='background: #f5f5f5; padding: 2px 4px; border-radius: 3px;'>$1</code>"
  );

  // STEP 5: NO HEADER CONVERSION AT ALL
  // Everything that might look like a header becomes bold text instead

  // STEP 6: Handle links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  html = html.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // STEP 7: Handle line breaks and paragraphs
  // Split into lines and process
  const lines = html.split("\n").filter((line) => line.trim() !== "");

  // Join non-div lines with <br/>, but keep div lines separate
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    if (
      line.startsWith("<div") ||
      line.startsWith("<pre") ||
      line.startsWith("<ol") ||
      line.startsWith("<ul") ||
      line.startsWith("</ol") ||
      line.startsWith("</ul") ||
      line.startsWith("<li")
    ) {
      result.push(line);
    } else {
      // Regular text line
      result.push(line);
      // Add break if next line exists and isn't a div/pre
      const nextLine = lines[i + 1]?.trim();
      if (
        i < lines.length - 1 &&
        nextLine &&
        !nextLine.startsWith("<div") &&
        !nextLine.startsWith("<pre") &&
        !nextLine.startsWith("<ol") &&
        !nextLine.startsWith("<ul") &&
        !nextLine.startsWith("</ol") &&
        !nextLine.startsWith("</ul") &&
        !nextLine.startsWith("<li")
      ) {
        result.push("<br/>");
      }
    }
  }

  return result.join("");
}

/**
 * Detects if content is likely markdown vs HTML
 */
export function isMarkdownContent(content: string | null | undefined): boolean {
  if (!content) return false;

  // Check for markdown patterns that are unlikely to be in HTML
  const markdownPatterns = [
    /^\s*[*\-•◦]\s+/m, // Bullet points with *, -, •, or ◦
    /\*{1,2}[^*]+\*{1,2}/, // Bold text with asterisks
    /^#+\s+/m, // Headers with # or hash-based numbered lists
    /^##\s+/m, // Hash-based lettered lists
    /`[^`]+`/, // Inline code
    /```[\s\S]*?```/, // Code blocks
    /\[[^\]]+\]\([^)]+\)/, // Markdown links
  ];

  // Check for HTML patterns
  const htmlPatterns = [
    /<[^>]+>/, // Any HTML tag
    /&[a-zA-Z]+;/, // HTML entities
  ];

  const hasMarkdownPatterns = markdownPatterns.some((pattern) =>
    pattern.test(content)
  );
  const hasHtmlPatterns = htmlPatterns.some((pattern) => pattern.test(content));

  // If it has HTML patterns and no markdown patterns, it's likely HTML
  if (hasHtmlPatterns && !hasMarkdownPatterns) {
    return false;
  }

  // If it has markdown patterns, it's likely markdown
  if (hasMarkdownPatterns) {
    return true;
  }

  // Default to treating as markdown if uncertain (since JIRA often provides markdown)
  return false;
}

/**
 * Converts various bullet point formats to proper HTML lists
 * Handles: *, **, -, •, ◦ with proper nesting
 */
function convertBulletPointsToHtml(html: string): string {
  const lines = html.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line) {
      result.push(line || "");
      i++;
      continue;
    }

    // Check if this line starts a bullet list
    // Matches: *, **, -, •, ◦ followed by space and content
    const bulletRegex = /^(\s*)([*-]{1,2}|•|◦)\s+(.+)$/;
    const bulletMatch = bulletRegex.exec(line);
    if (bulletMatch) {
      const [, indent, bullets, content] = bulletMatch;
      if (bullets === undefined || content === undefined) {
        result.push(line);
        i++;
        continue;
      }

      // Collect all consecutive bullet items
      const listItems: Array<{
        indent: string;
        level: number;
        content: string;
        bulletType: string;
      }> = [];
      let j = i;

      while (j < lines.length) {
        const currentLine = lines[j];
        if (!currentLine?.trim()) {
          j++;
          continue;
        }

        const currentRegex = /^(\s*)([*-]{1,2}|•|◦)\s+(.+)$/;
        const currentMatch = currentRegex.exec(currentLine);
        if (!currentMatch) break;

        const [, currentIndent, currentBullets, currentContent] = currentMatch;
        if (currentBullets === undefined || currentContent === undefined) break;

        // Determine nesting level based on bullet type and indentation
        let currentLevel = 1;

        // ◦ and ** are sub-bullets (level 2)
        if (currentBullets === "◦" || currentBullets === "**") {
          currentLevel = 2;
        }
        // • and * are main bullets (level 1)
        else if (currentBullets === "•" || currentBullets === "*") {
          currentLevel = 1;
        }
        // - can be either level 1 or 2 depending on indentation
        else if (currentBullets === "-") {
          currentLevel = 1;
        }

        // Add indentation-based nesting
        if (currentIndent && currentIndent.length > 0) {
          currentLevel += Math.floor(currentIndent.length / 2);
        }

        // Stop if we encounter a different base indent level (but allow same or deeper)
        if (currentIndent && indent && currentIndent.length < indent.length)
          break;

        listItems.push({
          indent: currentIndent || "",
          level: currentLevel,
          content: currentContent,
          bulletType: currentBullets,
        });
        j++;
      }

      // Convert collected items to nested HTML lists
      const htmlList = convertBulletListToNestedHtml(listItems);
      result.push(htmlList);
      i = j;
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join("\n");
}

/**
 * Converts bullet list items to nested HTML lists
 */
function convertBulletListToNestedHtml(
  items: Array<{
    indent: string;
    level: number;
    content: string;
    bulletType: string;
  }>
): string {
  if (items.length === 0) return "";

  const result: string[] = [];
  let currentLevel = 0;
  const openTags: string[] = [];

  for (const item of items) {
    if (!item) continue;

    const targetLevel = item.level;

    // Close lists if we're going to a shallower level
    while (currentLevel > targetLevel) {
      const closingTag = openTags.pop();
      if (closingTag) {
        result.push(`</${closingTag}>`);
      }
      currentLevel--;
    }

    // Open new lists if we're going to a deeper level
    while (currentLevel < targetLevel) {
      currentLevel++;
      // Use unordered lists for bullet points with proper styling
      result.push(
        `<ul style="margin: 8px 0; padding-left: 20px; list-style-type: ${getBulletStyle(
          currentLevel
        )};">`
      );
      openTags.push("ul");
    }

    // Add the list item
    result.push(`<li style="margin-bottom: 4px;">${item.content}</li>`);
  }

  // Close all remaining open lists
  while (openTags.length > 0) {
    const closingTag = openTags.pop();
    if (closingTag) {
      result.push(`</${closingTag}>`);
    }
  }

  return result.join("");
}

/**
 * Gets the appropriate bullet style for different nesting levels
 */
function getBulletStyle(level: number): string {
  switch (level) {
    case 1:
      return "disc"; // • (filled circle)
    case 2:
      return "circle"; // ◦ (hollow circle)
    case 3:
      return "square"; // ■ (square)
    default:
      return "disc";
  }
}
