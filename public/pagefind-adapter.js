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
        // export文を削除
        const modifiedCode = code.replace(/export\s*{[^}]*}/g, "");

        // グローバルスコープに公開するためのコードを追加
        const finalCode =
          modifiedCode +
          `
          // グローバルスコープに公開
          if (typeof window !== 'undefined') {
            // 元の実装を保存
            const originalSearch = search;
            const originalDebouncedSearch = debouncedSearch;
            
            // グローバルに公開するメソッドを定義
            window.pagefind = {
              search: function(query) {
                console.log('Pagefind search wrapper called with:', query);
                return originalSearch(query);
              },
              debouncedSearch: function(query, options, debounceTimeoutMs) {
                return originalDebouncedSearch(query, options, debounceTimeoutMs);
              },
              destroy,
              filters,
              init,
              mergeIndex,
              options,
              preload
            };
            
            // 自動初期化
            init().then(() => {
              console.log('Pagefind fully initialized');
              window.__pagefind_loaded = true;
              // 初期化完了イベントを発火
              window.dispatchEvent(new CustomEvent('pagefind:initialized'));
            });
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
