import { SRGBColorSpace } from "three";
import { createLeatherGrain } from "./leather-grain";

/** 公式ワードマークの分離した横棒と、角を落とした文字の輪郭。 */
export function drawBtr17Logo(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  context.save();
  context.translate(x, y);
  context.scale(width / 262, height / 50);
  for (const polygon of [
    [
      [9, 0],
      [74, 0],
      [79, 5],
      [79, 11],
      [0, 11],
    ],
    [
      [0, 22],
      [65, 22],
      [65, 32],
      [25, 32],
      [25, 50],
      [9, 50],
      [0, 41],
    ],
    [
      [93, 7],
      [100, 0],
      [119, 0],
      [119, 43],
      [112, 50],
      [93, 50],
    ],
    [
      [133, 7],
      [140, 0],
      [158, 0],
      [158, 43],
      [151, 50],
      [133, 50],
    ],
    [
      [181, 0],
      [253, 0],
      [262, 9],
      [262, 41],
      [253, 50],
      [203, 50],
      [203, 39],
      [237, 39],
      [237, 11],
      [197, 11],
      [197, 50],
      [181, 50],
      [172, 41],
      [172, 9],
    ],
  ] as const) {
    context.beginPath();
    for (const [px, py] of polygon) {
      context.lineTo(px, py);
    }
    context.closePath();
    context.fill();
  }
  context.restore();
}

/** 背面の浅い革シボと型押しロゴ。 */
export function btr17LeatherTexture() {
  const height = createLeatherGrain(512, 1024, 6.5, (context) => {
    context.fillStyle = "#565656";
    // 背面の UV は筐体正面と同じ向きなので、型押しを背面から読める向きにする。
    context.translate((20.1 / 41.2) * 512, (1 - 62 / 86.6) * 1024);
    context.scale(-512 / 41.2, 1024 / 86.6);
    drawBtr17Logo(context, -9, -1.72, 18, 3.44);
  });
  // シボの谷の色の濃さも残す。色だけを sRGB とし、高さは線形値のまま扱う。
  const color = height.clone();
  color.colorSpace = SRGBColorSpace;
  return { height, color };
}

/** 写真のBluetooth再生画面を参考にした、静止した表示例。 */
export function drawBtr17Display(context: CanvasRenderingContext2D) {
  context.scale(23.4 / 27, 23.4 / 27);
  context.fillStyle = "#030609";
  context.fillRect(0, 0, 27, 27);
  context.fillStyle = "#d9e4e9";
  context.font = "1.65px Arial";
  context.fillText("58", 2.2, 2.5);
  context.beginPath();
  context.moveTo(0.4, 1.3);
  context.lineTo(0.9, 1.3);
  context.lineTo(1.6, 0.8);
  context.lineTo(1.6, 2.6);
  context.lineTo(0.9, 2.1);
  context.lineTo(0.4, 2.1);
  context.closePath();
  context.fill();
  context.beginPath();
  context.arc(1.5, 1.7, 0.65, -0.8, 0.8);
  context.strokeStyle = "#d9e4e9";
  context.lineWidth = 0.16;
  context.stroke();
  context.strokeStyle = "#d9e4e9";
  context.lineWidth = 0.18;
  context.strokeRect(23, 1.3, 2.6, 1.2);
  context.fillRect(23.3, 1.6, 1.8, 0.6);
  context.fillRect(25.7, 1.65, 0.3, 0.5);
  context.textAlign = "center";
  context.fillStyle = "#75d2df";
  context.font = "bold 2px Arial";
  context.fillText("HIP-HOP", 13.5, 6.5);
  context.fillStyle = "#298496";
  for (let line = 0; line < 90; line += 1) {
    const x = 0.3 + line * 0.295;
    const notch = Math.max(0, Math.min(1, 2.4 - Math.abs(x - 13.5)));
    for (let dot = 0; dot < 3; dot += 1) {
      context.fillRect(x, 8.05 + notch * 0.75 + dot * 0.2, 0.12, 0.1);
      context.fillRect(x, 18.7 - notch * 0.75 + dot * 0.2, 0.12, 0.1);
    }
  }
  context.fillStyle = "#edf5f8";
  context.font = "bold 5.4px Arial";
  context.fillText("LDAC", 13.5, 15.9);
  context.fillStyle = "#75d2df";
  drawBtr17Rate(context);
  context.fillStyle = "#98a8af";
  context.beginPath();
  context.moveTo(9, 23.2);
  context.lineTo(18, 23.2);
  context.lineTo(16.7, 26);
  context.lineTo(10.3, 26);
  context.closePath();
  context.fill();
  context.fillStyle = "#101619";
  context.font = "2.2px Arial";
  context.fillText("HR", 13.5, 25.4);
  context.strokeStyle = "#b5c5ca";
  context.lineWidth = 0.25;
  context.beginPath();
  context.moveTo(4.5, 23.6);
  context.lineTo(6.8, 25.1);
  context.lineTo(5.7, 26);
  context.lineTo(5.7, 22.8);
  context.lineTo(6.8, 23.7);
  context.lineTo(4.5, 25.2);
  context.stroke();
  context.fillStyle = "#b5c5ca";
  for (let bar = 0; bar < 4; bar += 1) {
    context.fillRect(21.2 + bar * 0.7, 25.6 - bar * 0.5, 0.35, 0.6 + bar * 0.5);
  }
  context.beginPath();
  context.moveTo(20.9, 24.4);
  context.quadraticCurveTo(22.3, 24.2, 23.8, 22.9);
  context.stroke();
}

export function drawBtr17SideLabels(context: CanvasRenderingContext2D) {
  context.fillStyle = "#a1a7ae";
  context.textAlign = "center";
  context.font = "1px Arial";
  context.fillText("⏻", 6, 12.6);
  context.fillText("◀◀  EQ", 6, 20.9);
  context.fillText("▶▶", 5.3, 29.1);
  context.strokeStyle = "#a1a7ae";
  context.lineWidth = 0.1;
  context.beginPath();
  context.moveTo(6.7, 28.2);
  context.lineTo(7.5, 28.8);
  context.lineTo(7.1, 29.1);
  context.lineTo(7.1, 27.9);
  context.lineTo(7.5, 28.2);
  context.lineTo(6.7, 28.9);
  context.stroke();
  context.fillText("PC", 6, 31.2);
  context.fillText("BT", 10, 35.5);
  context.fillText("PHONE", 6, 40.7);
  context.fillText("ON", 6, 43.5);
  context.fillText("OFF", 6, 52.7);
  context.save();
  context.translate(10.4, 48);
  context.rotate(-Math.PI / 2);
  context.fillText("D.MODE", 0, 0);
  context.restore();
}

function drawBtr17Rate(context: CanvasRenderingContext2D) {
  const glyphs = [
    ["11111", "11011", "11011", "11111", "00011", "00011", "11111"],
    ["11111", "11000", "11000", "11111", "11011", "11011", "11111"],
    ["11011", "11011", "11110", "11100", "11110", "11011", "11011"],
  ];
  for (const [glyphIndex, glyph] of glyphs.entries()) {
    for (const [row, pixels] of glyph.entries()) {
      for (let column = 0; column < pixels.length; column += 1) {
        if (pixels[column] === "1") {
          context.fillRect(
            10.4 + glyphIndex * 2.2 + column * 0.38,
            20.1 + row * 0.34,
            0.38,
            0.34
          );
        }
      }
    }
  }
}
