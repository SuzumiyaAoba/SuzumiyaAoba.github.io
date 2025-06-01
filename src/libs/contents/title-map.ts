import path from "path";
import { getFrontmatters } from "./markdown";
import { Pages } from "./blog";
import { frontmatterSchema } from "./notes";
import { keywordFrontmatterSchema, bookFrontmatterSchema } from "./schema";
import { z } from "zod";

// ブログ記事のタイトルマップを取得
export async function getBlogTitleMap(): Promise<Record<string, string>> {
  const blogEntries = await getFrontmatters({
    paths: [Pages.blog.root],
    parser: {
      frontmatter: Pages.blog.frontmatter,
    },
  });

  const titleMap: Record<string, string> = {};

  for (const entry of blogEntries) {
    titleMap[entry.path] = entry.frontmatter.title;
  }

  return titleMap;
}

// ノート記事のタイトルマップを取得
export async function getNoteTitleMap(): Promise<Record<string, string>> {
  const noteEntries = await getFrontmatters({
    paths: ["notes"],
    parser: {
      frontmatter: frontmatterSchema,
    },
  });

  const titleMap: Record<string, string> = {};

  for (const entry of noteEntries) {
    titleMap[entry.path] = entry.frontmatter.title;
  }

  return titleMap;
}

// キーワード記事のタイトルマップを取得
export async function getKeywordTitleMap(): Promise<Record<string, string>> {
  const keywordEntries = await getFrontmatters({
    paths: ["keywords"],
    parser: {
      frontmatter: keywordFrontmatterSchema,
    },
  });

  const titleMap: Record<string, string> = {};

  for (const entry of keywordEntries) {
    titleMap[entry.path] = entry.frontmatter.title;
  }

  return titleMap;
}

// 書籍のタイトルマップを取得
export async function getBookTitleMap(): Promise<Record<string, string>> {
  const bookEntries = await getFrontmatters({
    paths: ["books"],
    parser: {
      frontmatter: bookFrontmatterSchema,
    },
  });

  const titleMap: Record<string, string> = {};

  for (const entry of bookEntries) {
    titleMap[entry.path] = entry.frontmatter.title;
  }

  return titleMap;
}
