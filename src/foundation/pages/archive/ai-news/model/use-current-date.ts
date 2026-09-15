import { useSyncExternalStore } from "react";
import { localDate } from "./release-activity";

function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  function schedule() {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    timer = setTimeout(
      () => {
        onChange();
        schedule();
      },
      midnight.getTime() - now.getTime() + 100
    );
  }
  schedule();
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

// 静的ビルドの日付を埋め込まず、閲覧者のローカル日付をハイドレーション後に取得する。
export function useCurrentDate() {
  return useSyncExternalStore(subscribe, localDate, () => "");
}
