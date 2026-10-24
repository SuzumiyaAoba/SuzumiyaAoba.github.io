import { expect, it } from "vite-plus/test";
import { svgNumber } from "./svg-number";

it("最下位桁だけが異なる計算結果を同じSVG属性にする", () => {
  expect(svgNumber(5.224982390769778)).toBe("5.2250");
  expect(svgNumber(5.224982390769779)).toBe("5.2250");
});

it("ゼロ近傍の正負でSVG属性が変わらない", () => {
  expect(svgNumber(-Number.EPSILON)).toBe("0.0000");
  expect(svgNumber(Number.EPSILON)).toBe("0.0000");
});

it("座標の符号と描画に必要な精度を保つ", () => {
  expect(svgNumber(-12.345678)).toBe("-12.3457");
  expect(svgNumber(50)).toBe("50.0000");
});
