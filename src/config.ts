export default {
  metadata: {
    title: "All You Need Is",
    description:
      "プログラミング、技術、その他の話題について共有するブログです。",
    url: "https://suzumiyaaoba.com",
    author: "SuzumiyaAoba",
    twitterHandle: "@SuzumiyaAoba",
    keywords: [
      "プログラミング",
      "技術ブログ",
      "開発",
      "Web開発",
      "Scala",
      "Java",
      "TypeScript",
    ],
    ogImage: "/assets/ogp-default.png", // デフォルトのOGP画像（作成が必要）
  },
} satisfies Config;

type Config = {
  metadata: {
    title: string;
    description: string;
    url: string;
    author: string;
    twitterHandle: string;
    keywords: string[];
    ogImage: string;
  };
};
