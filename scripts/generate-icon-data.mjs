/**
 * サイト内で使用している Iconify アイコンを抽出し、描画済みの SVG データとして
 * TypeScript ファイルに書き出す。
 *
 * @iconify/react の <Icon> はクライアントコンポーネントのため、
 *   1. 静的 HTML に SVG が出力されず、ハイドレーション後に初めてアイコンが現れる
 *   2. ローカル登録が無いアイコンは api.iconify.design へ実行時 fetch する
 * という 2 つの問題がある。生成したデータをサーバーコンポーネントから描画することで
 * どちらも解消し、アイコン用の JavaScript をクライアントへ配らずに済む。
 *
 * 出力:
 *   - icon-data.ts        全アイコン。サーバーコンポーネント (@/shared/ui/icon) 用。
 *   - icon-data.client.ts クライアントコンポーネントで使う分だけの部分集合。
 *
 * 収集対象:
 *   - src 配下の "prefix:name" 形式の文字列リテラル
 *   - content 配下の frontmatter `thumbnail: iconify:prefix:name`
 *
 * prefix は node_modules に @iconify-json/<prefix> があるものだけを採用する。
 * これにより "node:path" のようなアイコンでない文字列を自然に除外できる。
 *
 * 使い方: node scripts/generate-icon-data.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getIconData, iconToSVG } from "@iconify/utils";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICON_DIR = path.join(ROOT, "src/foundation/shared/ui/icon");

/**
 * クライアントコンポーネントから使うアイコン。
 * これらだけがクライアントバンドルへ載る。
 * 対象ファイル: widgets/header/ui/header.tsx, shared/ui/theme-toggle.tsx,
 *              shared/ui/language-toggle.tsx
 */
const CLIENT_ICONS = ["lucide:search", "lucide:sun", "lucide:moon", "lucide:languages"];

/** 指定拡張子のファイルを再帰的に集める */
function collectFiles(dir, extensions) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, extensions));
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const candidates = new Set(CLIENT_ICONS);

// src の文字列リテラルは「アイコンかもしれない」候補。prefix が
// アイコンコレクションでないもの（node:path など）は黙って除外してよい。
for (const file of collectFiles(path.join(ROOT, "src"), [".ts", ".tsx"])) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/["'`]([a-z][a-z0-9-]*:[a-z0-9][a-z0-9-]*)["'`]/g)) {
    candidates.add(match[1]);
  }
}

// content の `iconify:` は曖昧さのない明示的なアイコン指定。
// 解決できなかったものは必ず報告する（黙って消すと記事から絵が消える）。
const explicitIcons = new Set(CLIENT_ICONS);
for (const file of collectFiles(path.join(ROOT, "content"), [".mdx", ".md", ".json", ".yml"])) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/iconify:([a-z][a-z0-9-]*:[a-z0-9][a-z0-9-]*)/g)) {
    candidates.add(match[1]);
    explicitIcons.add(match[1]);
  }
}

const collectionCache = new Map();
function loadCollection(prefix) {
  if (collectionCache.has(prefix)) return collectionCache.get(prefix);
  const file = path.join(ROOT, "node_modules", `@iconify-json/${prefix}/icons.json`);
  const collection = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  collectionCache.set(prefix, collection);
  return collection;
}

/** name -> { body, viewBox } */
const icons = new Map();
const unresolved = [];

for (const full of [...candidates].sort()) {
  const [prefix, name] = full.split(":");
  const collection = loadCollection(prefix);
  if (!collection) {
    // 明示指定なのにコレクションが無い＝コレクション名の誤りか未導入。必ず知らせる。
    if (explicitIcons.has(full)) {
      unresolved.push(`${full} (@iconify-json/${prefix} が未導入、またはコレクション名が誤り)`);
    }
    continue; // src の文字列リテラルはアイコンでないものを含むため黙って除外
  }

  // getIconData がエイリアス解決とコレクション既定値のマージを行う
  const data = getIconData(collection, name);
  if (!data) {
    unresolved.push(`${full} (コレクションに存在しないアイコン名)`);
    continue;
  }

  // iconToSVG が回転・反転・left/top・寸法の正規化を済ませた形にする。
  // @iconify/react と同じ既定（height: 1em、幅は比率維持）で描画されるよう
  // customisations は既定のままにする。
  const { attributes, body } = iconToSVG(data, {});
  icons.set(full, {
    body,
    viewBox: attributes.viewBox,
    width: attributes.width,
    height: attributes.height,
  });
}

const HEADER = `// このファイルは scripts/generate-icon-data.mjs が生成します。直接編集しないでください。
// 再生成: node scripts/generate-icon-data.mjs
`;

/** アイコン定義ファイルを書き出す */
function emit(file, entries, docComment) {
  const body = `${HEADER}
import type { IconData } from "./types";

/**
${docComment}
 */
export const ICONS = ${JSON.stringify(Object.fromEntries(entries), null, 2)} satisfies Record<string, IconData>;

export type IconName = keyof typeof ICONS;
`;
  writeFileSync(path.join(ICON_DIR, file), body);
}

emit(
  "icon-data.ts",
  [...icons].sort(([a], [b]) => a.localeCompare(b)),
  " * サイト内で使用している全アイコンの描画済み SVG データ。\n * サーバーコンポーネントから描画するため、クライアントバンドルには載らない。",
);

const clientEntries = CLIENT_ICONS.filter((name) => icons.has(name))
  .sort()
  .map((name) => [name, icons.get(name)]);

emit(
  "icon-data.client.ts",
  clientEntries,
  " * クライアントコンポーネントで使うアイコンだけの部分集合。\n * ここに載せた分だけがクライアントバンドルへ含まれる。",
);

console.log(`generated icon-data.ts (${icons.size} icons)`);
console.log(`generated icon-data.client.ts (${clientEntries.length} icons)`);

const missingClient = CLIENT_ICONS.filter((name) => !icons.has(name));
if (missingClient.length > 0) {
  console.log(`\n  CLIENT_ICONS に解決できない指定があります: ${missingClient.join(", ")}`);
}
if (unresolved.length > 0) {
  console.log(`\n  警告: 解決できないアイコン指定があります（表示されません）:`);
  for (const name of unresolved) console.log(`    - ${name}`);
}
