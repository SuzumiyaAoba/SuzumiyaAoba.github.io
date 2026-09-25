import {
  Brain,
  Clapperboard,
  CodeXml,
  Database,
  FlaskConical,
  Folder,
  LayoutGrid,
  Palette,
  ScanSearch,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS = new Map<string, LucideIcon>([
  ["development", CodeXml],
  ["design", Palette],
  ["ai-agents", Workflow],
  ["ai-memory", Brain],
  ["data", Database],
  ["ai-research", FlaskConical],
  ["media", Clapperboard],
  ["research", ScanSearch],
]);

export function CategoryIcon({
  category,
  size = "small",
}: {
  category?: string;
  size?: "small" | "large";
}) {
  const Icon =
    category === undefined
      ? LayoutGrid
      : (CATEGORY_ICONS.get(category) ?? Folder);
  return (
    <Icon
      className={size === "large" ? "size-6 shrink-0" : "size-4 shrink-0"}
      aria-hidden="true"
    />
  );
}
