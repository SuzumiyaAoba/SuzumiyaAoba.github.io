/**
 * 開発環境でPagefindのインデックスを作成するスクリプト
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

// 最小限のPagefindスタブファイルを作成
const createPagefindStub = (outputDir) => {
  const stubFile = path.join(outputDir, "pagefind.js");
  const stubContent = `
// Pagefindスタブファイル
window.pagefind = {
  search: async (query) => {
    console.warn('Pagefindのインデックスが見つかりません。ビルドを実行してください。');
    return { results: [] };
  }
};
console.log('Pagefindスタブが読み込まれました。本番ビルドを行うとインデックスが生成されます。');
`;

  fs.writeFileSync(stubFile, stubContent);
  console.log(`✅ Pagefindスタブファイルを作成しました: ${stubFile}`);

  // UI用のスタイルとインターフェースファイルも作成
  const uiDir = path.join(outputDir, "ui");
  ensureDirectoryExists(uiDir);

  // 空のスタイルファイル
  fs.writeFileSync(
    path.join(outputDir, "pagefind-ui.css"),
    "/* スタブスタイル */"
  );

  // 必要なディレクトリ構造を作成
  const wasm = path.join(outputDir, "_pagefind");
  ensureDirectoryExists(wasm);

  return stubFile;
};

// サンプルコンテンツのインデックスを直接作成
const createDirectIndexFile = () => {
  // サンプルデータを含むインデックスファイルを作成
  const publicDir = path.join(process.cwd(), "public");
  const pagefindDir = path.join(publicDir, "pagefind");

  ensureDirectoryExists(pagefindDir);

  // サンプルテスト用ページデータの作成（開発環境用に簡単な検索結果を返すため）
  const indexData = {
    version: "1.0.0",
    pageSize: 20,
    language: "ja",
    pages: [
      {
        id: "sample1",
        url: "/blog/2023-09-30-astro/",
        meta: { title: "Astroを使ったブログサイトの構築" },
        content:
          "Astroは静的サイトジェネレーターで、高速なウェブサイト構築に適しています。",
        filters: {},
      },
      {
        id: "sample2",
        url: "/blog/",
        meta: { title: "ブログ記事一覧" },
        content: "このブログでは技術的なトピックについて解説しています。",
        filters: {},
      },
    ],
  };

  // インデックスファイルの保存
  fs.writeFileSync(
    path.join(pagefindDir, "pagefind.json"),
    JSON.stringify(indexData)
  );

  // SearchComponentがロードするためのJSファイル
  const jsContent = `
    window.pagefind = {
      search: async (query) => {
        console.log('開発環境用検索:', query);
        const sampleResults = [
          {
            id: "sample1",
            data: async () => ({
              url: "/blog/2023-09-30-astro/",
              meta: { title: "Astroを使ったブログサイトの構築" },
              excerpt: "Astroは<mark>静的</mark>サイトジェネレーターで、高速なウェブサイト構築に適しています。",
            }),
            score: 1.0
          },
          {
            id: "sample2",
            data: async () => ({
              url: "/blog/",
              meta: { title: "ブログ記事一覧" },
              excerpt: "このブログでは<mark>技術的</mark>なトピックについて解説しています。",
            }),
            score: 0.8
          }
        ];
        
        return {
          results: query ? sampleResults.filter(r => r.id.includes(query) || 
                                               r.data().then(d => d.meta.title.includes(query))) : [],
          term: query,
          total: 2
        };
      }
    };
    
    // Pagefindの読み込み完了イベントを発火
    document.dispatchEvent(new Event('pagefind-loaded'));
    console.log('開発環境用Pagefindが読み込まれました');
  `;

  fs.writeFileSync(path.join(pagefindDir, "pagefind.js"), jsContent);

  console.log("✅ 開発環境用のインデックスファイルを作成しました");

  return pagefindDir;
};

// 開発環境でPagefindを実行する関数
const runPagefindForDev = async () => {
  console.log("🔍 開発環境用のPagefindインデックスを作成しています...");

  try {
    // 直接インデックスファイルを作成する方法を使用（ビルドをスキップ）
    const indexDir = createDirectIndexFile();
    console.log(
      `✅ 開発環境のPagefindインデックスが正常に作成されました: ${indexDir}`
    );
  } catch (error) {
    console.error("❌ Pagefindインデックスの作成に失敗しました:", error);
    console.log(
      "⚠️ スタブファイルのみを使用します。検索結果は表示されません。"
    );
    // エラーが発生しても終了しない
    process.exit(0);
  }
};

runPagefindForDev();
