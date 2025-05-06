// pagefind-adapter.js - ESモジュールとブラウザの互換性を解決するためのアダプタ

// pagefindのAPI用プレースホルダ
window.pagefind = {
  search: async function (query) {
    console.log("Pagefind search called with:", query);
    // 実際の実装はpagefind.jsのロード後に置き換えられます
    return { results: [] };
  },
  debouncedSearch: async function () {
    return { results: [] };
  },
  destroy: async function () {},
  filters: async function () {
    return {};
  },
  init: async function () {},
  mergeIndex: async function () {},
  options: async function () {},
  preload: async function () {},
};

// ロード済みフラグを設定
window.__pagefind_loaded = false;

// pagefindの初期化
(function loadPagefind() {
  // 既に読み込み中なら処理しない
  if (window.__pagefind_loading) return;
  window.__pagefind_loading = true;

  // pagefind.jsのコンテンツをフェッチしてスクリプトとして実行する
  fetch("/pagefind/pagefind.js")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load pagefind.js: ${response.status} ${response.statusText}`
        );
      }
      return response.text();
    })
    .then((code) => {
      try {
        // export文を削除 - 改良版
        let modifiedCode = code
          // exportブロックの削除
          .replace(/export\s*{[^}]*}/g, "")
          // export キーワードの削除
          .replace(/export\s+(?:const|let|var|function|class)/g, "$1")
          // export default の削除
          .replace(/export\s+default/g, "")
          // 単独のexportステートメントの削除
          .replace(/export\s*\{[^}]*\};?/g, "")
          // ファイル末尾の export{...} を削除
          .replace(/export\s*{.*}$/g, "");

        // 明示的に末尾にグローバル化コードを追加
        const finalCode =
          modifiedCode +
          `
          // Pagefindが初期化完了したらフラグを設定
          if (typeof window !== 'undefined') {
            // Pagefindのグローバル登録がまだの場合に備えて
            if (!window.pagefind && typeof search === 'function') {
              window.pagefind = {
                search,
                debouncedSearch,
                destroy,
                filters,
                init,
                mergeIndex,
                options,
                preload
              };
            }
            
            // 自動初期化 (pagefind.js内のグローバル登録後に実行)
            setTimeout(() => {
              if (typeof window.pagefind !== 'undefined' && typeof window.pagefind.init === 'function') {
                console.log('Initializing pagefind via adapter');
                window.pagefind.init().then(() => {
                  console.log('Pagefind fully initialized');
                  window.__pagefind_loaded = true;
                  // 初期化完了イベントを発火
                  window.dispatchEvent(new CustomEvent('pagefind:initialized'));
                });
              }
            }, 10);
          }
        `;

        // 新しいスクリプトとして評価
        const script = document.createElement("script");
        script.textContent = finalCode;
        document.body.appendChild(script);

        console.log("Pagefind script loaded and evaluated");
      } catch (error) {
        console.error("Error initializing pagefind:", error);
        window.__pagefind_loading = false;
      }
    })
    .catch((error) => {
      console.error("Failed to load pagefind.js:", error);
      window.__pagefind_loading = false;
    });
})();
