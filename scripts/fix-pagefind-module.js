/**
 * Pagefindスクリプトの修正と検索ページ準備のスクリプト
 *
 * 主な機能：
 * 1. 検索ページにPagefind初期化スクリプトを追加
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

// メイン処理関数
async function main() {
  console.log("Pagefind関連ファイルの修正を開始します...");

  try {
    // 検索ページへの初期化スクリプト追加
    await addInitScriptToSearchPage();

    console.log("✅ Pagefind関連ファイルの修正が完了しました");
  } catch (error) {
    console.error(
      "⚠️ Pagefind関連ファイルの修正中にエラーが発生しました:",
      error
    );
    process.exit(1);
  }
}

/**
 * 検索ページに初期化スクリプトを追加する関数
 */
async function addInitScriptToSearchPage() {
  try {
    // 検索ページの存在確認
    if (!fs.existsSync(SEARCH_PAGE_PATH)) {
      console.log(`⚠️ 検索ページが見つかりません: ${SEARCH_PAGE_PATH}`);
      return;
    }

    // 検索ページの内容を読み込む
    const searchPageContent = await readFile(SEARCH_PAGE_PATH, "utf8");

    // すでにスクリプトが含まれているか確認
    if (searchPageContent.includes("pagefind-adapter.js")) {
      console.log(
        "Pagefind初期化コードがすでに含まれています。スキップします。"
      );
      return;
    }

    // 初期化スクリプト
    const initScript = `
<script src="/pagefind-adapter.js" async></script>
`;

    // </head>タグの前にスクリプトを挿入
    const modifiedContent = searchPageContent.replace(
      "</head>",
      `${initScript}\n</head>`
    );

    // 修正した内容を書き込む
    await writeFile(SEARCH_PAGE_PATH, modifiedContent, "utf8");
    console.log("✅ 検索ページに初期化スクリプトを追加しました");
  } catch (error) {
    console.error("❌ 検索ページの修正中にエラーが発生しました:", error);
    throw error;
  }
}

// 実行
main();
