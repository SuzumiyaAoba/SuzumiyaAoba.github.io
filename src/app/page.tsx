"use client";

import { FC } from "react";
import dynamic from "next/dynamic";

// 開発環境でのみThemeTestコンポーネントを動的にインポート
const ThemeTest = dynamic(
  () => import("@/components/ui/ThemeTest").then((mod) => mod.ThemeTest),
  {
    ssr: false,
  },
);

type CardProps = {
  title: string;
  href: string;
  description: string;
};

const Card: FC<CardProps> = ({ title, href, description }) => {
  return (
    <a
      className="p-6 rounded-xl shadow-md border border-text/10 transition-all duration-300 hover:transform hover:scale-[1.03]"
      style={{ backgroundColor: "var(--card-bg)" }}
      href={href}
    >
      <h2 className="mt-2 mb-6 text-xl font-bold text-center text-primary">
        {title}
      </h2>
      <div className="mx-4 my-6 text-sm text-foreground/80">{description}</div>
    </a>
  );
};

const cards: CardProps[] = [
  {
    title: "✍️ Blog",
    href: "/blog/",
    description: "プログラミングを中心に散文を。",
  },
  {
    title: "📓 Notes",
    href: "/notes/",
    description: "まとまった文章を。",
  },
  {
    title: "🔧 Tools",
    href: "/tools/",
    description: "便利なツール集。",
  },
  {
    title: "🔍 Keywords",
    href: "/keywords/",
    description: "プログラミング用語の解説。",
  },
];

// ビルド時に評価される環境変数
const isDevelopment = process.env.NODE_ENV === "development";

export default function Home() {
  return (
    <main className="px-4 py-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
        {cards.map((props) => (
          <Card key={props.title} {...props} />
        ))}
      </div>

      {/* 開発環境でのみThemeTestコンポーネントをレンダリング */}
      {isDevelopment && (
        <>
          <div className="mt-16 mb-16">
            <ThemeTest />
          </div>
          <section
            className="mt-16 p-6 rounded-xl shadow-md border border-text/10 transition-all duration-300"
            style={{ backgroundColor: "var(--card-bg)" }}
          >
            <h2 className="text-2xl font-bold text-primary mb-4">
              UnoCSS + テーマ切り替えのテスト
            </h2>
            <p className="mb-4">
              このセクションは UnoCSS と next-themes
              を使用したテーマ切り替えの動作確認用です。
              ヘッダーのテーマトグルボタンをクリックして、ライト/ダークモードを切り替えてみてください。
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <button className="btn-primary">プライマリボタン</button>
              <button className="btn bg-background border border-text/20">
                デフォルトボタン
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
