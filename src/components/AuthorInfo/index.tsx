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
            <div
              className="w-20 h-20 rounded-full overflow-hidden shadow-xl"
              style={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 4px rgba(var(--border-rgb), 0.2)",
              }}
            >
              <Image
                src="/assets/profile.jpg"
                alt={`${author}のプロフィール画像`}
                width={80}
                height={80}
                className="object-cover w-full h-full"
                priority
              />
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
              <span
                className="i-mdi-verified text-xl"
                style={{ color: "#1d9bf0" }}
              />
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
              <span
                className="px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#ffffff",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <span
                  className="i-logos-scala text-base"
                  style={{ color: "#ffffff" }}
                />
                <span className="font-semibold">Scala</span>
              </span>
              <span
                className="px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(249, 115, 22, 0.15)",
                  color: "#ffffff",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                }}
              >
                <span
                  className="i-logos-java text-base"
                  style={{ color: "#ffffff" }}
                />
                <span className="font-semibold">Java</span>
              </span>
              <span
                className="px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  color: "#ffffff",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                <span
                  className="i-logos-typescript-icon text-base"
                  style={{ color: "#ffffff" }}
                />
                <span className="font-semibold">TypeScript</span>
              </span>
              <span
                className="px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(20, 184, 166, 0.15)",
                  color: "#ffffff",
                  border: "1px solid rgba(20, 184, 166, 0.3)",
                }}
              >
                <span
                  className="i-logos-react text-base"
                  style={{ color: "#ffffff" }}
                />
                <span className="font-semibold">React</span>
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
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 text-white rounded-lg hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: "#1d9bf0",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1a8cd8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1d9bf0";
                }}
                aria-label="Twitterプロフィール"
              >
                <span
                  className="i-mdi-twitter text-lg"
                  style={{ color: "#ffffff" }}
                />
                <span style={{ color: "#ffffff" }}>Follow</span>
              </a>

              <a
                href="https://github.com/SuzumiyaAoba"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 text-white rounded-lg hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: "#24292f",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#32383f";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#24292f";
                }}
                aria-label="GitHubプロフィール"
              >
                <span
                  className="i-mdi-github text-lg"
                  style={{ color: "#ffffff" }}
                />
                <span style={{ color: "#ffffff" }}>GitHub</span>
              </a>
            </div>

            {/* 追加のアクション */}
            <div className="flex items-center gap-2">
              <button
                className="p-2.5 transition-all duration-200 rounded-lg"
                style={{
                  color: "#ffffff",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.backgroundColor =
                    "rgba(236, 72, 153, 0.15)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                aria-label="お気に入りに追加"
              >
                <span
                  className="i-mdi-heart-outline text-xl"
                  style={{ color: "#ffffff" }}
                />
              </button>
              <button
                className="p-2.5 transition-all duration-200 rounded-lg"
                style={{
                  color: "#ffffff",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.backgroundColor =
                    "rgba(59, 130, 246, 0.15)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                aria-label="シェア"
              >
                <span
                  className="i-mdi-share-variant text-xl"
                  style={{ color: "#ffffff" }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
