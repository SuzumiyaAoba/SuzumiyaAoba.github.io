import { FC } from "react";

type CardProps = {
  title: string;
  href: string;
  description: string;
};

const Card: FC<CardProps> = ({ title, href, description }) => {
  return (
    <a
      className="border-rounded-lg bg-slate-100 hover:bg-slate-200"
      href={href}
    >
      <h2 className="mt-4 mb-6 text-lg font-bold text-center">{title}</h2>
      <div className="mx-4 my-6 text-sm">{description}</div>
    </a>
  );
};

const cards: CardProps[] = [
  {
    title: "ブログ",
    href: "/blog/",
    description: "プログラミングを中心に散文を。",
  },
  {
    title: "Notes",
    href: "/notes/",
    description: "まとまった文章を。",
  },
];

export default async function Home() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16 mt-16">
      <div className="grid sm:grid-cols-2 gap-8">
        {cards.map((props) => (
          <Card {...props} />
        ))}
      </div>
    </main>
  );
}
