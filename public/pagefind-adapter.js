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
    // Node.js 環境変数 `process.env.NODE_ENV` はブラウザでは存在しないため、
    // ガードを挟んで参照する
    const isProd = typeof process !== "undefined" &&
      process?.env?.NODE_ENV === "production";

    console.log("Environment:", {
      prod: isProd,
      location: window.location.origin,
    });

    // webpackIgnoreを使ってパスをそのままにする
    window.pagefind = await import(
      /* webpackIgnore: true */ "/pagefind/pagefind.js"
    );

    console.log("Pagefind loaded successfully", window.pagefind);
    window.__pagefind_loaded = true;

    // 初期化完了イベントを発火
    window.dispatchEvent(new CustomEvent("pagefind:initialized"));
  } catch (error) {
    console.error("Failed to load pagefind:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // 本番環境での詳細なエラー情報
    if (typeof error === 'object' && error !== null) {
      console.error("Error object:", JSON.stringify(error, null, 2));
    }
    
    window.__pagefind_loading = false;
    
    // エラーイベントも発火
    window.dispatchEvent(new CustomEvent("pagefind:error", {
      detail: { error: error.message || "Unknown error" }
    }));
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
