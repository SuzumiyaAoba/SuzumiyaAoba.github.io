"use client";

import { FC } from "react";
import Image from "next/image";
import config from "@/config";
import { cn } from "@/libs/utils";

export interface AuthorInfoProps {
  /** 著者名（デフォルトは設定から取得） */
  author?: string;
  /** 追加のクラス名 */
  className?: string;
}

export const AuthorInfo: FC<AuthorInfoProps> = ({
  author = config.metadata.author,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-xl p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-102",
        className
      )}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border)",
        border: "1px solid",
      }}
    >
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full translate-y-12 -translate-x-12 blur-xl" />

      <div className="relative flex items-start gap-6">
        {/* プロフィール画像エリア */}
        <div className="flex-shrink-0">
          <div className="relative">
            {/* メインアバター - 実際のプロフィール画像を使用 */}
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl ring-4 ring-white/20 dark:ring-gray-700/20">
              <Image
                src="/assets/profile.jpg"
                alt={`${author}のプロフィール画像`}
                width={80}
                height={80}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            {/* オンラインステータス風装飾 */}
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 flex items-center justify-center"
              style={{ borderColor: "var(--background)" }}
            >
              <span className="i-mdi-check text-white text-xs" />
            </div>
          </div>
        </div>

        {/* 著者情報メインエリア */}
        <div className="flex-1 min-w-0">
          {/* 名前とタイトル */}
          <div className="mb-4">
            <h3
              className="text-xl font-bold mb-1 flex items-center gap-2"
              style={{ color: "var(--foreground)" }}
            >
              {author}
              <span className="i-mdi-verified text-blue-500 text-lg" />
            </h3>
          </div>

          {/* 自己紹介 */}
          <p
            className="text-sm mb-4 leading-relaxed p-3 rounded-lg"
            style={{
              color: "var(--muted)",
              backgroundColor: "var(--background-secondary)",
            }}
          >
            プログラミング、技術、その他の話題について共有するブログを書いてます。
            主にScala、Java、TypeScriptなどの技術について興味あり。
          </p>

          {/* 技術スタック */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full flex items-center gap-1">
                <span className="i-logos-scala text-sm" />
                Scala
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full flex items-center gap-1">
                <span className="i-logos-java text-sm" />
                Java
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full flex items-center gap-1">
                <span className="i-logos-typescript-icon text-sm" />
                TypeScript
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded-full flex items-center gap-1">
                <span className="i-logos-react text-sm" />
                React
              </span>
            </div>
          </div>

          {/* SNSリンクとコンタクト */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href={`https://twitter.com/${config.metadata.twitterHandle.replace(
                  "@",
                  ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:scale-105 hover:shadow-lg"
                aria-label="Twitterプロフィール"
              >
                <span className="i-mdi-twitter text-base" />
                <span>Follow</span>
              </a>

              <a
                href="https://github.com/SuzumiyaAoba"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 bg-gray-800 text-white rounded-lg hover:bg-gray-900 hover:scale-105 hover:shadow-lg dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
                aria-label="GitHubプロフィール"
              >
                <span className="i-mdi-github text-base" />
                <span>GitHub</span>
              </a>
            </div>

            {/* 追加のアクション */}
            <div className="flex items-center gap-2">
              <button
                className="p-2 transition-colors rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ec4899";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--muted)";
                }}
                aria-label="お気に入りに追加"
              >
                <span className="i-mdi-heart-outline text-lg" />
              </button>
              <button
                className="p-2 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--muted)";
                }}
                aria-label="シェア"
              >
                <span className="i-mdi-share-variant text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
