import { glob, readFile } from "fs/promises";
import path from "path";
import type { RawContent } from "./types";

/**
 * コンテンツファイルを読み込む
 */
export async function getRawContent(
  ...paths: string[]
): Promise<RawContent | null>;
export async function getRawContent(
  options: { lang?: string },
  ...paths: string[]
): Promise<RawContent | null>;
export async function getRawContent(
  ...args: [{ lang?: string }, ...string[]] | string[]
): Promise<RawContent | null> {
  let lang: string | undefined;
  let paths: string[];

  // オーバーロード対応：最初の引数がオブジェクトの場合は言語指定あり
  if (typeof args[0] === "object" && args[0] !== null && "lang" in args[0]) {
    lang = args[0].lang;
    paths = args.slice(1) as string[];
  } else {
    paths = args as string[];
  }

  const relative = path.join("src", "contents", ...paths);
  const abosolute = path.join(process.cwd(), relative);

  // 言語指定がある場合は index.{lang}.{md,mdx} を優先
  const suffix = lang ? `.${lang}` : "";
  const mdPath = path.resolve(path.join(abosolute, `index${suffix}.md`));
  const mdxPath = path.resolve(path.join(abosolute, `index${suffix}.mdx`));

  const readFileOptions = { encoding: "utf8" } as const;
  try {
    return {
      path: path.join(relative, `index${suffix}.md`),
      format: "md",
      raw: await readFile(mdPath, readFileOptions),
    };
  } catch (err) {
    try {
      return {
        path: path.join(relative, `index${suffix}.mdx`),
        format: "mdx",
        raw: await readFile(mdxPath, readFileOptions),
      };
    } catch {
      return null;
    }
  }
}

/**
 * コンテンツディレクトリ内のCSSファイルを取得する
 */
export async function getStylesheets(...paths: string[]): Promise<string[]> {
  const css = await Array.fromAsync(glob(path.resolve(...paths) + "/*.css"));
  return css.map((absolutePath) => path.basename(absolutePath));
}

/**
 * コンテンツで利用可能な言語を取得する
 * @param paths コンテンツパス
 * @returns 利用可能な言語コードの配列（例: ["ja", "en"]）
 */
export async function getAvailableLanguages(...paths: string[]): Promise<string[]> {
  const relative = path.join("src", "contents", ...paths);
  const absolute = path.join(process.cwd(), relative);

  const languages: string[] = [];

  // デフォルト版（日本語）をチェック
  const defaultMdPath = path.resolve(path.join(absolute, "index.md"));
  const defaultMdxPath = path.resolve(path.join(absolute, "index.mdx"));
  try {
    await readFile(defaultMdPath, { encoding: "utf8" });
    languages.push("ja");
  } catch {
    try {
      await readFile(defaultMdxPath, { encoding: "utf8" });
      languages.push("ja");
    } catch {
      // デフォルト版がない
    }
  }

  // 言語固有ファイルをチェック
  const languageFiles = await Array.fromAsync(
    glob(path.resolve(absolute, "index.*.{md,mdx}"))
  );

  for (const file of languageFiles) {
    const filename = path.basename(file);
    const match = filename.match(/^index\.([a-z]{2})\.(md|mdx)$/);
    if (match) {
      languages.push(match[1]);
    }
  }

  return Array.from(new Set(languages));
}

/**
 * 英語版が存在するかチェックする
 */
export async function hasEnglishVersion(...paths: string[]): Promise<boolean> {
  const englishContent = await getRawContent({ lang: "en" }, ...paths);
  return englishContent !== null;
}
