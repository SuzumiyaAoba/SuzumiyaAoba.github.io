import {
  AppWindow,
  AudioLines,
  Blocks,
  Brain,
  ChartNoAxesCombined,
  Clapperboard,
  CodeXml,
  Database,
  FlaskConical,
  Folder,
  Globe,
  LayoutGrid,
  Library,
  LibraryBig,
  Mail,
  MessagesSquare,
  Palette,
  Plug,
  ScanSearch,
  ScreenShare,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS = new Map<string, LucideIcon>([
  ["金融・投資", ChartNoAxesCombined],
  ["AIチャット", MessagesSquare],
  ["動画生成", Clapperboard],
  ["メール", Mail],
  ["音声生成", AudioLines],
  ["OSINT", ScanSearch],
  ["開発ツール", CodeXml],
  ["API連携", Plug],
  ["AIメモリ", Brain],
  ["AIフレームワーク", Workflow],
  ["AI研究", FlaskConical],
  ["データベース", Database],
  ["資料集", LibraryBig],
  ["画面キャプチャ", ScreenShare],
  ["デザイン", Palette],
  ["ライブラリ", Library],
  ["サービス", Globe],
  ["フレームワーク", Blocks],
  ["アプリケーション", AppWindow],
]);

export function CategoryIcon({ category }: { category?: string }) {
  const Icon = category === undefined ? LayoutGrid : (CATEGORY_ICONS.get(category) ?? Folder);

  return <Icon className="size-4 shrink-0" aria-hidden="true" />;
}
