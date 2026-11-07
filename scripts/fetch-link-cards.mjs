/**
 * 対象: content/ 内の .md / .mdx に書かれた <LinkCard url="..." />
 * 出力: content/link-cards.json（URL → { title, description }）
 * 取得: npm run build:link-cards（未登録の URL だけ取得する。全件を取り直すときは -- --refresh）
 * 検証: npm run check:link-cards（未登録の URL があれば失敗する。ネットワーク不要）
 *
 * 本文から消えた URL の項目は書き出し時に取り除く。
 * 取得できないサイトは、content/link-cards.json に手で書くか、
 * <LinkCard> の title / description に直接渡す。
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { extractLinkCardUrls } from "../src/foundation/shared/lib/mdx/link-card/extract-urls.ts";
import { LinkCardSourceSchema } from "../src/foundation/shared/lib/mdx/link-card/link-card-schema.ts";
import { parseLinkCardMetadata } from "../src/foundation/shared/lib/mdx/link-card/parse-ogp.ts";

/** @typedef {import("../src/foundation/shared/lib/mdx/link-card/link-card-schema.ts").LinkCardEntry} LinkCardEntry */

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const OUTPUT = path.join(CONTENT_DIR, "link-cards.json");

const MDX_EXTENSIONS = new Set([".md", ".mdx"]);
const FETCH_TIMEOUT_MS = 15_000;
/** 解析に使うのは head までなので、復号するのは先頭のこの長さだけにする。 */
const MAX_HTML_BYTES = 1024 * 1024;
const CHARSET_SNIFF_BYTES = 4096;
const USER_AGENT = "Mozilla/5.0 (compatible; SuzumiyaAoba-LinkCard/1.0)";
const META_CHARSET = /<meta[^>]+charset=["']?([\w-]+)/iu;
const HEADER_CHARSET = /charset=["']?([\w-]+)/iu;

const args = new Set(process.argv.slice(2));
const isCheck = args.has("--check");
const isRefresh = args.has("--refresh");

/** @returns {Promise<string[]>} 本文に書かれた URL を、並びが安定するよう整列して返す */
async function collectContentUrls() {
  const entries = await readdir(CONTENT_DIR, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter(
      (entry) => entry.isFile() && MDX_EXTENSIONS.has(path.extname(entry.name))
    )
    .map((entry) => path.join(entry.parentPath, entry.name));
  const urlsByFile = await Promise.all(
    files.map(async (file) =>
      extractLinkCardUrls(await readFile(file, "utf-8"))
    )
  );
  return [...new Set(urlsByFile.flat())].toSorted();
}

/** @returns {Promise<Map<string, LinkCardEntry>>} content/link-cards.json に登録済みの URL と内容 */
async function readRegistered() {
  const raw = await readFile(OUTPUT, "utf-8");
  return new Map(Object.entries(LinkCardSourceSchema.parse(JSON.parse(raw))));
}

/**
 * 宣言された文字コードで復号する。未知の文字コードは UTF-8 にする。
 * @param {Uint8Array} bytes 受け取った HTML の先頭部分
 * @param {string} contentType 応答の Content-Type ヘッダー
 * @returns {string} 復号した HTML
 */
function decodeHtml(bytes, contentType) {
  const sniffed = new TextDecoder("latin1").decode(
    bytes.subarray(0, CHARSET_SNIFF_BYTES)
  );
  const charset =
    HEADER_CHARSET.exec(contentType)?.[1] ?? META_CHARSET.exec(sniffed)?.[1];
  try {
    return new TextDecoder(charset ?? "utf-8").decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/**
 * リンク先の HTML を取得し、題と要約を取り出す。
 * @param {string} url 取得するページの URL
 * @returns {Promise<LinkCardEntry>} 取得できなければ例外にする
 */
async function fetchMetadata(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "ja,en;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) {
    throw new Error(
      `HTML ではありません (${contentType || "content-type なし"})`
    );
  }
  const bytes = new Uint8Array(await response.arrayBuffer()).subarray(
    0,
    MAX_HTML_BYTES
  );
  const metadata = parseLinkCardMetadata(decodeHtml(bytes, contentType));
  if (metadata === null) {
    throw new Error("タイトルが見つかりません");
  }
  return metadata;
}

/** @returns {Promise<number>} 終了コード */
async function main() {
  const urls = await collectContentUrls();
  const registered = await readRegistered();
  const missing = urls.filter((url) => !registered.has(url));

  if (isCheck) {
    if (missing.length === 0) {
      return 0;
    }
    console.error(
      `content/link-cards.json に未登録の LinkCard があります。npm run build:link-cards で取得してください。\n${missing
        .map((url) => `  ${url}`)
        .join("\n")}`
    );
    return 1;
  }

  /** @type {Map<string, LinkCardEntry>} */
  const fetched = new Map();
  /** @type {string[]} */
  const failures = [];
  for (const url of isRefresh ? urls : missing) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- 取得先への負荷を避けるため 1 件ずつ取得する。
      fetched.set(url, await fetchMetadata(url));
      console.log(`取得: ${url}`);
    } catch (error) {
      failures.push(url);
      console.error(
        `失敗: ${url} (${error instanceof Error ? error.message : String(error)})`
      );
    }
  }

  const next = Object.fromEntries(
    urls.flatMap((url) => {
      const entry = fetched.get(url) ?? registered.get(url);
      return entry === undefined ? [] : [[url, entry]];
    })
  );
  const removed = [...registered.keys()].filter((url) => !urls.includes(url));
  await writeFile(OUTPUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `content/link-cards.json: ${Object.keys(next).length} 件（取得 ${fetched.size}、削除 ${removed.length}、失敗 ${failures.length}）`
  );
  return failures.length === 0 ? 0 : 1;
}

process.exitCode = await main();
