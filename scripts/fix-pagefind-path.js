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
  <script src="/pagefind/pagefind.js" type="module"></script>
  <script>
    // Pagefindの読み込みイベントを発火
    window.addEventListener('load', function() {
      // 少し遅延させてモジュールが確実に読み込まれるようにする
      setTimeout(function() {
        if (window.pagefind) {
          console.log('Pagefind library loaded from static HTML');
          document.dispatchEvent(new Event('pagefind-loaded'));
        } else {
          console.error('Failed to load Pagefind library');
        }
      }, 100);
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

    // pagefind.jsへの参照がすでにあるか確認
    if (searchPageContent.includes("/pagefind/pagefind.js")) {
      console.log("pagefind.jsへの参照が見つかりました。スキップします。");
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
