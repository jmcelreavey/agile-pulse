/** The order and grouping of the pages in /docs. Each entry is a file in the repo's docs/ folder. */
export const DOCS_GROUPS = [
  { title: "Start here", files: ["Overview", "Configuration"] },
  { title: "Planning and tracking", files: ["Projects", "Sprints", "Chart", "Tasks", "Members", "Deadlines", "Snapshots", "Dashboard", "Archives"] },
  { title: "Insights", files: ["Forecast", "Standup", "Retro", "Planner"] },
  { title: "Sharing and integrations", files: ["CustomerPortal", "Changelogs", "Sharing", "Integrations", "MCP"] },
  { title: "Reference", files: ["Accessibility", "Authentication", "Architecture", "EmailTemplateSystem", "Glossary"] },
] as const;

/** "CustomerPortal" -> "customer-portal", "MCP" -> "mcp". */
export const slugForFile = (file: string) =>
  file
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
