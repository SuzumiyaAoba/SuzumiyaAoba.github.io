/**
 * Pagefindスクリプトを修正するスクリプト
 * import.meta の参照を削除し、正常に動作するようにします
 */
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Pagefindスクリプトのパス
const PAGEFIND_SCRIPT_PATH = path.join(
  process.cwd(),
  "out",
  "pagefind",
  "pagefind.js"
);

async function main() {
  console.log("Pagefindスクリプトを修正しています...");

  try {
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
      console.log("✅ Pagefindスクリプトを修正しました");
    } else {
      console.log("import.meta の使用は検出されませんでした。修正は不要です。");
    }

    // スクロール位置の回復コードを追加
    const searchPagePath = path.join(
      process.cwd(),
      "out",
      "search",
      "index.html"
    );

    // 検索ページの内容を読み込む
    if (fs.existsSync(searchPagePath)) {
      const searchPageContent = await readFile(searchPagePath, "utf8");

      // ページロード時のスクリプトを追加
      if (!searchPageContent.includes("window.__pagefind_init")) {
        const modifiedSearchPage = searchPageContent.replace(
          "</head>",
          `<script>
  window.__pagefind_init = false;
  document.addEventListener('DOMContentLoaded', function() {
    // pagefindライブラリを直接scriptタグで挿入
    const script = document.createElement('script');
    script.src = '/pagefind/pagefind.js';
    script.onload = function() {
      console.log('Pagefind loaded successfully');
      window.__pagefind_init = true;
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
</head>`
        );

        await writeFile(searchPagePath, modifiedSearchPage, "utf8");
        console.log("✅ 検索ページにPagefind初期化スクリプトを追加しました");
      }
    }
  } catch (error) {
    console.error(
      "⚠️ Pagefindスクリプトの修正中にエラーが発生しました:",
      error
    );
  }
}

main();
