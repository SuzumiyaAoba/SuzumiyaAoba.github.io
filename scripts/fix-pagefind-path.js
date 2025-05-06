/**
 * Pagefindスクリプトのパス修正スクリプト
 *
 * 主な機能：
 * 1. 静的生成されたHTMLファイルにpagefind.jsのスクリプト要素が適切に含まれているか確認
 * 2. 必要に応じてスクリプト参照を追加
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

// 挿入するスクリプトタグ
const SCRIPT_TAG = `
  <!-- 静的生成時に追加されたPagefindスクリプト -->
  <script>
    // Pagefindの読み込み用初期化
    window.__pagefind_init = false;
    document.addEventListener('DOMContentLoaded', function() {
      if (window.__pagefind_init) return;
      window.__pagefind_init = true;
      
      // Pagefindのスクリプトを動的にロード
      var script = document.createElement('script');
      script.src = '/pagefind/pagefind.js';
      script.async = true;
      script.onload = function() {
        console.log('Pagefind library loaded successfully');
        if (window.pagefind) {
          document.dispatchEvent(new Event('pagefind-loaded'));
        }
      };
      script.onerror = function() {
        console.error('Failed to load pagefind.js');
      };
      document.head.appendChild(script);
    });
  </script>
`;

/**
 * メイン実行関数
 */
async function main() {
  console.log("検索ページのPagefindスクリプト参照を確認中...");

  try {
    // 検索ページの存在確認
    if (!fs.existsSync(SEARCH_PAGE_PATH)) {
      console.log("⚠️ 検索ページが見つかりません:", SEARCH_PAGE_PATH);
      return;
    }

    // 検索ページの内容を読み込む
    const searchPageContent = await readFile(SEARCH_PAGE_PATH, "utf8");

    // スクリプトタグの存在確認
    if (
      searchPageContent.includes(
        "<!-- 静的生成時に追加されたPagefindスクリプト -->"
      )
    ) {
      console.log(
        "✅ Pagefindスクリプトはすでに挿入されています。スキップします。"
      );
      return;
    }

    // window.__pagefind_initの存在確認
    if (searchPageContent.includes("window.__pagefind_init")) {
      console.log(
        "✅ Pagefind初期化コードがすでに含まれています。スキップします。"
      );
      return;
    }

    // スクリプトタグを挿入
    const updatedContent = searchPageContent.replace(
      "</head>",
      `${SCRIPT_TAG}</head>`
    );

    // 変更した内容をファイルに書き込む
    await writeFile(SEARCH_PAGE_PATH, updatedContent, "utf8");
    console.log("✅ Pagefindスクリプトを検索ページに正常に挿入しました");
  } catch (error) {
    console.error(
      "❌ Pagefindスクリプトの挿入中にエラーが発生しました:",
      error
    );
    process.exit(1);
  }
}

// スクリプト実行
main();
