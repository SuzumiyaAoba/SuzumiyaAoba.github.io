import { ICONS } from "./icon-data";
import { renderIcon, type IconProps } from "./render";

/**
 * アイコンを表示する。
 *
 * サーバーコンポーネントとして SVG を静的 HTML に直接出力するため、
 * アイコン用の JavaScript はクライアントへ配信されず、
 * ハイドレーションを待たずに初回描画からアイコンが表示される。
 *
 * クライアントコンポーネント（"use client"）から使う場合は
 * `@/shared/ui/icon-client` を使うこと。
 *
 * 新しいアイコンを使ったら `node scripts/generate-icon-data.mjs` を再実行する。
 */
export function Icon(props: IconProps) {
  return renderIcon(ICONS, props);
}

export type { IconProps };
