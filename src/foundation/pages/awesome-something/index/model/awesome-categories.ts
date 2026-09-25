import type { Locale } from "@/shared/lib/routing";

type LocalizedText = Record<Locale, string>;

export type AwesomeSubcategory = {
  id: string;
  name: LocalizedText;
};

export type AwesomeCategory = AwesomeSubcategory & {
  description: LocalizedText;
  subcategories: AwesomeSubcategory[];
};

/** 提供形態ではなく、探したい用途・分野を軸に分類する。 */
export const AWESOME_CATEGORIES: AwesomeCategory[] = [
  {
    id: "development",
    name: { ja: "開発・プログラミング", en: "Development & programming" },
    description: {
      ja: "コードを書く、読む、検証する。日々の開発を支えるツール。",
      en: "Tools for writing, understanding, and shipping better code.",
    },
    subcategories: [
      {
        id: "coding-agents",
        name: { ja: "AIコーディング", en: "AI coding agents" },
      },
      {
        id: "skills",
        name: { ja: "スキル・開発手法", en: "Skills & workflows" },
      },
      {
        id: "code-intelligence",
        name: { ja: "コード解析・検索", en: "Code intelligence" },
      },
      {
        id: "quality",
        name: { ja: "テスト・レビュー・品質", en: "Testing & code quality" },
      },
      {
        id: "environment",
        name: { ja: "IDE・ターミナル・ビルド", en: "IDEs, terminals & builds" },
      },
      {
        id: "libraries",
        name: { ja: "文書処理・汎用ライブラリ", en: "Documents & libraries" },
      },
      {
        id: "resources",
        name: { ja: "開発リソース集", en: "Developer resources" },
      },
    ],
  },
  {
    id: "design",
    name: { ja: "デザイン・UI", en: "Design & UI" },
    description: {
      ja: "画面のアイデアから実装まで。UIの部品、動き、デザインの指針。",
      en: "From inspiration to interfaces: components, motion, and design guidance.",
    },
    subcategories: [
      {
        id: "components",
        name: { ja: "UIコンポーネント", en: "UI components" },
      },
      {
        id: "design-systems",
        name: {
          ja: "デザインシステム・DESIGN.md",
          en: "Design systems & DESIGN.md",
        },
      },
      {
        id: "prototyping",
        name: { ja: "プロトタイピング・生成", en: "Prototyping & generation" },
      },
      {
        id: "motion",
        name: { ja: "アニメーション・視覚効果", en: "Motion & visual effects" },
      },
      {
        id: "inspiration",
        name: { ja: "作例・デザインスキル", en: "Inspiration & design skills" },
      },
    ],
  },
  {
    id: "ai-agents",
    name: { ja: "AI・エージェント", en: "AI & agents" },
    description: {
      ja: "AIと対話する、エージェントを作る、作業を自動化する。",
      en: "Chat with AI, build agents, and automate everyday work.",
    },
    subcategories: [
      {
        id: "frameworks",
        name: { ja: "エージェント開発基盤", en: "Agent frameworks" },
      },
      {
        id: "automation",
        name: { ja: "自動化・実行環境", en: "Automation & runtimes" },
      },
      {
        id: "chat",
        name: { ja: "チャット・アシスタント", en: "Chat & assistants" },
      },
    ],
  },
  {
    id: "ai-memory",
    name: { ja: "AIメモリ・ナレッジ", en: "AI memory & knowledge" },
    description: {
      ja: "会話や経験を記憶し、知識を蓄積・検索・共有する。",
      en: "Remember conversations and experience; organize, retrieve, and share knowledge.",
    },
    subcategories: [
      {
        id: "long-term",
        name: { ja: "長期メモリ基盤", en: "Long-term memory" },
      },
      {
        id: "coding-context",
        name: {
          ja: "開発コンテキスト・引き継ぎ",
          en: "Coding context & handoffs",
        },
      },
      {
        id: "knowledge",
        name: {
          ja: "ナレッジ管理・知識グラフ",
          en: "Knowledge bases & graphs",
        },
      },
      {
        id: "personalization",
        name: { ja: "パーソナライズ", en: "Personalization" },
      },
      {
        id: "resources",
        name: { ja: "メモリ関連の資料集", en: "Memory resources" },
      },
    ],
  },
  {
    id: "data",
    name: { ja: "データ・API", en: "Data & APIs" },
    description: {
      ja: "データを保存・管理し、APIや外部サービスをつなぐ。",
      en: "Store and manage data, and connect APIs and external services.",
    },
    subcategories: [
      {
        id: "databases",
        name: { ja: "データベース・SQL", en: "Databases & SQL" },
      },
      {
        id: "processing",
        name: { ja: "データ変換・処理", en: "Data conversion & processing" },
      },
      {
        id: "integrations",
        name: { ja: "API連携・MCP", en: "API integrations & MCP" },
      },
      {
        id: "directories",
        name: { ja: "公開API集", en: "Public API directories" },
      },
    ],
  },
  {
    id: "ai-research",
    name: { ja: "AI研究・モデル", en: "AI research & models" },
    description: {
      ja: "メモリや検索の研究実装、モデルの比較・学習を探る。",
      en: "Explore research on memory and retrieval, model comparison, and training.",
    },
    subcategories: [
      {
        id: "memory-retrieval",
        name: { ja: "メモリ・検索の研究", en: "Memory & retrieval research" },
      },
      {
        id: "simulation",
        name: { ja: "エージェントシミュレーション", en: "Agent simulation" },
      },
      {
        id: "models",
        name: { ja: "モデル比較・学習", en: "Model comparison & training" },
      },
    ],
  },
  {
    id: "media",
    name: { ja: "動画・音声・キャプチャ", en: "Video, audio & capture" },
    description: {
      ja: "動画や音声を作り、画面を記録・編集する。",
      en: "Create video and audio, and capture and edit your screen.",
    },
    subcategories: [
      {
        id: "video",
        name: { ja: "動画生成・編集", en: "Video creation & editing" },
      },
      { id: "audio", name: { ja: "音声合成", en: "Speech synthesis" } },
      { id: "capture", name: { ja: "画面キャプチャ", en: "Screen capture" } },
    ],
  },
  {
    id: "research",
    name: { ja: "調査・分析", en: "Research & analysis" },
    description: {
      ja: "市場や公開情報を収集し、関係を可視化して調べる。",
      en: "Research markets and public information, and visualize connections.",
    },
    subcategories: [
      {
        id: "finance",
        name: { ja: "金融・市場分析", en: "Finance & markets" },
      },
      {
        id: "osint",
        name: { ja: "公開情報の調査・OSINT", en: "Open-source intelligence" },
      },
    ],
  },
];

export function getAwesomeCategory(id: string) {
  return AWESOME_CATEGORIES.find((category) => category.id === id);
}

export function getAwesomePath(category: string, subcategory?: string) {
  const base = `/awesome-something/${category}`;
  return subcategory === undefined ? base : `${base}/${subcategory}`;
}

export type AwesomeSelection = {
  category?: AwesomeCategory;
  subcategory?: AwesomeSubcategory;
};

export function resolveAwesomeSelection(
  segments: string[]
): AwesomeSelection | undefined {
  const [categoryId, subcategoryId] = segments;
  if (segments.length === 1 && categoryId === "all") {
    return {};
  }
  if (categoryId === undefined || segments.length > 2) {
    return undefined;
  }
  const category = getAwesomeCategory(categoryId);
  if (!category) {
    return undefined;
  }
  if (subcategoryId === undefined) {
    return { category };
  }
  const subcategory = category.subcategories.find(
    (entry) => entry.id === subcategoryId
  );
  return subcategory ? { category, subcategory } : undefined;
}
