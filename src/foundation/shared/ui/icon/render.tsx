import type { SVGProps } from "react";

import type { IconData } from "./types";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> & {
  /** "prefix:name" 形式のアイコン名 */
  icon: string;
};

/**
 * 生成済みの SVG データからアイコンを描画する。
 *
 * サーバー用・クライアント用の Icon で共有する実装。body は
 * scripts/generate-icon-data.mjs が @iconify-json のコレクションから
 * 取り出した信頼できる値のみで、ユーザー入力は一切通らない。
 */
export function renderIcon(
  icons: Record<string, IconData>,
  { icon, ...props }: IconProps,
) {
  const data = icons[icon];
  if (!data) {
    // 生成漏れ。レイアウトを崩さないよう何も描画しない。
    return null;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={data.viewBox}
      width={data.width}
      height={data.height}
      {...props}
      dangerouslySetInnerHTML={{ __html: data.body }}
    />
  );
}
