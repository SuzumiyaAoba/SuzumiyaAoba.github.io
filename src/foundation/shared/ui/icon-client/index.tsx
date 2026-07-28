"use client";

import { ICONS } from "@/shared/ui/icon/icon-data.client";
import { renderIcon, type IconProps } from "@/shared/ui/icon/render";

/**
 * クライアントコンポーネント用のアイコン。
 *
 * `@/shared/ui/icon` は全アイコン（約 45KB）を持つためクライアントへ
 * 配信したくない。こちらはクライアントで実際に使う分だけを同梱している。
 *
 * 使えるアイコンは scripts/generate-icon-data.mjs の CLIENT_ICONS で定義する。
 */
export function Icon(props: IconProps) {
  return renderIcon(ICONS, props);
}

export type { IconProps };
