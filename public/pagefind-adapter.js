// pagefind-adapter.js - bridge for loading Pagefind in the browser

window.__pagefind_loaded = false;
window.__pagefind_loading = false;

async function loadPagefind() {
  if (typeof window === "undefined") return;
  if (window.__pagefind_loaded || window.__pagefind_loading) return;

  window.__pagefind_loading = true;

  try {
    window.pagefind = await import(/* webpackIgnore: true */ "/pagefind/pagefind.js");
    window.__pagefind_loaded = true;
    window.dispatchEvent(new CustomEvent("pagefind:initialized"));
  } catch (error) {
    window.__pagefind_loading = false;
    window.dispatchEvent(
      new CustomEvent("pagefind:error", {
        detail: { error: error?.message || "Unknown error" },
      }),
    );
  }
}

document.addEventListener("DOMContentLoaded", loadPagefind);

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(loadPagefind, 1);
}
