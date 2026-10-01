import {
  DataTexture,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  Vector3,
} from "three";
import { palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

const W = 120;
const H = 72;

const GLIDER = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
] as const;

function makeTexture(pixels: Uint8Array) {
  const texture = new DataTexture(pixels, W, H, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export const demo: DemoModule = {
  alt: "前の状態を読みながら次の状態を書く計算で、読み元と書き先の 2 枚のバッファを毎回入れ替えるピンポンバッファのデモ。ライフゲームでは、各セルの次の状態を、周りの 8 つのセルの今の状態から決める。2 枚のバッファを使えば、全部のセルが同じ「今の状態」を読めるので、グライダー（斜めに進む形）が正しく進む。1 枚をその場で書き換えると、先に更新した隣のセルの「次の状態」を読んでしまい、形が崩れていく。右の 2 枚の小さな図で、どちらを読み（青）、どちらに書いているか（黄）がわかる。",
  camera: { position: [0, 0, 11.5], target: [0, 0, 0], fov: 42, orbit: false },
  studio: { floor: false, fog: false, background: "#0a0f17" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "バッファの使い方",
      value: "pingpong",
      options: [
        { value: "pingpong", label: "2 枚を交互に（ピンポン）" },
        { value: "inplace", label: "1 枚をその場で書き換える" },
      ],
    },
    {
      type: "range",
      key: "rate",
      label: "1 秒の世代数",
      min: 1,
      max: 30,
      step: 1,
      value: 10,
    },
    { type: "button", key: "reset", label: "最初から" },
  ],
  legend: [
    { color: palette.lime, label: "生きているセル" },
    { color: palette.sky, label: "今読んでいるバッファ" },
    { color: palette.amber, label: "今書いているバッファ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const cells = [new Uint8Array(W * H), new Uint8Array(W * H)];
    const pixels = [new Uint8Array(W * H * 4), new Uint8Array(W * H * 4)];
    const textures = pixels.map((p) => context.track(makeTexture(p)));
    const big = new Mesh(
      new PlaneGeometry(8.4, (8.4 * H) / W),
      new MeshBasicMaterial({ map: textures[0] ?? null })
    );
    big.position.x = -1.5;
    scene.add(big);
    const thumbs = textures.map((texture, i) => {
      const mesh = new Mesh(
        new PlaneGeometry(2.4, (2.4 * H) / W),
        new MeshBasicMaterial({ map: texture })
      );
      mesh.position.set(4.6, 1.1 - i * 2.2, 0);
      scene.add(mesh);
      const label = context.label(`バッファ ${i === 0 ? "A" : "B"}`, {
        tone: "strong",
      });
      label.position.set(4.6, 1.1 - i * 2.2 + 0.95, 0);
      scene.add(label);
      return { mesh, label };
    });
    const readFrame = segments([], palette.sky, { width: 4 });
    const writeFrame = segments([], palette.amber, { width: 4 });
    scene.add(readFrame, writeFrame);
    const arrowLabel = context.label("", { tone: "muted" });
    arrowLabel.position.set(4.6, -2.25, 0.1);
    scene.add(arrowLabel);

    let read = 0;
    let generation = 0;
    let budget = 0;
    const seed = () => {
      const random = rng(9);
      for (const c of cells) {
        c.fill(0);
      }
      const [first] = cells;
      if (!first) {
        return;
      }
      // 右下へ進むグライダーを並べる
      for (let gy = 0; gy < 5; gy++) {
        for (let gx = 0; gx < 7; gx++) {
          const ox = 4 + gx * 12;
          const oy = 4 + gy * 11;
          for (const [dx, dy] of GLIDER) {
            first[(oy + dy) * W + ox + dx] = 1;
          }
        }
      }
      // 右端にでたらめな領域
      for (let y = 10; y < 60; y++) {
        for (let x = 92; x < 115; x++) {
          first[y * W + x] = random() < 0.35 ? 1 : 0;
        }
      }
      read = 0;
      generation = 0;
    };
    seed();
    const frame = (mesh: Mesh) => {
      const c = mesh.position;
      const w = 1.25;
      const h = (2.4 * H) / W / 2 + 0.05;
      return [
        new Vector3(c.x - w, c.y - h, 0.02),
        new Vector3(c.x + w, c.y - h, 0.02),
        new Vector3(c.x + w, c.y - h, 0.02),
        new Vector3(c.x + w, c.y + h, 0.02),
        new Vector3(c.x + w, c.y + h, 0.02),
        new Vector3(c.x - w, c.y + h, 0.02),
        new Vector3(c.x - w, c.y + h, 0.02),
        new Vector3(c.x - w, c.y - h, 0.02),
      ];
    };
    const paint = (index: number) => {
      const c = cells[index];
      const p = pixels[index];
      if (!c || !p) {
        return;
      }
      for (let i = 0; i < W * H; i++) {
        const alive = c[i] === 1;
        p.set(alive ? [166, 224, 82, 255] : [20, 28, 40, 255], i * 4);
      }
      const texture = textures[index];
      if (texture) {
        texture.needsUpdate = true;
      }
    };
    const step = (inPlace: boolean) => {
      const source = cells[read];
      const target = inPlace ? source : cells[1 - read];
      if (!source || !target) {
        return;
      }
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx !== 0 || dy !== 0) {
                // その場で書き換える場合、source はすでに一部が次の世代になっている
                n += source[((y + dy + H) % H) * W + ((x + dx + W) % W)] ?? 0;
              }
            }
          }
          const alive = source[y * W + x] === 1;
          target[y * W + x] = n === 3 || (alive && n === 2) ? 1 : 0;
        }
      }
      if (!inPlace) {
        read = 1 - read;
      }
      generation++;
    };

    return {
      update({ dt }) {
        const inPlace = params["mode"] === "inplace";
        budget += dt * Number(params["rate"]);
        while (budget >= 1) {
          budget -= 1;
          step(inPlace);
        }
        paint(0);
        paint(1);
        const { material } = big;
        material.map = textures[read] ?? null;
        const readThumb = thumbs[read];
        const writeThumb = inPlace ? readThumb : thumbs[1 - read];
        if (readThumb && writeThumb) {
          readFrame.setPoints(frame(readThumb.mesh));
          writeFrame.setPoints(
            frame(writeThumb.mesh).map((p) => p.clone().setZ(0.03))
          );
        }
        for (const [i, thumb] of thumbs.entries()) {
          thumb.mesh.material.opacity = inPlace && i !== read ? 0.25 : 1;
          thumb.mesh.material.transparent = true;
        }
        arrowLabel.setText(
          inPlace
            ? "同じ 1 枚を読みながら書く"
            : read === 0
              ? "A を読み → B に書く"
              : "B を読み → A に書く"
        );
        context.readout("世代", `${generation}`);
        context.readout(
          "読むバッファ / 書くバッファ",
          inPlace
            ? `${read === 0 ? "A" : "B"} / 同じ`
            : read === 0
              ? "A / B"
              : "B / A"
        );
        context.caption(
          inPlace
            ? "1 枚のバッファをその場で書き換えると、左上から順に更新するうちに、すでに次の世代になった隣のセルを「今の状態」として読んでしまう。規則が崩れ、グライダーが壊れて広がっていく。"
            : "読み元のバッファから今の状態を読み、別のバッファに次の状態を書く。書き終えたら 2 枚の役割を入れ替える（ピンポン）。全部のセルが同じ世代を読むので、グライダーが形を保って斜めに進む。GPU では、テクスチャを読みながら同じテクスチャに書くことはできないので、この方法が必須になる。"
        );
      },
      action(key) {
        if (key === "reset") {
          seed();
        }
      },
    };
  },
};
