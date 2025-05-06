// pagefind-adapter.js - ESモジュールとブラウザの互換性を解決するためのアダプタ

// pagefindのロード状態フラグ
window.__pagefind_loaded = false;
window.__pagefind_loading = false;

// Pagefindをロードする関数
async function loadPagefind() {
  if (typeof window === "undefined") return;

  // すでに初期化済みまたはロード中の場合はスキップ
  if (window.__pagefind_loaded || window.__pagefind_loading) return;

  window.__pagefind_loading = true;

  try {
    console.log("Loading pagefind...");

    // webpackIgnoreを使ってパスをそのままにする
    window.pagefind = await import(
      /* webpackIgnore: true */ "/pagefind/pagefind.js"
    );

    console.log("Pagefind loaded successfully");
    window.__pagefind_loaded = true;

    // 初期化完了イベントを発火
    window.dispatchEvent(new CustomEvent("pagefind:initialized"));
  } catch (error) {
    console.error("Failed to load pagefind:", error);
    window.__pagefind_loading = false;
  }
}

// DOMContentLoadedイベントでPagefindをロード
document.addEventListener("DOMContentLoaded", loadPagefind);

// 即時実行も行う（既にDOMContentLoadedが発火済みの場合のため）
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(loadPagefind, 1);
}
