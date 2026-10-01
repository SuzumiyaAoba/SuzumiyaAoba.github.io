import {
  Color,
  Mesh,
  MeshStandardMaterial,
  TorusKnotGeometry,
  Vector3,
} from "three";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const LEVELS = [
  { tubular: 200, radial: 24, color: palette.lime, name: "LOD0" },
  { tubular: 80, radial: 10, color: palette.sky, name: "LOD1" },
  { tubular: 32, radial: 6, color: palette.amber, name: "LOD2" },
  { tubular: 12, radial: 3, color: palette.coral, name: "LOD3" },
] as const;
/** 画面の高さに対する大きさ（割合）の境目。これより小さくなったら次のレベルへ。 */
const THRESHOLDS = [0.14, 0.06, 0.025];
const ROWS = 24;
const COLS = 7;

export const demo: DemoModule = {
  alt: "遠くの物体を、三角形の少ない簡単な形に切り替える LOD（詳細度）のデモ。手前から奥まで並んだ 168 個の結び目の形それぞれについて、画面の上でどれくらいの大きさに見えるかを計算し、大きく見える物は細かい形（LOD0）、小さく見える物ほど粗い形（LOD3）で描く。色分けを入れると、どの物体がどのレベルかがわかる。LOD を切ると、遠くの米粒のような物体まで細かい形で描くので、三角形の数が何倍にもなる。カメラが前後に動くと、レベルが切り替わる。",
  camera: { position: [0, 3, 10], target: [0, 1, -6], fov: 50, orbit: false },
  controls: [
    { type: "toggle", key: "lod", label: "LOD を使う", value: true },
    { type: "toggle", key: "tint", label: "レベルを色で表示", value: true },
    {
      type: "range",
      key: "bias",
      label: "切り替えの境目（倍率）",
      min: 0.3,
      max: 3,
      step: 0.1,
      value: 1,
      hint: "大きいほど早く（近くで）粗い形に切り替える",
    },
    {
      type: "toggle",
      key: "hysteresis",
      label: "境目に余裕を持たせる（ちらつき防止）",
      value: true,
    },
  ],
  legend: LEVELS.map((level, i) => ({
    color: level.color,
    label: `${level.name}（${(level.tubular * level.radial * 2).toLocaleString()} 三角形）${i === 0 ? "：いちばん細かい" : ""}`,
  })),
  setup(context) {
    const { scene, params, camera } = context;
    const geometries = LEVELS.map((level) =>
      context.track(
        new TorusKnotGeometry(0.45, 0.15, level.tubular, level.radial)
      )
    );
    const triangles = geometries.map((g) => (g.index?.count ?? 0) / 3);
    const random = rng(3);
    const items = Array.from({ length: ROWS * COLS }, (_, i) => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      const material = new MeshStandardMaterial({
        color: "#aab4c3",
        roughness: 0.35,
        metalness: 0.2,
      });
      const mesh = new Mesh(geometries[0], material);
      mesh.position.set((col - (COLS - 1) / 2) * 2.4, 0.8, 4 - row * 3);
      mesh.rotation.set(random() * 6, random() * 6, 0);
      mesh.castShadow = true;
      scene.add(mesh);
      return { mesh, material, level: 0, spin: 0.3 + random() * 0.6 };
    });
    const graph = historyGraph(context, {
      title: "描いた三角形の数（万）",
      min: 0,
      max: 180,
      series: [
        { color: palette.amber, label: "LOD あり" },
        { color: palette.muted, dashed: true, label: "すべて LOD0" },
      ],
    });
    const plain = new Color("#aab4c3");
    const levelColors = LEVELS.map((level) => new Color(level.color));
    const toCamera = new Vector3();

    return {
      update({ time, dt }) {
        // カメラが前後にゆっくり動く
        camera.position.set(
          Math.sin(time * 0.2) * 2,
          3 + Math.sin(time * 0.13),
          10 - (Math.sin(time * 0.25) * 0.5 + 0.5) * 40
        );
        camera.lookAt(camera.position.x * 0.5, 1, camera.position.z - 16);
        const bias = Number(params["bias"]);
        const useLod = params["lod"] === true;
        const tint = params["tint"] === true;
        const margin = params["hysteresis"] === true ? 0.15 : 0;
        const focal = 1 / Math.tan((camera.fov * Math.PI) / 360);
        let total = 0;
        const perLevel = [0, 0, 0, 0];
        for (const item of items) {
          item.mesh.rotation.y += dt * item.spin;
          toCamera.subVectors(item.mesh.position, camera.position);
          const distance = Math.max(0.1, toCamera.length());
          // 画面の高さに対する見かけの大きさ（半径 0.6 の物体）
          const size = ((0.6 / distance) * focal) / bias;
          let level = 0;
          if (useLod) {
            level = THRESHOLDS.filter((threshold) => size < threshold).length;
            // 余裕：今のレベルから離れるには、境目を少し余分に越える必要がある
            if (margin > 0 && level !== item.level) {
              const boundary = THRESHOLDS[Math.min(level, item.level)] ?? 0;
              if (Math.abs(size - boundary) < boundary * margin) {
                ({ level } = item);
              }
            }
          }
          if (
            level !== item.level ||
            item.mesh.geometry !== geometries[level]
          ) {
            item.level = level;
            item.mesh.geometry = geometries[level] ?? item.mesh.geometry;
          }
          item.material.color.copy(
            tint && useLod ? (levelColors[level] ?? plain) : plain
          );
          total += triangles[level] ?? 0;
          perLevel[level] = (perLevel[level] ?? 0) + 1;
        }
        const full = (triangles[0] ?? 0) * items.length;
        graph.push([total / 10_000, full / 10_000]);
        context.readout("描いた三角形", total.toLocaleString());
        context.readout("すべて LOD0 なら", full.toLocaleString());
        context.readout("LOD0 / 1 / 2 / 3 の数", perLevel.join(" / "));
        context.caption(
          useLod
            ? "物体ごとに、画面の上での見かけの大きさ（半径 ÷ 距離）を計算し、境目より小さければ粗い形に切り替える。遠くの物体は数ピクセルにしか映らないので、三角形を減らしても見た目はほとんど変わらない。"
            : "LOD なしでは、遠くの数ピクセルにしか映らない物体まで、いちばん細かい形で描く。見た目はほとんど同じなのに、三角形の数は何倍にもなる。"
        );
      },
    };
  },
};
