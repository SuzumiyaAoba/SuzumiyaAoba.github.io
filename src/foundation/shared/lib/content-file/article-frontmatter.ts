import {
  asBoolean,
  asDateString,
  asString,
  asStringArray,
  asStringWithDefault,
} from "./frontmatter";

/** ブログとノートで共有する記事メタデータ。日付の必須化などは各エンティティが行う。 */
export type ArticleFrontmatter = {
  title: string;
  date?: string;
  category?: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  draft?: boolean;
  amazonAssociate?: boolean;
  amazonProductIds?: string[];
  model?: string;
};

/** 空欄の日付と未設定の項目は省略し、それ以外の空文字・false・空配列は保つ。 */
export function normalizeArticleFrontmatter(
  data: Record<string, unknown>
): ArticleFrontmatter {
  const date = asDateString(data["date"]);
  const category = asString(data["category"]);
  const description = asString(data["description"]);
  const tags = asStringArray(data["tags"]);
  const thumbnail = asString(data["thumbnail"]);
  const draft = asBoolean(data["draft"]);
  const amazonAssociate = asBoolean(data["amazonAssociate"]);
  const amazonProductIds = asStringArray(data["amazonProductIds"]);
  const model = asString(data["model"]);

  return {
    title: asStringWithDefault(data["title"], ""),
    ...(date ? { date } : {}),
    ...(category === undefined ? {} : { category }),
    ...(description === undefined ? {} : { description }),
    ...(tags === undefined ? {} : { tags }),
    ...(thumbnail === undefined ? {} : { thumbnail }),
    ...(draft === undefined ? {} : { draft }),
    ...(amazonAssociate === undefined ? {} : { amazonAssociate }),
    ...(amazonProductIds === undefined ? {} : { amazonProductIds }),
    ...(model === undefined ? {} : { model }),
  };
}
