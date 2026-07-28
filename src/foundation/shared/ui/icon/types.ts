/**
 * 描画済みアイコン 1 件分の SVG データ。
 * scripts/generate-icon-data.mjs が @iconify/utils の iconToSVG で正規化して出力する。
 */
export type IconData = {
  /** <svg> の中身（パス等） */
  body: string;
  /** 座標系 */
  viewBox: string;
  /** 既定の表示幅（通常は "1em"） */
  width: string;
  /** 既定の表示高（通常は "1em"） */
  height: string;
};
