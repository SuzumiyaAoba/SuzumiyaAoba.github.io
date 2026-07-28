// このファイルは scripts/generate-icon-data.mjs が生成します。直接編集しないでください。
// 再生成: node scripts/generate-icon-data.mjs

import type { IconData } from "./types";

/**
 * クライアントコンポーネントで使うアイコンだけの部分集合。
 * ここに載せた分だけがクライアントバンドルへ含まれる。
 */
export const ICONS = {
  "lucide:languages": {
    "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m5 8l6 6m-7 0l6-6l2-3M2 5h12M7 2h1m14 20l-5-10l-5 10m2-4h6\"/>",
    "viewBox": "0 0 24 24",
    "width": "1em",
    "height": "1em"
  },
  "lucide:moon": {
    "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"/>",
    "viewBox": "0 0 24 24",
    "width": "1em",
    "height": "1em"
  },
  "lucide:search": {
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"m21 21l-4.34-4.34\"/><circle cx=\"11\" cy=\"11\" r=\"8\"/></g>",
    "viewBox": "0 0 24 24",
    "width": "1em",
    "height": "1em"
  },
  "lucide:sun": {
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/></g>",
    "viewBox": "0 0 24 24",
    "width": "1em",
    "height": "1em"
  }
} satisfies Record<string, IconData>;

export type IconName = keyof typeof ICONS;
