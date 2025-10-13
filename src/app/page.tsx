import { FC } from "react";
import { DevelopmentOnly } from "@/components/DevelopmentOnly";

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
    title: "📓 Series",
    href: "/series/",
    description: "連載記事のシリーズ。",
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

export default function Home() {
  return (
    <main className="px-4 py-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
        {cards.map((props) => (
          <Card key={props.title} {...props} />
        ))}
      </div>

      {/* 開発環境でのみ表示されるコンポーネント */}
      <DevelopmentOnly />
    </main>
  );
}