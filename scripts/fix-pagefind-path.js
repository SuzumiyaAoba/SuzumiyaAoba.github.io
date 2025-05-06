/**
 * Pagefindスクリプトの参照パスを修正するスクリプト
 * SSG出力されたHTMLファイルにpagefind.jsのScript要素が適切に含まれているか確認します
 */
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// 検索ページのパス
const SEARCH_PAGE_PATH = path.join(
  process.cwd(),
  "out",
  "search",
  "index.html"
);

// スクリプトの挿入先の目印となるタグ
const INSERTION_POINT = "</head>";

// 挿入するスクリプトタグ
const SCRIPT_TAG = `
  <!-- 静的生成時に追加されたPagefindスクリプト -->
  <script>
    // Pagefindの読み込み用初期化
    window.__pagefind_init = false;
    document.addEventListener('DOMContentLoaded', function() {
      if (window.__pagefind_init) return;
      window.__pagefind_init = true;
      
      // スクリプトを直接挿入
      var script = document.createElement('script');
      script.src = '/pagefind/pagefind.js';
      script.async = true;
      script.onload = function() {
        console.log('Pagefind library loaded from static HTML');
        if (window.pagefind) {
          document.dispatchEvent(new Event('pagefind-loaded'));
        }
      };
      script.onerror = function() {
        console.error('Failed to load pagefind.js from static HTML');
      };
      document.head.appendChild(script);
    });
  </script>
`;

async function main() {
  console.log("検索ページのPagefindスクリプト参照を確認しています...");

  try {
    // 検索ページの内容を読み込む
    const searchPageContent = await readFile(SEARCH_PAGE_PATH, "utf8");

    // すでにスクリプトが含まれているか確認
    if (
      searchPageContent.includes(
        "<!-- 静的生成時に追加されたPagefindスクリプト -->"
      )
    ) {
      console.log("スクリプトはすでに挿入されています。スキップします。");
      return;
    }

    // window.__pagefind_initがすでにあるか確認
    if (searchPageContent.includes("window.__pagefind_init")) {
      console.log(
        "Pagefind初期化コードがすでに含まれています。スキップします。"
      );
      return;
    }

    // スクリプトを挿入
    const updatedContent = searchPageContent.replace(
      INSERTION_POINT,
      `${SCRIPT_TAG}${INSERTION_POINT}`
    );

    // 変更した内容をファイルに書き込む
    await writeFile(SEARCH_PAGE_PATH, updatedContent, "utf8");
    console.log("✅ Pagefindスクリプトが正常に挿入されました");
  } catch (error) {
    console.error(
      "⚠️ Pagefindスクリプトの挿入中にエラーが発生しました:",
      error
    );
  }
}

main();
