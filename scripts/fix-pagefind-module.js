/**
 * Pagefindスクリプトをモジュールとして使用できるように修正するスクリプト
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
  console.log("Pagefindスクリプトをモジュールとして修正しています...");

  try {
    // ファイルの内容を読み込む
    const content = await readFile(PAGEFIND_SCRIPT_PATH, "utf8");

    // import.meta の使用を確認
    if (content.includes("import.meta")) {
      console.log("import.meta の使用を検出しました - ファイルを修正します...");

      // 新しい内容 - グローバル変数としてwindow.pagefindを明示的に設定
      const modifiedContent = `// Modified for ESM compatibility
${content}

// Export pagefind to global scope
if (typeof window !== 'undefined') {
  window.pagefind = pagefind;
}`;

      // 修正した内容を書き込む
      await writeFile(PAGEFIND_SCRIPT_PATH, modifiedContent, "utf8");
      console.log("✅ Pagefindスクリプトを修正しました");
    } else {
      console.log("import.meta の使用は検出されませんでした。修正は不要です。");
    }
  } catch (error) {
    console.error(
      "⚠️ Pagefindスクリプトの修正中にエラーが発生しました:",
      error
    );
  }
}

main();
