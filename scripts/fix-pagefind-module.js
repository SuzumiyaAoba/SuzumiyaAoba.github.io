/**
 * Pagefindスクリプトを修正するスクリプト
 *
 * 主な機能：
 * 1. import.meta の参照を削除して正常に動作するようにする
 * 2. 検索ページにPagefind初期化スクリプトを追加
 */
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// パス設定
const PAGEFIND_SCRIPT_PATH = path.join(
  process.cwd(),
  "out",
  "pagefind",
  "pagefind.js"
);

const SEARCH_PAGE_PATH = path.join(
  process.cwd(),
  "out",
  "search",
  "index.html"
);

// メイン処理関数
async function main() {
  console.log("Pagefindスクリプトの修正を開始します...");

  try {
    // 1. import.meta の修正
    await fixImportMeta();

    // 2. 検索ページへの初期化スクリプト追加
    await addInitScriptToSearchPage();

    console.log("✅ Pagefindスクリプトの修正が完了しました");
  } catch (error) {
    console.error(
      "⚠️ Pagefindスクリプトの修正中にエラーが発生しました:",
      error
    );
    process.exit(1);
  }
}

/**
 * import.meta参照を修正する関数
 */
async function fixImportMeta() {
  try {
    // ファイルの存在確認
    if (!fs.existsSync(PAGEFIND_SCRIPT_PATH)) {
      console.log(`⚠️ ファイルが見つかりません: ${PAGEFIND_SCRIPT_PATH}`);
      return;
    }

    // ファイルの内容を読み込む
    const content = await readFile(PAGEFIND_SCRIPT_PATH, "utf8");

    // import.meta の使用を確認
    if (content.includes("import.meta")) {
      console.log("import.meta の使用を検出しました - ファイルを修正します...");

      // import.meta を window.location.origin に置き換え
      const modifiedContent = content.replace(
        /import\.meta/g,
        "({ url: window.location.origin })"
      );

      // 修正した内容を書き込む
      await writeFile(PAGEFIND_SCRIPT_PATH, modifiedContent, "utf8");
      console.log("✅ import.meta の参照を正常に修正しました");
    } else {
      console.log("import.meta の使用は検出されませんでした。修正は不要です。");
    }
  } catch (error) {
    console.error("❌ import.meta の修正中にエラーが発生しました:", error);
    throw error;
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
    if (searchPageContent.includes("window.__pagefind_init")) {
      console.log(
        "Pagefind初期化コードがすでに含まれています。スキップします。"
      );
      return;
    }

    // 初期化スクリプト
    const initScript = `
<script>
  // Pagefind初期化
  window.__pagefind_init = false;
  document.addEventListener('DOMContentLoaded', function() {
    if (window.__pagefind_init) return;
    window.__pagefind_init = true;
    
    // Pagefindスクリプトを動的に読み込み
    const script = document.createElement('script');
    script.src = '/pagefind/pagefind.js';
    script.async = true;
    script.onload = function() {
      console.log('Pagefind loaded successfully');
      document.dispatchEvent(new Event('pagefind-loaded'));
    };
    script.onerror = function() {
      console.error('Failed to load pagefind.js');
    };
    document.head.appendChild(script);
  });
</script>
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
