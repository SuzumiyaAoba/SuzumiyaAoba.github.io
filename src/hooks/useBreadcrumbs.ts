import { useSelectedLayoutSegments } from "next/navigation";

// コンテンツの種類を列挙型で定義
export enum ContentType {
  BLOG = "blog",
  SERIES = "series",
  KEYWORD = "keywords",
  TOOL = "tools",
  SEARCH = "search",
  BOOKS = "books",
}

// 基本のパスセグメント型
interface BasePathSegment {
  name: string;
  path: string;
  isLast: boolean;
  type: ContentType | string;
  shouldLink: boolean; // リンクにすべきかどうか
}

// ブログのパスセグメント
interface BlogPathSegment extends BasePathSegment {
  type: ContentType.BLOG;
  slug?: string;
}

// シリーズのパスセグメント
interface SeriesPathSegment extends BasePathSegment {
  type: ContentType.SERIES;
  seriesPath?: string;
}

// キーワードのパスセグメント
interface KeywordPathSegment extends BasePathSegment {
  type: ContentType.KEYWORD;
  keywordPath?: string;
}

// 書籍のパスセグメント
interface BookPathSegment extends BasePathSegment {
  type: ContentType.BOOKS;
  bookPath?: string;
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
export type PathSegment =
  | BlogPathSegment
  | SeriesPathSegment
  | KeywordPathSegment
  | BookPathSegment
  | ToolPathSegment
  | SearchPathSegment
  | OtherPathSegment;

// 静的データをサーバーから取得するためのプロップスタイプ
interface BreadcrumbData {
  blogTitleMap: Record<string, string>;
  keywordTitleMap: Record<string, string>;
  bookTitleMap: Record<string, string>;
}

// パスセグメントと翻訳キーのマッピング
const segmentToTranslationKey: Record<string, string> = {
  [ContentType.BLOG]: "blog",
  [ContentType.SERIES]: "series",
  [ContentType.KEYWORD]: "keywords",
  [ContentType.TOOL]: "tools",
  [ContentType.SEARCH]: "search",
  [ContentType.BOOKS]: "books",
  tags: "tags",
  about: "about",
  programming: "programming",
  scala: "scala",
  cats: "cats",
  post: "post",
  page: "page",
  "privacy-policy": "privacyPolicy",
  contact: "contact",
};

// リンクにすべきでない中間セグメント名のセット
// これらは単独ではページが存在しないため、リンク化しない
const NON_LINKABLE_SEGMENTS = new Set(["post", "page"]);

// セグメントがリンク可能かどうかを判定する関数
function shouldBeLink(segmentName: string): boolean {
  return !NON_LINKABLE_SEGMENTS.has(segmentName);
}

// 型ガード関数
function isBlogSegment(segment: PathSegment): segment is BlogPathSegment {
  return segment.type === ContentType.BLOG;
}

function isSeriesSegment(segment: PathSegment): segment is SeriesPathSegment {
  return segment.type === ContentType.SERIES;
}

function isKeywordSegment(segment: PathSegment): segment is KeywordPathSegment {
  return segment.type === ContentType.KEYWORD;
}

function isBookPathSegment(segment: PathSegment): segment is BookPathSegment {
  return segment.type === ContentType.BOOKS;
}

function isSearchSegment(segment: PathSegment): segment is SearchPathSegment {
  return segment.type === ContentType.SEARCH;
}

// スラグからパスを解析
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

// コンテンツセグメントを生成
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
    case ContentType.SERIES:
      return isContentSegment
        ? ({
            ...common,
            seriesPath: extractPathFromSlug({ path }),
          } as SeriesPathSegment)
        : (common as SeriesPathSegment);
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
    case ContentType.BOOKS:
      return isContentSegment
        ? ({
            ...common,
            bookPath: extractPathFromSlug({ path }),
          } as BookPathSegment)
        : (common as BookPathSegment);
    default:
      return { ...baseSegment, type: contentType } as OtherPathSegment;
  }
}

// パスセグメント配列を生成
function getPathSegments(segments: string[]): PathSegment[] {
  if (segments.length === 0) {
    return [];
  }

  const isBlogPost = segments[0] === ContentType.BLOG && segments[1] === "post";

  // "post" を除外した表示用のセグメント配列を作る
  const processedSegments = isBlogPost
    ? [segments[0], ...segments.slice(2)]
    : [...segments];

  return processedSegments.map((segment, index) => {
    const isLast = index === processedSegments.length - 1;
    const decodedSegment = decodeURIComponent(segment);

    // パスを再構築
    const fullPath = "/" + processedSegments.slice(0, index + 1).join("/");

    const baseSegment: BasePathSegment = {
      name: decodedSegment,
      path: fullPath,
      isLast,
      type: decodedSegment,
      shouldLink: shouldBeLink(decodedSegment),
    };

    // 最初のセグメントによってコンテンツタイプを判定
    const contentType = processedSegments[0] as ContentType;
    const isContentSegment = index > 0; // 最初以外はコンテンツセグメント

    if (Object.values(ContentType).includes(contentType)) {
      return createContentSegment({
        baseSegment,
        contentType,
        segment: decodedSegment,
        path: fullPath,
        isContentSegment,
      });
    }

    return baseSegment as OtherPathSegment;
  });
}

// 表示タイトルを取得する関数
interface GetDisplayTitleProps {
  segment: PathSegment;
  data: BreadcrumbData;
  t: (key: string) => string;
}

export function getDisplayTitle({
  segment,
  data,
  t,
}: GetDisplayTitleProps): string {
  // 翻訳キーが存在する場合は翻訳を使用
  const translationKey = segmentToTranslationKey[segment.name];
  if (translationKey) {
    return t(`breadcrumb.${translationKey}`);
  }

  // ブログのスラグからタイトルを取得
  if (isBlogSegment(segment) && segment.slug) {
    const title = data.blogTitleMap[segment.slug];
    if (title) return title;
  }

  // キーワードのパスからタイトルを取得
  if (isKeywordSegment(segment) && segment.keywordPath) {
    const title = data.keywordTitleMap[segment.keywordPath];
    if (title) return title;
  }

  // 書籍のパスからタイトルを取得
  if (isBookPathSegment(segment) && segment.bookPath) {
    const title = data.bookTitleMap[segment.bookPath];
    if (title) return title;
  }

  // デコードされたセグメント名をフォールバックとして使用
  return segment.name;
}

// メインのuseBreads関数
export function useBreadcrumbs(data: BreadcrumbData) {
  const segments = useSelectedLayoutSegments();
  const pathSegments = getPathSegments(segments ?? []);

  return { pathSegments, data };
}
