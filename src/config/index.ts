/**
 * メインサイト設定
 */
export const siteConfig = {
  metadata: {
    title: "NO SEA. I SEE.",
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
    ogImage: "/opengraph-image", // 動的に生成されるOGP画像
  },
} as const satisfies SiteConfig;

type SiteConfig = {
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

// 後方互換性のためのデフォルトエクスポート
export default siteConfig;
