import { Color, InstancedMesh, Matrix4, SphereGeometry, Vector3 } from "three";
import {
  arrow,
  hash2,
  palette,
  perlin2,
  standard,
  TAU,
  terrainColor,
} from "../../kit";
import { gridTerrain } from "../../surface";
import type { DemoModule } from "../../types";

const SIZE = 8;
const SEGMENTS = 150;
const MAX_LATTICE = 11;

/** kit の perlin2 と同じ規則で格子点の勾配ベクトルを返す。 */
const gradientAt = (ix: number, iy: number) => {
  const angle = (Math.floor(hash2(ix, iy) * 16) % 16) * (TAU / 16);
  return [Math.cos(angle), Math.sin(angle)] as const;
};

export const demo: DemoModule = {
  alt: "パーリンノイズで作った起伏のある島の地形。格子点には勾配ベクトルの矢印が立ち、地形を流すと新しい地形が継ぎ目なく生成され続ける。",
  camera: { position: [7.5, 6.2, 8.5], target: [0, 0, 0] },
  controls: [
    {
      type: "select",
      key: "source",
      label: "高さの元になる値",
      value: "perlin",
      options: [
        { value: "perlin", label: "パーリンノイズ" },
        { value: "white", label: "ただの乱数" },
      ],
      hint: "乱数を頂点ごとに使うと、隣同士のつながりがなくトゲだらけになります。",
    },
    {
      type: "range",
      key: "frequency",
      label: "周波数（格子の数）",
      min: 1,
      max: 8,
      step: 0.5,
      value: 3,
    },
    {
      type: "range",
      key: "amplitude",
      label: "高さの倍率",
      min: 0.2,
      max: 3,
      step: 0.1,
      value: 1.8,
    },
    { type: "toggle", key: "scroll", label: "地形を流す", value: true },
    {
      type: "toggle",
      key: "lattice",
      label: "格子点と勾配ベクトル",
      value: true,
    },
  ],
  legend: [
    { color: palette.amber, label: "格子点の勾配ベクトル" },
    { color: palette.ink, label: "格子点（高さは必ず 0）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const terrain = gridTerrain({ width: SIZE, segments: SEGMENTS });
    scene.add(terrain);

    const dotMatrix = new Matrix4();
    const dots = new InstancedMesh(
      new SphereGeometry(0.06, 16, 12),
      standard(palette.ink, { emissive: 0.4 }),
      MAX_LATTICE * MAX_LATTICE
    );
    dots.material.depthTest = false;
    dots.material.transparent = true;
    dots.renderOrder = 10;
    scene.add(dots);
    const arrows = Array.from({ length: MAX_LATTICE * MAX_LATTICE }, () => {
      const item = arrow(palette.amber, {
        radius: 0.02,
        headLength: 0.16,
        overlay: true,
      });
      scene.add(item);
      return item;
    });

    const origin = new Vector3();
    const direction = new Vector3();
    const paint = new Color();
    let offset = 0;
    let lastKey = "";

    const heightOf = (source: string, cell: number, amplitude: number) => {
      const water = -0.12 * amplitude;
      return (x: number, z: number) => {
        if (source === "white") {
          const gx = Math.round((x + SIZE / 2) * (SEGMENTS / SIZE));
          const gz = Math.round((z + SIZE / 2) * (SEGMENTS / SIZE));
          return Math.max(water, (hash2(gx + 0.5, gz + 0.5) - 0.5) * amplitude);
        }
        return Math.max(
          water,
          perlin2((x + offset) / cell, z / cell) * amplitude * 1.4
        );
      };
    };

    return {
      update({ dt }) {
        const source = String(params["source"]);
        const frequency = Number(params["frequency"]);
        const amplitude = Number(params["amplitude"]);
        const cell = SIZE / frequency;
        if (params["scroll"] === true) {
          offset += dt * 0.45;
        }
        const key = `${source}:${frequency}:${amplitude}:${offset.toFixed(4)}`;
        if (key !== lastKey) {
          lastKey = key;
          const height = heightOf(source, cell, amplitude);
          const range = amplitude * 0.7 * 1.4;
          terrain.update(height, (x, z, h, out) => {
            const slope =
              source === "white"
                ? 0
                : Math.min(
                    1,
                    Math.hypot(
                      height(x + 0.05, z) - h,
                      height(x, z + 0.05) - h
                    ) /
                      0.05 /
                      2.5
                  );
            terrainColor(0.36 + (h / range) * 0.64, slope, out);
            if (h <= -0.12 * amplitude + 1e-4) {
              out.set("#1d5c80").lerp(paint.set("#3fa7c4"), 0.25);
            }
          });
        }

        const showLattice = params["lattice"] === true && source === "perlin";
        let used = 0;
        if (showLattice) {
          const first = Math.ceil((-SIZE / 2 + offset) / cell);
          const last = Math.floor((SIZE / 2 + offset) / cell);
          const firstZ = Math.ceil(-SIZE / 2 / cell);
          const lastZ = Math.floor(SIZE / 2 / cell);
          for (let ix = first; ix <= last; ix++) {
            for (let iz = firstZ; iz <= lastZ; iz++) {
              const item = arrows[used];
              if (!item || used >= MAX_LATTICE * MAX_LATTICE) {
                continue;
              }
              const x = ix * cell - offset;
              const z = iz * cell;
              const [gx, gz] = gradientAt(ix, iz);
              origin.set(x, Math.max(0, -0.12 * amplitude) + 0.02, z);
              direction
                .set(gx, 0, gz)
                .multiplyScalar(Math.min(0.9, cell * 0.38));
              item.set(origin, direction);
              dotMatrix.makeTranslation(origin.x, origin.y, origin.z);
              dots.setMatrixAt(used, dotMatrix);
              used++;
            }
          }
        }
        for (let index = used; index < arrows.length; index++) {
          const item = arrows[index];
          if (item) {
            item.visible = false;
          }
        }
        dots.count = used;
        dots.instanceMatrix.needsUpdate = true;

        context.readout("格子の間隔", `${cell.toFixed(2)} m`);
        context.readout(
          "格子点でのノイズ値",
          perlin2(Math.round(offset / cell) + 0, 1).toFixed(3)
        );
        context.readout("生成済みの距離", `${offset.toFixed(1)} m`);
        context.caption(
          source === "perlin"
            ? "各格子点の勾配（矢印）と距離の内積を滑らかに補間。格子点では高さ 0、その間で山と谷が生まれる。"
            : "頂点ごとの乱数には隣とのつながりがない。自然物に使うには『連続した乱数』が必要。"
        );
      },
    };
  },
};
