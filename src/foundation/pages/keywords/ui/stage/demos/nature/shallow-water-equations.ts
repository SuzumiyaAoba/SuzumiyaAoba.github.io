import {
  BufferAttribute,
  Color,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from "three";
import { clamp, fbm2, palette, smoothstep } from "../../kit";
import type { DemoModule } from "../../types";

const N = 96;
const SIZE = 12;
const CELL = SIZE / N;
const GRAVITY = 9.81;

/** 谷と貯水池とダムのある地形の高さ。 */
function baseTerrain(x: number, z: number, damOpen: number) {
  const valley =
    Math.min(Math.abs(z + Math.sin(x * 0.45) * 1.2), 4) ** 1.4 * 0.22;
  const slope = -x * 0.09;
  const noise = fbm2(x * 0.35 + 3, z * 0.35, 4) * 0.35;
  const reservoir = -1.1 * Math.exp(-((x + 4.2) ** 2 + z ** 2) / 3.2);
  const basin = -0.7 * Math.exp(-((x - 3.6) ** 2 + (z - 1.2) ** 2) / 2.4);
  // ダム：谷を横切る壁。決壊すると中央が削れる
  const damWall =
    Math.exp(-((x + 2.1) ** 2) / 0.05) * 1.1 * Math.exp(-(z ** 2) / 8);
  const breach = damOpen * Math.exp(-(z ** 2) / 0.5);
  return (
    0.9 + valley + slope + noise + reservoir + basin + damWall * (1 - breach)
  );
}

export const demo: DemoModule = {
  alt: "浅い水の高さと流れを格子の上で計算する浅水波モデルのデモ。貯水池のダムを決壊させると、水は地形の低い方へ流れ下り、谷を走って下流のくぼみにたまる。各セルの水面の高さの差から、隣のセルへ流れ出す量（流量）を求め、流れ込んだ量と流れ出た量の差で水の深さを更新している。地形をクリックすると、その場所に水を注げる。",
  camera: { position: [0, 11, 11], target: [0, 0.5, 0] },
  controls: [
    { type: "button", key: "break", label: "ダムを決壊させる" },
    { type: "button", key: "reset", label: "最初に戻す" },
    { type: "toggle", key: "rain", label: "雨を降らせる", value: false },
    {
      type: "select",
      key: "view",
      label: "水の色",
      value: "depth",
      options: [
        { value: "depth", label: "深さ" },
        { value: "speed", label: "流れの速さ" },
      ],
    },
  ],
  legend: [
    { color: palette.sky, label: "深い水" },
    { color: palette.ink, label: "速い流れ（白く泡立つ）" },
  ],
  hint: "地形をクリックすると、その場所に水を注ぎます。",
  setup(context) {
    const { scene, params } = context;
    const count = N * N;
    const ground = new Float32Array(count);
    const depth = new Float32Array(count);
    const flux = new Float32Array(count * 4); // 左・右・上・下へ流れ出る量
    const speed = new Float32Array(count);
    let damOpen = 0;
    const cellX = (i: number) => (i + 0.5) * CELL - SIZE / 2;
    const buildGround = () => {
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          ground[j * N + i] = baseTerrain(cellX(i), cellX(j), damOpen);
        }
      }
    };
    const reset = () => {
      damOpen = 0;
      buildGround();
      flux.fill(0);
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const index = j * N + i;
          const x = cellX(i);
          // 貯水池（ダムより上流）に水をためておく
          depth[index] =
            x < -2.2 ? Math.max(0, 1.55 - (ground[index] ?? 0)) : 0;
        }
      }
    };
    reset();

    const makeGrid = (color: string, options: { transparent?: boolean }) => {
      const geometry = new PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
      geometry.rotateX(-Math.PI / 2);
      geometry.setAttribute(
        "color",
        new BufferAttribute(new Float32Array(count * 3), 3)
      );
      const material = new MeshStandardMaterial({
        color,
        vertexColors: true,
        roughness: options.transparent ? 0.15 : 0.9,
        transparent: options.transparent ?? false,
        opacity: options.transparent ? 0.88 : 1,
      });
      const mesh = new Mesh(geometry, material);
      mesh.receiveShadow = true;
      mesh.castShadow = !options.transparent;
      return mesh;
    };
    const terrainMesh = makeGrid("#ffffff", {});
    const waterMesh = makeGrid("#ffffff", { transparent: true });
    scene.add(terrainMesh, waterMesh);
    const tint = new Color();
    const paintTerrain = () => {
      const position = terrainMesh.geometry.getAttribute("position");
      const colors = terrainMesh.geometry.getAttribute("color");
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          // PlaneGeometry の頂点は上（-z）の行から並ぶので、行を合わせる
          const vertex = j * N + i;
          const h = ground[j * N + i] ?? 0;
          position.setY(vertex, h);
          tint
            .setRGB(0.3, 0.26, 0.2)
            .lerp(new Color(0.2, 0.3, 0.15), smoothstep(0.6, 1.8, h));
          if (Math.abs(cellX(i) + 2.1) < 0.35 && h > 1.3) {
            tint.setRGB(0.55, 0.55, 0.58);
          }
          colors.setXYZ(vertex, tint.r, tint.g, tint.b);
        }
      }
      position.needsUpdate = true;
      colors.needsUpdate = true;
      terrainMesh.geometry.computeVertexNormals();
    };
    paintTerrain();

    const step = (dt: number) => {
      const damping = 0.9995;
      // 1. 水面の高さの差から、隣へ流れ出す量を更新する
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const index = j * N + i;
          const surface = (ground[index] ?? 0) + (depth[index] ?? 0);
          const neighbors = [
            i > 0 ? index - 1 : -1,
            i < N - 1 ? index + 1 : -1,
            j > 0 ? index - N : -1,
            j < N - 1 ? index + N : -1,
          ];
          let total = 0;
          for (let side = 0; side < 4; side++) {
            const other = neighbors[side] ?? -1;
            let value = 0;
            if (other >= 0) {
              const difference =
                surface - ((ground[other] ?? 0) + (depth[other] ?? 0));
              value = Math.max(
                0,
                (flux[index * 4 + side] ?? 0) * damping +
                  dt * GRAVITY * difference * CELL
              );
            }
            flux[index * 4 + side] = value;
            total += value;
          }
          // 持っている水より多くは流せない
          const available = ((depth[index] ?? 0) * CELL * CELL) / dt;
          if (total > available && total > 0) {
            const scale = available / total;
            for (let side = 0; side < 4; side++) {
              flux[index * 4 + side] = (flux[index * 4 + side] ?? 0) * scale;
            }
          }
        }
      }
      // 2. 流れ込んだ量と流れ出た量の差で深さを更新する
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const index = j * N + i;
          const inflow =
            (i > 0 ? (flux[(index - 1) * 4 + 1] ?? 0) : 0) +
            (i < N - 1 ? (flux[(index + 1) * 4] ?? 0) : 0) +
            (j > 0 ? (flux[(index - N) * 4 + 3] ?? 0) : 0) +
            (j < N - 1 ? (flux[(index + N) * 4 + 2] ?? 0) : 0);
          const outflow =
            (flux[index * 4] ?? 0) +
            (flux[index * 4 + 1] ?? 0) +
            (flux[index * 4 + 2] ?? 0) +
            (flux[index * 4 + 3] ?? 0);
          depth[index] = Math.max(
            0,
            (depth[index] ?? 0) + (dt * (inflow - outflow)) / (CELL * CELL)
          );
          const vx =
            ((i > 0 ? (flux[(index - 1) * 4 + 1] ?? 0) : 0) -
              (flux[index * 4] ?? 0) +
              (flux[index * 4 + 1] ?? 0) -
              (i < N - 1 ? (flux[(index + 1) * 4] ?? 0) : 0)) /
            2;
          const vz =
            ((j > 0 ? (flux[(index - N) * 4 + 3] ?? 0) : 0) -
              (flux[index * 4 + 2] ?? 0) +
              (flux[index * 4 + 3] ?? 0) -
              (j < N - 1 ? (flux[(index + N) * 4 + 2] ?? 0) : 0)) /
            2;
          speed[index] =
            Math.hypot(vx, vz) / Math.max(CELL * (depth[index] ?? 0), 1e-3);
          // 画面の端から水が抜ける（下流側）
          if (i === N - 1) {
            depth[index] = (depth[index] ?? 0) * 0.9;
          }
        }
      }
    };

    const paintWater = () => {
      const position = waterMesh.geometry.getAttribute("position");
      const colors = waterMesh.geometry.getAttribute("color");
      const bySpeed = params["view"] === "speed";
      for (let index = 0; index < count; index++) {
        const d = depth[index] ?? 0;
        const wet = d > 0.004;
        position.setY(
          index,
          wet ? (ground[index] ?? 0) + d : (ground[index] ?? 0) - 0.05
        );
        if (bySpeed) {
          const s = clamp((speed[index] ?? 0) / 3);
          tint.setRGB(0.1 + s * 0.85, 0.35 + s * 0.6, 0.6 + s * 0.35);
        } else {
          const deep = clamp(d / 0.8);
          const foam = clamp(((speed[index] ?? 0) - 1.5) / 3) * 0.7;
          tint
            .setRGB(0.25 - deep * 0.18, 0.55 - deep * 0.3, 0.75 - deep * 0.25)
            .lerp(new Color(0.9, 0.95, 1), foam);
        }
        colors.setXYZ(index, tint.r, tint.g, tint.b);
      }
      position.needsUpdate = true;
      colors.needsUpdate = true;
      waterMesh.geometry.computeVertexNormals();
    };

    context.onPick(
      (point) => {
        const i = Math.round((point.x + SIZE / 2) / CELL - 0.5);
        const j = Math.round((point.z + SIZE / 2) / CELL - 0.5);
        for (let dj = -4; dj <= 4; dj++) {
          for (let di = -4; di <= 4; di++) {
            const x = i + di;
            const z = j + dj;
            if (x >= 0 && x < N && z >= 0 && z < N && di * di + dj * dj <= 16) {
              depth[z * N + x] = (depth[z * N + x] ?? 0) + 0.35;
            }
          }
        }
      },
      { origin: [0, 1, 0] }
    );

    return {
      action(key) {
        if (key === "break") {
          damOpen = 1;
          buildGround();
          paintTerrain();
        } else if (key === "reset") {
          reset();
          paintTerrain();
        }
      },
      update({ dt }) {
        if (params["rain"] === true) {
          for (let index = 0; index < count; index += 3) {
            depth[index] = (depth[index] ?? 0) + dt * 0.006;
          }
        }
        const substeps = 4;
        for (let s = 0; s < substeps; s++) {
          step(Math.min(dt, 1 / 30) / substeps);
        }
        paintWater();
        let volume = 0;
        for (let index = 0; index < count; index++) {
          volume += depth[index] ?? 0;
        }
        context.readout("水の量", `${(volume * CELL * CELL).toFixed(1)} m³`);
        context.readout("格子", `${N}×${N}`);
        context.caption(
          damOpen > 0
            ? "ダムが壊れると、貯水池の水面と下流の高さの差で大きな流れが生まれ、谷を走り下って、くぼみにたまっていく。水は地形の形に沿って流れ、行き場のない所ではたまる。"
            : "各セルの「地面の高さ + 水の深さ」が隣より高ければ、その差に応じて水が流れ出す。流れ込む量と流れ出す量の差で深さが変わる。まずはダムを決壊させてみよう。"
        );
      },
    };
  },
};
