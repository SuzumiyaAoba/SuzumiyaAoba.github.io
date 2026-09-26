import {
  BufferAttribute,
  Color,
  ConeGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { fbm2, palette, rng, smoothstep } from "../../kit";
import type { DemoModule } from "../../types";

const SIZE = 10;
const N = 110;
const GRASS = 9000;
const TREES = 700;
const ROCKS = 400;

/** 地形の高さ：なだらかな丘と、真ん中を流れる川の谷、奥の急な山。 */
function heightAt(x: number, z: number) {
  const river = Math.exp(-((z - Math.sin(x * 0.5) * 1.2) ** 2) / 0.6);
  const hills = fbm2(x * 0.22 + 3, z * 0.22 + 1, 5) * 1.6;
  const mountain =
    smoothstep(0.5, 4.5, -z) * 2.2 * (0.6 + fbm2(x * 0.5, z * 0.5, 4));
  return hills + mountain - river * 0.9 + 0.2;
}

export const demo: DemoModule = {
  alt: "地面の場所ごとの「生えやすさ」（密度マスク）に合わせて、草・木・岩の配置の数を変えるデモ。マスクは、標高（高すぎる所は生えない）、斜面の急さ（崖には生えない）、ノイズ（まとまりのむら）を掛け合わせて作り、さらに地面をドラッグして手で塗り足せる。候補の点を先に決めておき、それぞれに固定の乱数を持たせて「乱数 < マスクの値」なら置くので、マスクを塗っても既にある草が入れ替わらず、塗った所だけが増える。",
  camera: { position: [0, 9.5, 11], target: [0, 0.2, 0], fov: 42 },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "配置の決め方",
      value: "mask",
      options: [
        { value: "mask", label: "密度マスクに従う" },
        { value: "uniform", label: "一様にばらまく（比較用）" },
      ],
    },
    {
      type: "toggle",
      key: "useHeight",
      label: "標高（高い所は生えない）",
      value: true,
    },
    {
      type: "toggle",
      key: "useSlope",
      label: "斜面（急な所は生えない）",
      value: true,
    },
    {
      type: "toggle",
      key: "useNoise",
      label: "ノイズ（まとまりのむら）",
      value: true,
    },
    {
      type: "range",
      key: "density",
      label: "全体の密度",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.7,
    },
    {
      type: "toggle",
      key: "overlay",
      label: "草のマスクを地面に表示",
      value: false,
    },
    {
      type: "select",
      key: "brush",
      label: "ドラッグしたとき",
      value: "add",
      options: [
        { value: "add", label: "草を塗り足す" },
        { value: "erase", label: "草を消す（道を作る）" },
      ],
    },
    { type: "button", key: "clear", label: "塗ったものを消す" },
  ],
  legend: [
    { color: "#9fcf5a", label: "草（低くてなだらかな所）" },
    { color: "#2f6b34", label: "木（ノイズのまとまり × 標高）" },
    { color: "#8e8a80", label: "岩（急な斜面）" },
  ],
  hint: "地面をドラッグすると、その場所の草のマスクを塗り足したり消したりできます。",
  setup(context) {
    const { scene, params, pointer } = context;
    const geometry = new PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
      positions.setY(
        index,
        heightAt(positions.getX(index), positions.getZ(index))
      );
    }
    geometry.computeVertexNormals();
    const colors = new Float32Array(positions.count * 3);
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    const ground = new Mesh(
      geometry,
      new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })
    );
    ground.receiveShadow = true;
    scene.add(ground);
    const water = new Mesh(
      new PlaneGeometry(SIZE, SIZE),
      new MeshStandardMaterial({
        color: "#3b7fc4",
        transparent: true,
        opacity: 0.65,
        roughness: 0.2,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.35;
    scene.add(water);

    const grass = new InstancedMesh(
      new ConeGeometry(0.035, 0.22, 4),
      new MeshStandardMaterial({ color: "#9fcf5a", roughness: 0.8 }),
      GRASS
    );
    const trees = new InstancedMesh(
      new IcosahedronGeometry(0.16, 0),
      new MeshStandardMaterial({
        color: "#2f6b34",
        roughness: 0.8,
        flatShading: true,
      }),
      TREES
    );
    const rocks = new InstancedMesh(
      new IcosahedronGeometry(0.1, 0),
      new MeshStandardMaterial({
        color: "#8e8a80",
        roughness: 0.9,
        flatShading: true,
      }),
      ROCKS
    );
    for (const layer of [grass, trees, rocks]) {
      layer.castShadow = true;
      layer.frustumCulled = false;
      scene.add(layer);
    }

    // 候補の点と、それぞれの固定の乱数（塗り直しても草が入れ替わらないように）
    const random = rng(7);
    const candidate = (count: number) =>
      Array.from({ length: count }, () => {
        const x = (random() - 0.5) * SIZE * 0.98;
        const z = (random() - 0.5) * SIZE * 0.98;
        return {
          x,
          z,
          y: heightAt(x, z),
          threshold: random(),
          scale: 0.6 + random() * 0.8,
          turn: random() * Math.PI * 2,
        };
      });
    const grassPoints = candidate(GRASS);
    const treePoints = candidate(TREES);
    const rockPoints = candidate(ROCKS);
    const paint = new Float32Array(N * N);

    const slopeAt = (x: number, z: number) => {
      const e = 0.08;
      const dx = heightAt(x + e, z) - heightAt(x - e, z);
      const dz = heightAt(x, z + e) - heightAt(x, z - e);
      return Math.hypot(dx, dz) / (2 * e);
    };
    const paintAt = (x: number, z: number) => {
      const i = Math.round((x / SIZE + 0.5) * (N - 1));
      const j = Math.round((z / SIZE + 0.5) * (N - 1));
      return (
        paint[
          Math.max(0, Math.min(N - 1, j)) * N + Math.max(0, Math.min(N - 1, i))
        ] ?? 0
      );
    };
    /** 草の密度マスク（0〜1）。有効にした条件を掛け合わせ、最後に手で塗った分を足し引きする。 */
    const grassMask = (x: number, z: number, y: number) => {
      if (params["mode"] === "uniform") {
        return 1;
      }
      let mask = 1;
      if (params["useHeight"] === true) {
        mask *= 1 - smoothstep(1.1, 2.2, y);
        mask *= smoothstep(-0.4, -0.15, y); // 水の中には生えない
      }
      if (params["useSlope"] === true) {
        mask *= 1 - smoothstep(0.5, 1.1, slopeAt(x, z));
      }
      if (params["useNoise"] === true) {
        mask *= smoothstep(-0.15, 0.25, fbm2(x * 0.45 + 20, z * 0.45 - 4, 4));
      }
      return Math.max(0, Math.min(1, mask + paintAt(x, z)));
    };
    const treeMask = (x: number, z: number, y: number) => {
      if (params["mode"] === "uniform") {
        return 1;
      }
      let mask = smoothstep(-0.02, 0.18, fbm2(x * 0.3 - 7, z * 0.3 + 11, 4));
      mask *= smoothstep(-0.1, 0.2, y) * (1 - smoothstep(1.4, 2.4, y));
      mask *= 1 - smoothstep(0.6, 1, slopeAt(x, z));
      return Math.max(0, mask - Math.max(0, -paintAt(x, z)));
    };
    const rockMask = (x: number, z: number, y: number) => {
      if (params["mode"] === "uniform") {
        return 1;
      }
      return smoothstep(0.7, 1.3, slopeAt(x, z)) * smoothstep(-0.2, 0, y);
    };

    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const place = (
      layer: InstancedMesh,
      points: typeof grassPoints,
      mask: (x: number, z: number, y: number) => number,
      lift: number,
      scale: number
    ) => {
      const density = Number(params["density"]);
      let count = 0;
      for (const point of points) {
        if (point.threshold < mask(point.x, point.z, point.y) * density) {
          quaternion.setFromAxisAngle(up, point.turn);
          const s = point.scale * scale;
          matrix.compose(
            new Vector3(point.x, point.y + lift * s, point.z),
            quaternion,
            new Vector3(s, s, s)
          );
          layer.setMatrixAt(count, matrix);
          count++;
        }
      }
      layer.count = count;
      layer.instanceMatrix.needsUpdate = true;
      return count;
    };

    const dirt = new Color("#9c8a68");
    const lush = new Color("#5f8a3e");
    const rock = new Color("#8a847a");
    const maskColor = new Color(palette.lime);
    const color = new Color();
    const recolor = () => {
      const overlay = params["overlay"] === true;
      for (let index = 0; index < positions.count; index++) {
        const x = positions.getX(index);
        const z = positions.getZ(index);
        const y = positions.getY(index);
        const slope = slopeAt(x, z);
        color
          .copy(dirt)
          .lerp(lush, 1 - smoothstep(0.8, 2, y))
          .lerp(rock, smoothstep(0.6, 1.2, slope));
        if (overlay) {
          color
            .lerp(maskColor, grassMask(x, z, y) * 0.8)
            .multiplyScalar(0.6 + grassMask(x, z, y) * 0.4);
        }
        colors.set([color.r, color.g, color.b], index * 3);
      }
      geometry.getAttribute("color").needsUpdate = true;
    };

    let signature = "";
    let dirty = true;
    const hover = new Vector3();
    return {
      action(key) {
        if (key === "clear") {
          paint.fill(0);
          dirty = true;
        }
      },
      update({ dt }) {
        const key = [
          "mode",
          "useHeight",
          "useSlope",
          "useNoise",
          "density",
          "overlay",
        ]
          .map((name) => String(params[name]))
          .join("|");
        if (key !== signature) {
          signature = key;
          dirty = true;
        }
        // ブラシ：ドラッグした所の草のマスクを増やす（消す）
        const hit = context.pointerOnPlane(
          { normal: [0, 1, 0], origin: [0, 0.2, 0] },
          hover
        );
        if (
          hit &&
          pointer.down &&
          Math.abs(hit.x) < SIZE / 2 &&
          Math.abs(hit.z) < SIZE / 2
        ) {
          const sign = params["brush"] === "erase" ? -1 : 1;
          const radius = 0.7;
          for (let j = 0; j < N; j++) {
            for (let i = 0; i < N; i++) {
              const x = (i / (N - 1) - 0.5) * SIZE;
              const z = (j / (N - 1) - 0.5) * SIZE;
              const d = Math.hypot(x - hit.x, z - hit.z);
              if (d < radius) {
                const index = j * N + i;
                paint[index] = Math.max(
                  -1,
                  Math.min(
                    1,
                    (paint[index] ?? 0) + sign * (1 - d / radius) * dt * 4
                  )
                );
              }
            }
          }
          dirty = true;
        }
        if (dirty) {
          dirty = false;
          const grassCount = place(grass, grassPoints, grassMask, 0.1, 1);
          const treeCount = place(trees, treePoints, treeMask, 0.2, 1.2);
          const rockCount = place(rocks, rockPoints, rockMask, 0.03, 1);
          recolor();
          context.readout(
            "草 / 木 / 岩",
            `${grassCount} / ${treeCount} / ${rockCount}`
          );
        }
        context.caption(
          params["mode"] === "uniform"
            ? "マスクを使わずに一様にばらまくと、水の中にも崖にも山頂にも同じように草や木が生え、不自然な景色になる。"
            : "標高・斜面・ノイズから作ったマスクの値を「その場所に置く確率」として使う。草は低くなだらかな所に、木はノイズのまとまりに沿って林になり、岩は急な斜面に集まる。地面をドラッグすると、塗った所だけ草が増える（消せば道ができる）。"
        );
      },
    };
  },
};
