import { useSelectedLayoutSegments } from "next/navigation";

// コンテンツの種類を列挙型で定義
export enum ContentType {
  BLOG = "blog",
  NOTE = "notes",
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
  | NotePathSegment
  | KeywordPathSegment
  | BookPathSegment
  | ToolPathSegment
  | SearchPathSegment
  | OtherPathSegment;

// 静的データをサーバーから取得するためのプロップスタイプ
interface BreadcrumbData {
  blogTitleMap: Record<string, string>;
  noteTitleMap: Record<string, string>;
  keywordTitleMap: Record<string, string>;
  bookTitleMap: Record<string, string>;
}

// パスセグメントの表示名をマッピングするオブジェクト
const segmentMappings: Record<string, string> = {
  [ContentType.BLOG]: "ブログ",
  [ContentType.NOTE]: "ノート",
  [ContentType.KEYWORD]: "キーワード",
  [ContentType.TOOL]: "ツール",
  [ContentType.SEARCH]: "Search",
  [ContentType.BOOKS]: "書籍",
  programming: "プログラミング",
  scala: "Scala",
  cats: "Cats",
  post: "記事",
  page: "ページ",
  "privacy-policy": "プライバシーポリシー",
  contact: "お問い合わせ",
};

// 型ガード関数
function isBlogSegment(segment: PathSegment): segment is BlogPathSegment {
  return segment.type === ContentType.BLOG;
}

function isNoteSegment(segment: PathSegment): segment is NotePathSegment {
  return segment.type === ContentType.NOTE;
}

function isKeywordSegment(
  segment: PathSegment,
): segment is KeywordPathSegment {
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

  let processedSegments = [...segments];
  const rootSegment = segments[0];
  if (
    rootSegment === ContentType.BLOG &&
    segments.length > 2 &&
    segments[1] === "post"
  ) {
    processedSegments = [segments[0], ...segments.slice(2)];
  }

  return processedSegments.map((segment, index) => {
    let path = "";
    if (
      rootSegment === ContentType.BLOG &&
      index > 0 &&
      segments[1] === "post"
    ) {
      if (index === 1) {
        path = `/${segments[0]}`;
      } else {
        path = `/${segments[0]}/${segments[1]}/${segments[index + 1]}`;
      }
    } else {
      path = `/${processedSegments.slice(0, index + 1).join("/")}`;
    }

    const decodedSegment = decodeURIComponent(segment);
    const isLast = index === processedSegments.length - 1;
    const name = segmentMappings[decodedSegment] || decodedSegment;
    const baseSegment: BasePathSegment = { name, path, isLast, type: "" };
    const contentType = (processedSegments[0] as ContentType) || "other";
    const isContentSegment = index > 0;

    return createContentSegment({
      baseSegment,
      contentType,
      segment,
      path,
      isContentSegment,
    });
  });
}

// 表示用タイトルを取得
interface GetDisplayTitleProps {
  segment: PathSegment;
  data: BreadcrumbData;
}

export function getDisplayTitle({
  segment,
  data,
}: GetDisplayTitleProps): string {
  const { blogTitleMap, noteTitleMap, keywordTitleMap, bookTitleMap } = data;

  if (isBlogSegment(segment) && segment.slug && blogTitleMap[segment.slug]) {
    return blogTitleMap[segment.slug];
  }
  if (
    isNoteSegment(segment) &&
    segment.notePath &&
    noteTitleMap[segment.notePath]
  ) {
    return noteTitleMap[segment.notePath];
  }
  if (
    isKeywordSegment(segment) &&
    segment.keywordPath &&
    keywordTitleMap[segment.keywordPath]
  ) {
    return keywordTitleMap[segment.keywordPath];
  }
  if (
    isBookPathSegment(segment) &&
    segment.bookPath &&
    bookTitleMap[segment.bookPath]
  ) {
    return bookTitleMap[segment.bookPath];
  }
  if (isSearchSegment(segment)) {
    return `「${segment.name}」の検索結果`;
  }
  return segment.name;
}

// カスタムフック
export function useBreadcrumbs(data: BreadcrumbData) {
  const segments = useSelectedLayoutSegments();
  const pathSegments = getPathSegments(segments);

  return { pathSegments, data };
} 