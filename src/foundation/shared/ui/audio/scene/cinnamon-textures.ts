import { createPreparedTexture } from "./prepared-textures";

/** 生成済みの編組画像を使い、初回表示での画素単位の計算を避ける。 */
export function cinnamonBraidTextures(length: number, radius: number) {
  const color = createPreparedTexture("cinnamon-braid-color", true, true);
  const height = createPreparedTexture("cinnamon-braid-height", false, true);
  const roughness = createPreparedTexture(
    "cinnamon-braid-roughness",
    false,
    true
  );
  for (const texture of [color, height, roughness]) {
    // 元の DataTexture と同じ向きで編み目を繰り返す。
    texture.flipY = false;
    texture.repeat.set(length / (Math.PI * radius), 2);
  }
  return { color, height, roughness };
}

export function drawCinnamonMark(context: CanvasRenderingContext2D) {
  context.fillStyle = "#eee9df";
  context.strokeStyle = "#eee9df";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.font = "bold 1.75px Arial";
  context.fillText("C", -5.15, -4.5);
  context.font = "bold 1.42px Arial";
  context.fillText("INNAMON", -3.9, -4.4, 9.1);
  context.lineWidth = 0.35;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(0, 4);
  context.lineTo(0, -2);
  context.moveTo(0, 2);
  context.lineTo(-1.7, 0.3);
  context.lineTo(-1.7, -1);
  context.moveTo(0, 0.5);
  context.lineTo(1.7, -1);
  context.lineTo(1.7, -1.8);
  context.stroke();
  context.beginPath();
  context.moveTo(0, -2.8);
  context.lineTo(-0.7, -1.7);
  context.lineTo(0.7, -1.7);
  context.closePath();
  context.fill();
  for (const [x, y, radius] of [
    [0, 4, 0.8],
    [-1.7, -1.2, 0.45],
  ] as const) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.fillRect(1.25, -2.35, 0.9, 0.9);
}
