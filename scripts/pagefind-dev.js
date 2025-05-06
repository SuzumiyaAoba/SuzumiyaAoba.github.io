/**
 * 開発環境でPagefindのインデックスを作成するスクリプト
 * 開発環境では実際のインデックスは生成せず、スタブファイルを使用します
 */
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// ディレクトリ作成関数
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// アダプタファイルをコピー
const copyAdapterFile = async () => {
  console.log("🔄 Pagefindアダプタファイルをコピーしています...");

  // ソースと出力先の設定
  const srcAdapterPath = path.join(
    process.cwd(),
    "public",
    "pagefind-adapter.js"
  );
  const destAdapterPath = path.join(
    process.cwd(),
    "public",
    "pagefind-adapter.js"
  );

  try {
    // アダプタファイルが存在するか確認
    if (!fs.existsSync(srcAdapterPath)) {
      console.log("⚠️ アダプタファイルが見つかりません、スキップします");
      return false;
    }

    // アダプタファイルをコピー
    await fs.promises.copyFile(srcAdapterPath, destAdapterPath);
    console.log("✅ アダプタファイルのコピーが完了しました");
    return true;
  } catch (error) {
    console.error("❌ アダプタファイルのコピーに失敗しました:", error);
    return false;
  }
};

// 開発環境用のPagefindスタブを作成
const createPagefindStub = async () => {
  console.log("🔍 開発環境用のPagefindスタブファイルを作成しています...");

  // 出力先ディレクトリの設定
  const publicDir = path.join(process.cwd(), "public");
  const pagefindDir = path.join(publicDir, "pagefind");

  // pagefindディレクトリを作成
  ensureDirectoryExists(pagefindDir);

  // Pagefindスタブファイル（メインJSファイル）
  const pagefindJs = `
// 開発環境用Pagefindスタブファイル
const search = async (query) => {
  console.log('[開発環境] 検索クエリ:', query);
  
  // 開発環境用サンプルデータ
  const sampleResults = [
    {
      url: "/blog/2023-09-30-astro/",
      meta: { title: "Astroを使ったブログサイトの構築" },
      excerpt: "Astroは<mark>静的</mark>サイトジェネレーターで、高速なウェブサイト構築に適しています。",
    },
    {
      url: "/blog/2024-11-17-scala-rebeginning/",
      meta: { title: "Scalaの再学習" },
      excerpt: "関数型プログラミング言語<mark>Scala</mark>の基本から応用まで解説します。",
    },
    {
      url: "/blog/2024-10-14-tmux-with-nix/",
      meta: { title: "Nixでtmux環境を構築する" },
      excerpt: "<mark>tmux</mark>と<mark>Nix</mark>を組み合わせた開発環境の構築方法について。",
    }
  ];
  
  // クエリに基づいてフィルタリング（空の場合は全て返す）
  const results = query.trim() 
    ? sampleResults.filter(r => 
        r.url.toLowerCase().includes(query.toLowerCase()) || 
        r.meta.title.toLowerCase().includes(query.toLowerCase()) ||
        r.excerpt.toLowerCase().includes(query.toLowerCase())
      )
    : [];
    
  return {
    results: results.map(result => ({
      id: result.url,
      score: 1.0,
      data: async () => result
    })),
    term: query,
    total: results.length
  };
};

const debouncedSearch = async (query, options, debounceTimeoutMs) => search(query);
const filters = async () => ({});
const destroy = async () => {};
const init = async () => {};
const mergeIndex = async () => {};
const options = async () => {};
const preload = async () => {};

export { search, debouncedSearch, filters, destroy, init, mergeIndex, options, preload };

console.log('[開発環境] Pagefindスタブがロードされました');
`;

  // CSSスタブファイル
  const pagefindCss = `
/* 開発環境用Pagefindスタブスタイル */
.pagefind-ui {
  --pagefind-ui-scale: 1;
  --pagefind-ui-primary: #034ad8;
  --pagefind-ui-text: #393939;
  --pagefind-ui-background: #ffffff;
  --pagefind-ui-border: #eeeeee;
  --pagefind-ui-border-width: 2px;
  --pagefind-ui-border-radius: 8px;
  --pagefind-ui-font: sans-serif;
}
`;

  try {
    // スタブファイルの書き込み
    await fs.promises.writeFile(
      path.join(pagefindDir, "pagefind.js"),
      pagefindJs
    );
    await fs.promises.writeFile(
      path.join(pagefindDir, "pagefind-ui.css"),
      pagefindCss
    );

    console.log("✅ 開発環境用Pagefindスタブファイルが正常に作成されました");
    console.log(`📁 ファイル場所: ${pagefindDir}`);

    return true;
  } catch (error) {
    console.error("❌ Pagefindスタブファイルの作成に失敗しました:", error);
    return false;
  }
};

// メイン実行関数
const main = async () => {
  try {
    await createPagefindStub();
    // アダプタファイルのコピーは不要になったのでコメントアウト
    // await copyAdapterFile();
  } catch (error) {
    console.error("❌ 開発環境のPagefind設定に失敗しました:", error);
    process.exit(1);
  }
};

main();
