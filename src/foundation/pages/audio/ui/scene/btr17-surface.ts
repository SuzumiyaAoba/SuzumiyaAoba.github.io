import { CanvasTexture } from "three";

/** 細かな凹凸のみを使い、ブラックの背面レザーに浅いシボを付ける。 */
export function btr17LeatherTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the BTR17 leather texture.");
  }
  context.fillStyle = "#808080";
  context.fillRect(0, 0, canvas.width, canvas.height);
  let seed = 73;
  const random = () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  for (let index = 0; index < 18_000; index += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const shade = Math.floor(65 + random() * 120);
    context.strokeStyle = `rgb(${shade} ${shade} ${shade})`;
    context.lineWidth = 0.65;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + 0.5, y - 1.5, x + 2, y - 0.6);
    context.stroke();
  }
  context.fillStyle = "#4f4f4f";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 36px Arial";
  context.fillText("FiiO", 125, 145);
  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

/** 写真のBluetooth再生画面を参考にした、静止した表示例。 */
export function drawBtr17Display(context: CanvasRenderingContext2D) {
  context.fillStyle = "#030609";
  context.fillRect(0, 0, 27, 27);
  context.fillStyle = "#d9e4e9";
  context.font = "1.65px Arial";
  context.fillText("◀ 58", 0.7, 2.5);
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
  for (let line = 0; line < 80; line += 1) {
    context.fillRect(0.9 + line * 0.32, 8.1, 0.13, 0.6);
    context.fillRect(0.9 + line * 0.32, 18.6, 0.13, 0.6);
  }
  context.fillStyle = "#edf5f8";
  context.font = "bold 5.4px Arial";
  context.fillText("LDAC", 13.5, 15.9);
  context.fillStyle = "#75d2df";
  context.font = "bold 2.5px Arial";
  context.fillText("96K", 13.5, 22.4);
  context.fillStyle = "#98a8af";
  context.font = "bold 1.7px Arial";
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
  for (let bar = 0; bar < 4; bar += 1) {
    context.fillRect(21.2 + bar * 0.7, 25.6 - bar * 0.5, 0.35, 0.6 + bar * 0.5);
  }
}

export function drawBtr17SideLabels(context: CanvasRenderingContext2D) {
  context.fillStyle = "#a1a7ae";
  context.textAlign = "center";
  context.font = "1px Arial";
  context.fillText("⏻", 6, 11.5);
  context.fillText("◀  EQ", 6, 19.8);
  context.fillText("▶  EQ", 6, 28);
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
