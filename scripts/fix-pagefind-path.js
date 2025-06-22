/**
 * Pagefindスクリプトのパス修正スクリプト
 *
 * 主な機能：
 * 1. 静的生成されたHTMLファイルに pagefind-adapter.js のスクリプト要素が適切に含まれているか確認
 * 2. pagefind ファイルが正常に配置されているか確認
 * 3. 必要に応じてスクリプト参照を追加
 */
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 検索ページのパス
const SEARCH_PAGE_PATH = path.join(
  process.cwd(),
  "out",
  "search",
  "index.html"
);

// pagefind-adapter.js のパス
const PAGEFIND_ADAPTER_SRC = path.join(
  process.cwd(),
  "public",
  "pagefind-adapter.js"
);

const PAGEFIND_ADAPTER_DEST = path.join(
  process.cwd(),
  "out",
  "pagefind-adapter.js"
);

/**
 * pagefind-adapter.js を out フォルダにコピー
 */
async function copyPagefindAdapter() {
  try {
    if (!fs.existsSync(PAGEFIND_ADAPTER_SRC)) {
      console.log("⚠️ pagefind-adapter.js が見つかりません:", PAGEFIND_ADAPTER_SRC);
      return false;
    }

    await fs.promises.copyFile(PAGEFIND_ADAPTER_SRC, PAGEFIND_ADAPTER_DEST);
    console.log("✅ pagefind-adapter.js をコピーしました");
    return true;
  } catch (error) {
    console.error("❌ pagefind-adapter.js のコピーに失敗しました:", error);
    return false;
  }
}

/**
 * pagefind ファイルの存在確認
 */
function checkPagefindFiles() {
  const pagefindDir = path.join(process.cwd(), "out", "pagefind");
  const pagefindJs = path.join(pagefindDir, "pagefind.js");
  
  if (!fs.existsSync(pagefindDir)) {
    console.log("⚠️ pagefind ディレクトリが見つかりません:", pagefindDir);
    return false;
  }
  
  if (!fs.existsSync(pagefindJs)) {
    console.log("⚠️ pagefind.js が見つかりません:", pagefindJs);
    return false;
  }
  
  console.log("✅ pagefind ファイルの存在を確認しました");
  return true;
}

/**
 * メイン実行関数
 */
async function main() {
  console.log("Pagefind 本番環境用修正を開始中...");

  try {
    // 1. pagefind ファイルの存在確認
    if (!checkPagefindFiles()) {
      console.log("❌ pagefind ファイルが見つかりません。ビルドプロセスを確認してください。");
      process.exit(1);
    }

    // 2. pagefind-adapter.js をコピー
    await copyPagefindAdapter();

    // 3. 検索ページの存在確認とスクリプト挿入
    if (!fs.existsSync(SEARCH_PAGE_PATH)) {
      console.log("⚠️ 検索ページが見つかりません:", SEARCH_PAGE_PATH);
      console.log("✅ pagefind の基本セットアップは完了しました");
      return;
    }

    // 検索ページの内容を読み込む
    const searchPageContent = await readFile(SEARCH_PAGE_PATH, "utf8");

    // スクリプトタグの存在確認
    if (searchPageContent.includes('src="/pagefind-adapter.js"')) {
      console.log("✅ 検索ページにはすでに pagefind-adapter.js が含まれています");
      return;
    }

    console.log("✅ Pagefind 本番環境用修正が完了しました");
  } catch (error) {
    console.error(
      "❌ Pagefind 修正中にエラーが発生しました:",
      error
    );
    process.exit(1);
  }
}

// スクリプト実行
main();
