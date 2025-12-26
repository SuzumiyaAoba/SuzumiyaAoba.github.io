"use client";

import { FC } from "react";
import { DevelopmentOnly } from "@/components/DevelopmentOnly";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/libs/i18n/client";

type CardProps = {
  title: string;
  href: string;
  description: string;
};

const Card: FC<CardProps> = ({ title, href, description }) => {
  return (
    <a
      className="p-6 rounded-xl border border-text/10 transition-all duration-300 hover:transform hover:scale-[1.03]"
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

export default function Home() {
  const { language } = useLanguage();
  const { t } = useTranslation(language, "common");

  const cards: CardProps[] = [
    {
      title: t("pages.home.blog.title"),
      href: "/blog/",
      description: t("pages.home.blog.description"),
    },
    {
      title: t("pages.home.series.title"),
      href: "/series/",
      description: t("pages.home.series.description"),
    },
    {
      title: t("pages.home.tools.title"),
      href: "/tools/",
      description: t("pages.home.tools.description"),
    },
    {
      title: t("pages.home.keywords.title"),
      href: "/keywords/",
      description: t("pages.home.keywords.description"),
    },
  ];

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
