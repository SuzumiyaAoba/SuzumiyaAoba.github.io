"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import Link from "next/link";
import { HomeIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbItemLink,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";

// 静的データをサーバーから取得するためのプロップスタイプ
interface BreadcrumbNavProps {
  blogTitleMap: Record<string, string>;
  noteTitleMap: Record<string, string>;
  keywordTitleMap: Record<string, string>;
}

interface PathSegment {
  name: string;
  path: string;
  isLast: boolean;
  isSlug: boolean;
  isNote: boolean;
  isKeyword: boolean;
}

// パスセグメントの表示名をマッピングするオブジェクト
const segmentMappings: Record<string, string> = {
  blog: "ブログ",
  notes: "ノート",
  keywords: "キーワード",
  tools: "ツール",
  programming: "プログラミング",
  scala: "Scala",
  cats: "Cats",
};

// URLパスからブレッドクラムの配列を生成する関数
const getPathSegments = (segments: string[]): PathSegment[] => {
  // ホームページの場合は空の配列を返す
  if (segments.length === 0) {
    return [];
  }

  return segments.map((segment, index) => {
    // パスをセグメントの位置まで構築
    const path = `/${segments.slice(0, index + 1).join("/")}`;

    // 動的ルートの特別な処理
    let name = segmentMappings[segment] || segment;

    // [slug]のような動的ルートは特別に処理
    if (segment.startsWith("[") && segment.endsWith("]")) {
      name = "詳細";
    }

    // ブログのスラグとノートのパスを識別
    const isSlug =
      index > 0 &&
      segments[0] === "blog" &&
      index === segments.length - 1 &&
      !segment.startsWith("[");

    const isNote =
      index > 0 &&
      segments[0] === "notes" &&
      index === segments.length - 1 &&
      !segment.startsWith("[");

    const isKeyword =
      index > 0 &&
      segments[0] === "keywords" &&
      index === segments.length - 1 &&
      !segment.startsWith("[");

    return {
      name,
      path,
      isLast: index === segments.length - 1,
      isSlug,
      isNote,
      isKeyword,
    };
  });
};

export default function BreadcrumbNav({
  blogTitleMap,
  noteTitleMap,
  keywordTitleMap,
}: BreadcrumbNavProps) {
  // レイアウトセグメントを使ってページパスを取得
  const layoutSegments = useSelectedLayoutSegments();
  const segments = getPathSegments(layoutSegments);

  // ホームページの場合はブレッドクラムを表示しない
  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbItemLink asChild>
              <Link href="/">
                <HomeIcon className="h-4 w-4" />
                <span className="sr-only">ホーム</span>
              </Link>
            </BreadcrumbItemLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {segments.map((segment) => {
            // ブログ記事のスラグ、ノートのパス、キーワードのパスの場合、マップから表示名を取得
            let displayName = segment.name;

            if (segment.isSlug) {
              const slug = segment.path.split("/").filter(Boolean).pop() || "";
              if (blogTitleMap[slug]) {
                displayName = blogTitleMap[slug];
              }
            } else if (segment.isNote) {
              const notePath = segment.path
                .split("/")
                .filter(Boolean)
                .slice(1)
                .join("/");
              if (noteTitleMap[notePath]) {
                displayName = noteTitleMap[notePath];
              }
            } else if (segment.isKeyword) {
              const keywordPath = segment.path
                .split("/")
                .filter(Boolean)
                .slice(1)
                .join("/");
              if (keywordTitleMap[keywordPath]) {
                displayName = keywordTitleMap[keywordPath];
              }
            }

            return (
              <BreadcrumbItem key={segment.path}>
                <BreadcrumbItemLink
                  asChild
                  variant={segment.isLast ? "active" : "default"}
                >
                  <Link href={segment.path}>{displayName}</Link>
                </BreadcrumbItemLink>

                {!segment.isLast && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
