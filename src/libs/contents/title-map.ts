import path from "path";
import { getFrontmatters } from "./markdown";
import { Pages } from "./blog";
import { keywordFrontmatterSchema, bookFrontmatterSchema } from "./schema";
import { z } from "zod";

// ブログ記事のタイトルマップを取得
export async function getBlogTitleMap(): Promise<Record<string, string>> {
  const blogEntries = await getFrontmatters({
    paths: [Pages.blog.root],
    schema: Pages.blog.frontmatter,
  });

  const titleMap: Record<string, string> = {};

  for (const entry of blogEntries) {
    titleMap[entry._path] = entry.title;
  }

  return titleMap;
}

// キーワード記事のタイトルマップを取得
export async function getKeywordTitleMap(): Promise<Record<string, string>> {
  const keywordEntries = await getFrontmatters({
    paths: ["keywords"],
    schema: keywordFrontmatterSchema,
  });

  const titleMap: Record<string, string> = {};

  for (const entry of keywordEntries) {
    titleMap[entry._path] = entry.title;
  }

  return titleMap;
}

// 書籍のタイトルマップを取得
export async function getBookTitleMap(): Promise<Record<string, string>> {
  const bookEntries = await getFrontmatters({
    paths: ["books"],
    schema: bookFrontmatterSchema,
  });

  const titleMap: Record<string, string> = {};

  for (const entry of bookEntries) {
    titleMap[entry._path] = entry.title;
  }

  return titleMap;
}
