import { access, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { loadMdxScope, renderMdx } from "@/shared/lib/mdx";
import type { Locale } from "@/shared/lib/routing";
import { getKeywordCategories } from "../model/catalog";
import type { Keyword } from "../model/catalog";

const fileExists = async (file: string) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

/** frontmatter の related（"subcategory/slug" の配列）をキーワードに解決する。 */
const resolveRelated = async (value: unknown): Promise<Keyword[]> => {
  if (!Array.isArray(value)) {
    return [];
  }
  const keywords = (await getKeywordCategories()).flatMap((category) =>
    category.subcategories.flatMap((subcategory) => subcategory.keywords)
  );
  return value.flatMap((entry) => {
    if (typeof entry !== "string") {
      return [];
    }
    const found = keywords.find(
      (keyword) => `${keyword.subcategoryId}/${keyword.slug}` === entry
    );
    if (!found) {
      throw new Error(`Unknown related keyword: ${entry}`);
    }
    return [found];
  });
};

/** キーワード解説の MDX を描画し、frontmatter の関連キーワードを解決する。 */
export async function loadKeywordArticle(keyword: Keyword, locale: Locale) {
  if (!keyword.contentPath) {
    return { mdxContent: undefined, related: [] };
  }

  const directory = path.join(
    process.cwd(),
    "content/keywords",
    keyword.contentPath
  );
  const localized = path.join(directory, "index.en.mdx");
  const useEnglish = locale === "en" && (await fileExists(localized));
  const { content, data } = matter(
    await readFile(
      useEnglish ? localized : path.join(directory, "index.mdx"),
      "utf-8"
    )
  );
  const scope = await loadMdxScope(content, directory);
  const mdxContent = await renderMdx(content, {
    basePath: `/contents/keywords/${keyword.contentPath}`,
    scope,
  });
  const related = await resolveRelated(data["related"]);

  return { mdxContent, related };
}
