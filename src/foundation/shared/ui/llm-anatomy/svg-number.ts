/**
 * 超越関数の実装による最下位桁の差をSVG属性に持ち込まない。
 * 計算は元の精度で行い、描画に渡す値だけを整形する。
 */
export function svgNumber(value: number): string {
  const formatted = value.toFixed(4);
  return formatted === "-0.0000" ? "0.0000" : formatted;
}
