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

// コンテンツの種類を列挙型で定義
enum ContentType {
  BLOG = "blog",
  NOTE = "notes",
  KEYWORD = "keywords",
  TOOL = "tools",
  SEARCH = "search",
}

// 基本のパスセグメント型
interface BasePathSegment {
  name: string;
  path: string;
  isLast: boolean;
  type: ContentType | string;
}

// ブログのパスセグメント
interface BlogPathSegment extends BasePathSegment {
  type: ContentType.BLOG;
  slug?: string;
}

// ノートのパスセグメント
interface NotePathSegment extends BasePathSegment {
  type: ContentType.NOTE;
  notePath?: string;
}

// キーワードのパスセグメント
interface KeywordPathSegment extends BasePathSegment {
  type: ContentType.KEYWORD;
  keywordPath?: string;
}

// ツールのパスセグメント
interface ToolPathSegment extends BasePathSegment {
  type: ContentType.TOOL;
}

// 検索のパスセグメント
interface SearchPathSegment extends BasePathSegment {
  type: ContentType.SEARCH;
}

// その他のパスセグメント
interface OtherPathSegment extends BasePathSegment {
  type: string;
}

// すべてのパスセグメントの型ユニオン
type PathSegment =
  | BlogPathSegment
  | NotePathSegment
  | KeywordPathSegment
  | ToolPathSegment
  | SearchPathSegment
  | OtherPathSegment;

// 静的データをサーバーから取得するためのプロップスタイプ
interface BreadcrumbNavProps {
  blogTitleMap: Record<string, string>;
  noteTitleMap: Record<string, string>;
  keywordTitleMap: Record<string, string>;
}

// パスセグメントの表示名をマッピングするオブジェクト
const segmentMappings: Record<string, string> = {
  [ContentType.BLOG]: "ブログ",
  [ContentType.NOTE]: "ノート",
  [ContentType.KEYWORD]: "キーワード",
  [ContentType.TOOL]: "ツール",
  [ContentType.SEARCH]: "Search",
  programming: "プログラミング",
  scala: "Scala",
  cats: "Cats",
};

// 型ガード関数 - ブログセグメントの判定
function isBlogSegment(segment: PathSegment): segment is BlogPathSegment {
  return segment.type === ContentType.BLOG;
}

// 型ガード関数 - ノートセグメントの判定
function isNoteSegment(segment: PathSegment): segment is NotePathSegment {
  return segment.type === ContentType.NOTE;
}

// 型ガード関数 - キーワードセグメントの判定
function isKeywordSegment(segment: PathSegment): segment is KeywordPathSegment {
  return segment.type === ContentType.KEYWORD;
}

// 型ガード関数 - 検索セグメントの判定
function isSearchSegment(segment: PathSegment): segment is SearchPathSegment {
  return segment.type === ContentType.SEARCH;
}

// スラグからパスを解析する関数の引数をオブジェクト形式に変更
interface ExtractPathFromSlugProps {
  path: string;
  startIndex?: number;
}

function extractPathFromSlug({
  path,
  startIndex = 1,
}: ExtractPathFromSlugProps): string {
  return path.split("/").filter(Boolean).slice(startIndex).join("/");
}

// パスセグメントの生成を抽象化したヘルパー関数の引数をオブジェクト形式に変更
interface CreateContentSegmentProps {
  baseSegment: BasePathSegment;
  contentType: ContentType;
  segment: string;
  path: string;
  isContentSegment: boolean;
}

function createContentSegment({
  baseSegment,
  contentType,
  segment,
  path,
  isContentSegment,
}: CreateContentSegmentProps): PathSegment {
  const common = { ...baseSegment, type: contentType };

  switch (contentType) {
    case ContentType.BLOG:
      return isContentSegment
        ? ({ ...common, slug: segment } as BlogPathSegment)
        : (common as BlogPathSegment);

    case ContentType.NOTE:
      return isContentSegment
        ? ({
            ...common,
            notePath: extractPathFromSlug({ path }),
          } as NotePathSegment)
        : (common as NotePathSegment);

    case ContentType.KEYWORD:
      return isContentSegment
        ? ({
            ...common,
            keywordPath: extractPathFromSlug({ path }),
          } as KeywordPathSegment)
        : (common as KeywordPathSegment);

    case ContentType.TOOL:
      return common as ToolPathSegment;

    case ContentType.SEARCH:
      return common as SearchPathSegment;

    default:
      return { ...baseSegment, type: contentType } as OtherPathSegment;
  }
}

// URLパスからブレッドクラムの配列を生成する関数
function getPathSegments(segments: string[]): PathSegment[] {
  // ホームページの場合は空の配列を返す
  if (segments.length === 0) {
    return [];
  }

  return segments.map((segment, index) => {
    // パスをセグメントの位置まで構築
    const path = `/${segments.slice(0, index + 1).join("/")}`;

    // URLエンコードされたセグメントをデコードする
    const decodedSegment = decodeURIComponent(segment);

    // 基本セグメント情報
    const isLast = index === segments.length - 1;
    const name = segmentMappings[decodedSegment] || decodedSegment;

    // 動的ルートやスペシャルケースの処理
    const isDynamicRoute = segment.startsWith("[") && segment.endsWith("]");

    // コンテンツの種類を判定
    const rootSegment = segments[0];
    const isContentSegment = index > 0 && isLast && !isDynamicRoute;

    // 共通のベースオブジェクト
    const baseSegment: BasePathSegment = {
      name: isDynamicRoute ? "詳細" : name,
      path,
      isLast,
      type: rootSegment,
    };

    // 型安全のためContentTypeにキャストできるか確認
    if (Object.values(ContentType).includes(rootSegment as ContentType)) {
      return createContentSegment({
        baseSegment,
        contentType: rootSegment as ContentType,
        segment,
        path,
        isContentSegment,
      });
    }

    // それ以外の場合は汎用セグメントを返す
    return { ...baseSegment, type: rootSegment } as OtherPathSegment;
  });
}

// タイトルを取得する関数の引数をオブジェクトに変更
interface GetDisplayTitleProps {
  segment: PathSegment;
  blogTitleMap: Record<string, string>;
  noteTitleMap: Record<string, string>;
  keywordTitleMap: Record<string, string>;
}

function getDisplayTitle({
  segment,
  blogTitleMap,
  noteTitleMap,
  keywordTitleMap,
}: GetDisplayTitleProps): string {
  // ブログ記事の場合
  if (isBlogSegment(segment) && segment.slug) {
    return blogTitleMap[segment.slug] || segment.name;
  }

  // ノートの場合
  if (isNoteSegment(segment) && segment.notePath) {
    return noteTitleMap[segment.notePath] || segment.name;
  }

  // キーワードの場合
  if (isKeywordSegment(segment) && segment.keywordPath) {
    return keywordTitleMap[segment.keywordPath] || segment.name;
  }

  // それ以外の場合はデフォルト名を返す
  return segment.name;
}

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
            // タイトルマップから適切な表示名を取得
            const displayName = getDisplayTitle({
              segment,
              blogTitleMap,
              noteTitleMap,
              keywordTitleMap,
            });

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
