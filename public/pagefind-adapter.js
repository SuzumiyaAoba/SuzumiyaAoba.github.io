// Pagefind は静的出力後に生成されるため、ブラウザーで読み込む。
(() => {
  /**
   * @param {unknown} value 読み込んだモジュール
   * @returns {value is import("../src/foundation/pages/site/search/model/use-pagefind-search").PagefindModule} 検索 API を持つか
   */
  function isPagefindModule(value) {
    return (
      typeof value === "object" &&
      value !== null &&
      "search" in value &&
      typeof value.search === "function"
    );
  }

  window.__pagefind_loaded = false;
  window.__pagefind_loading = false;

  async function loadPagefind() {
    if (window.__pagefind_loaded || window.__pagefind_loading) {
      return;
    }
    window.__pagefind_loading = true;
    try {
      /** @type {unknown} */
      const pagefind = await import(/* webpackIgnore: true */ "/pagefind/pagefind.js");
      if (!isPagefindModule(pagefind)) {
        throw new TypeError("Pagefind search API is unavailable");
      }
      window.pagefind = pagefind;
      window.__pagefind_loaded = true;
      window.dispatchEvent(new CustomEvent("pagefind:initialized"));
    } catch (error) {
      window.__pagefind_loading = false;
      window.dispatchEvent(
        new CustomEvent("pagefind:error", {
          detail: { error: error instanceof Error ? error.message : "Unknown error" },
        }),
      );
    }
  }

  function initializePagefind() {
    void loadPagefind();
  }

  document.addEventListener("DOMContentLoaded", initializePagefind);
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initializePagefind, 1);
  }
})();
