import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import config from "@/config";

// メタデータ
export const metadata: Metadata = {
  title: `About | ${config.metadata.title}`,
  description: "プロフィールとブログについての情報です。",
  keywords: [
    ...(config.metadata.keywords || []),
    "プロフィール",
    "About",
    "自己紹介",
  ],
  alternates: {
    canonical: `${config.metadata.url}/about/`,
  },
  openGraph: {
    title: "About Me",
    description: "プロフィールとブログについての情報です。",
    url: `${config.metadata.url}/about/`,
    siteName: config.metadata.title,
    locale: "ja_JP",
    type: "article",
    images: [
      {
        url: `${config.metadata.url}/about/opengraph-image.svg`,
        width: 1200,
        height: 630,
        alt: "About Me",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Me",
    description: "プロフィールとブログについての情報です。",
    creator: config.metadata.twitterHandle,
    images: [`${config.metadata.url}/about/twitter-image.svg`],
  },
};

type AboutSectionProps = {
  title: string;
  children: React.ReactNode;
};

const AboutSection = ({ title, children }: AboutSectionProps) => (
  <section className="mb-8">
    <h2 className="mb-4 text-2xl font-bold">{title}</h2>
    <div className="leading-relaxed">{children}</div>
  </section>
);

export default async function About() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl font-bold">About Me</h1>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="w-full md:w-1/3 flex justify-center">
          {/* プロフィール画像をここに配置 */}
          <div
            className="w-48 h-48 relative rounded-full overflow-hidden border-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center text-gray-400"
              style={{ backgroundColor: "var(--background-secondary)" }}
            >
              <Image
                src="/assets/profile.jpg"
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <AboutSection title="プロフィール">
            <p className="mb-4">
              ソフトウェアエンジニア。このブログでは、技術的な知見や学んだことを共有。
            </p>
          </AboutSection>

          <div className="mt-6">
            <ul className="flex gap-5">
              <li>
                <Link
                  href="https://x.com/SuzumiyaAoba/"
                  className="flex items-center justify-center w-12 h-12 rounded-full transition-colors"
                  style={{ backgroundColor: "var(--background-secondary)" }}
                  aria-label="X (Twitter)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="i-simple-icons-x text-2xl"></i>
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/SuzumiyaAoba/"
                  className="flex items-center justify-center w-12 h-12 rounded-full transition-colors"
                  style={{ backgroundColor: "var(--background-secondary)" }}
                  aria-label="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="i-simple-icons-github text-2xl"></i>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <AboutSection title="このブログについて">
        <p className="mb-4">
          このブログは、私が日々学んでいる技術的なトピックや、プロジェクトの経験から得た知見を共有する場です。
        </p>
        <p>記事の内容に関するフィードバックはコメント欄からお願いします。</p>
      </AboutSection>

      <AboutSection title="お問い合わせ">
        <p>
          サイトに関するお問い合わせやアポイントメントは
          <Link href="/contact" className="text-blue-500 hover:underline">
            お問い合わせフォーム
          </Link>
          からメッセージをお送りください。
        </p>
      </AboutSection>
    </main>
  );
}
