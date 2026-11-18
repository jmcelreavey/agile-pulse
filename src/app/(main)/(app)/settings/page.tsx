import type { Metadata } from "next";
import { SettingsView } from "~/app/views/lazy";

export const metadata: Metadata = { title: "API tokens & MCP", robots: { index: false } };

export default function SettingsPage() {
  return <SettingsView />;
}
