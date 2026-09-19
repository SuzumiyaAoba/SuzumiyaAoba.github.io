import { useSyncExternalStore } from "react";

const subscribe = () => () => null;

/**
 * クライアントでマウントされた後に true を返す。
 * SSR とハイドレーション時は false を返し、マウント後に一度だけ再描画される。
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
