// pagefind-adapter.js - ESモジュールとブラウザの互換性を解決するためのアダプタ

// pagefindのAPI用プレースホルダ
window.pagefind = {
  search: async function (query) {
    console.log("Pagefind search called with:", query);
    // 実際の実装はpagefind.jsのロード後に置き換えられます
    return { results: [] };
  },
};

// pagefindの初期化
(function loadPagefind() {
  // pagefind.jsのコンテンツをフェッチしてスクリプトとして実行する
  fetch("/pagefind/pagefind.js")
    .then((response) => response.text())
    .then((code) => {
      // export文を削除
      const modifiedCode = code.replace(/export\s*{[^}]*}/g, "");

      // グローバルスコープに公開するためのコードを追加
      const finalCode =
        modifiedCode +
        `
        // グローバルスコープに公開
        if (typeof window !== 'undefined') {
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
          // 自動初期化
          init();
        }
      `;

      // 新しいスクリプトとして評価
      const script = document.createElement("script");
      script.textContent = finalCode;
      document.body.appendChild(script);

      console.log("Pagefind initialized successfully");
    })
    .catch((error) => {
      console.error("Failed to load pagefind.js:", error);
    });
})();
