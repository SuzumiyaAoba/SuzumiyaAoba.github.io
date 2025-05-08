import { FC } from "react";

type CardProps = {
  title: string;
  href: string;
  description: string;
};

const Card: FC<CardProps> = ({ title, href, description }) => {
  return (
    <a
      className="card p-6 transition-all duration-300 hover:transform hover:scale-[1.03]"
      href={href}
      style={{
        display: "block",
        backgroundColor: "var(--card-bg)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 20px -5px rgba(15, 23, 42, 0.14)",
        overflow: "hidden",
      }}
    >
      <h2
        className="mt-2 mb-6 text-xl font-bold text-center"
        style={{ color: "var(--accent-primary)" }}
      >
        {title}
      </h2>
      <div className="mx-4 my-6 text-sm" style={{ color: "var(--muted)" }}>
        {description}
      </div>
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
];

export default async function Home() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16 mt-16">
      <div className="grid sm:grid-cols-2 gap-8">
        {cards.map((props) => (
          <Card key={props.title} {...props} />
        ))}
      </div>
    </main>
  );
}
