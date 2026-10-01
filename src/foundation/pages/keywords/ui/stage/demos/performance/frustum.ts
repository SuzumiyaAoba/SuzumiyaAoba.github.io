import {
  BoxGeometry,
  CircleGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { palette, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const COUNT = 700;
const FOV = (80 * Math.PI) / 180;
const FAR = 15;
const BINS = 160;
const EYE = new Vector3(-7.5, 0, 0);

type Wall = { x0: number; z0: number; x1: number; z1: number };
const WALLS: readonly Wall[] = [
  { x0: -3.5, z0: -0.9, x1: -3.2, z1: 1.6 },
  { x0: -1, z0: -4, x1: 0.4, z1: -3.7 },
  { x0: 0.5, z0: 0.5, x1: 0.8, z1: 3.8 },
  { x0: 2.5, z0: -2.5, x1: 4.5, z1: -2.2 },
  { x0: -2, z0: 3, x1: -0.5, z1: 3.3 },
  { x0: 4.5, z0: 0.8, x1: 4.8, z1: 2.6 },
];

type Mode = "none" | "frustum" | "occlusion";

export const demo: DemoModule = {
  alt: "画面に映らない物体を描く前に外すカリングのデモ。左のカメラ（青い扇形が見える範囲、視錐台）から見て、扇形の外にある物体を外すのが視錐台カリング。さらに、壁の後ろに隠れて見えない物体を外すのがオクルージョン（遮蔽）カリング。遮蔽の判定では、まず壁だけを描いて「方向ごとの一番手前の距離」（深度バッファ、右下のグラフ）を作り、物体がその距離より奥にあれば描かない。描く物体の数を、カリングなし・視錐台だけ・遮蔽までで比べられる。",
  camera: {
    position: [0, 16, 6],
    target: [0.5, 0, 0.3],
    fov: 42,
    orbit: false,
  },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "カリング",
      value: "occlusion",
      options: [
        { value: "none", label: "なし（全部描く）" },
        { value: "frustum", label: "視錐台カリング" },
        { value: "occlusion", label: "視錐台 + 遮蔽カリング" },
      ],
    },
    {
      type: "range",
      key: "spin",
      label: "カメラを振る速さ",
      min: 0,
      max: 2,
      step: 0.1,
      value: 0.5,
    },
  ],
  legend: [
    { color: palette.lime, label: "描く物体" },
    { color: palette.violet, label: "壁に隠れて外した物体" },
    { color: "#3a4352", label: "視錐台の外で外した物体" },
    { color: palette.sky, label: "カメラの見える範囲" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(2);
    const positions: Vector3[] = [];
    while (positions.length < COUNT) {
      const p = new Vector3((random() - 0.5) * 18, 0, (random() - 0.5) * 11);
      if (p.distanceTo(EYE) > 1.2) {
        positions.push(p);
      }
    }
    const boxes = new InstancedMesh(
      new BoxGeometry(0.22, 0.3, 0.22).translate(0, 0.15, 0),
      standard("#ffffff", { roughness: 0.6 }),
      COUNT
    );
    const matrix = new Matrix4();
    for (const [i, p] of positions.entries()) {
      matrix.makeTranslation(p.x, 0, p.z);
      boxes.setMatrixAt(i, matrix);
    }
    boxes.frustumCulled = false;
    scene.add(boxes);
    for (const wall of WALLS) {
      const mesh = new Mesh(
        new BoxGeometry(wall.x1 - wall.x0, 1.1, wall.z1 - wall.z0),
        standard("#8a97ab")
      );
      mesh.position.set((wall.x0 + wall.x1) / 2, 0.55, (wall.z0 + wall.z1) / 2);
      mesh.castShadow = true;
      scene.add(mesh);
    }
    const wedge = new Mesh(
      new CircleGeometry(FAR, 64, Math.PI / 2 - FOV / 2, FOV),
      new MeshBasicMaterial({
        color: palette.sky,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      })
    );
    wedge.rotation.x = -Math.PI / 2;
    wedge.position.set(EYE.x, 0.01, EYE.z);
    scene.add(wedge);
    const eye = new Mesh(
      new BoxGeometry(0.5, 0.4, 0.3),
      standard(palette.sky, { emissive: 0.5 })
    );
    eye.position.set(EYE.x, 0.2, EYE.z);
    scene.add(eye);
    const graph = hudGraph(context, {
      title: "深度バッファ（方向ごとの壁までの距離）",
      min: 0,
      max: FAR,
      xLabel: "左 → 右",
      samples: BINS,
    });
    const colors = {
      draw: new Color(palette.lime),
      hidden: new Color(palette.violet),
      outside: new Color("#3a4352"),
    };
    const depth = new Float32Array(BINS);

    /** 方向（カメラの向きからの角度）を、深度バッファの何番目の欄かに直す。 */
    const binOf = (angle: number) =>
      Math.floor(((angle + FOV / 2) / FOV) * BINS);
    const relativeAngle = (x: number, z: number, yaw: number) => {
      const a = Math.atan2(x - EYE.x, z - EYE.z) - yaw;
      return Math.atan2(Math.sin(a), Math.cos(a));
    };

    return {
      update({ time }) {
        const yaw = Math.PI / 2 + Math.sin(time * Number(params["spin"])) * 0.8;
        wedge.rotation.z = yaw + Math.PI;
        eye.rotation.y = yaw;
        const { mode: raw } = params;
        const mode: Mode =
          raw === "none" || raw === "frustum" ? raw : "occlusion";
        // 1. 壁だけを描いて深度バッファを作る（欄ごとに最も近い距離）
        depth.fill(FAR);
        for (const wall of WALLS) {
          const steps = 60;
          const corners: [number, number][] = [
            [wall.x0, wall.z0],
            [wall.x1, wall.z0],
            [wall.x1, wall.z1],
            [wall.x0, wall.z1],
          ];
          for (let e = 0; e < 4; e++) {
            const [ax, az] = corners[e] ?? [0, 0];
            const [bx, bz] = corners[(e + 1) % 4] ?? [0, 0];
            for (let s = 0; s <= steps; s++) {
              const x = ax + ((bx - ax) * s) / steps;
              const z = az + ((bz - az) * s) / steps;
              const bin = binOf(relativeAngle(x, z, yaw));
              if (bin >= 0 && bin < BINS) {
                depth[bin] = Math.min(
                  depth[bin] ?? FAR,
                  Math.hypot(x - EYE.x, z - EYE.z)
                );
              }
            }
          }
        }
        // 2. 物体ごとに判定
        let drawn = 0;
        let hidden = 0;
        let outside = 0;
        for (const [i, p] of positions.entries()) {
          const angle = relativeAngle(p.x, p.z, yaw);
          const distance = Math.hypot(p.x - EYE.x, p.z - EYE.z);
          const inFrustum = Math.abs(angle) < FOV / 2 && distance < FAR;
          let state: keyof typeof colors = "draw";
          if (mode !== "none" && !inFrustum) {
            state = "outside";
          } else if (mode === "occlusion" && inFrustum) {
            // 物体が占める方向の範囲で、どこか 1 か所でも壁より手前なら見える
            const spread = Math.atan2(0.15, distance);
            const from = Math.max(0, binOf(angle - spread));
            const to = Math.min(BINS - 1, binOf(angle + spread));
            let visible = false;
            for (let b = from; b <= to; b++) {
              if (distance - 0.15 < (depth[b] ?? FAR)) {
                visible = true;
                break;
              }
            }
            if (!visible) {
              state = "hidden";
            }
          }
          if (state === "draw") {
            drawn++;
          } else if (state === "hidden") {
            hidden++;
          } else {
            outside++;
          }
          boxes.setColorAt(i, colors[state]);
        }
        if (boxes.instanceColor) {
          boxes.instanceColor.needsUpdate = true;
        }
        graph.setSeries([
          {
            color: palette.violet,
            fn: (t) => depth[Math.min(BINS - 1, Math.floor(t * BINS))] ?? FAR,
          },
        ]);
        graph.setMarker(0.5);
        context.readout("描く物体", `${drawn} / ${COUNT}`);
        context.readout("視錐台の外で外した", `${outside}`);
        context.readout("壁に隠れて外した", `${hidden}`);
        context.caption(
          mode === "none"
            ? "カリングなしでは、カメラの後ろや横にある物体、壁の向こうの物体まで、全部を描画に回す。画面に映らない物のために頂点の処理や描画命令の準備をしてしまう。"
            : mode === "frustum"
              ? "視錐台カリング：カメラの見える範囲（青い扇形）の外にある物体を外す。物体の包囲体（箱や球）と、視錐台の 6 枚の面を比べるだけなので安い。ただし、壁の後ろの見えない物体は残る。"
              : "遮蔽カリング：まず壁などの大きな遮蔽物だけを描いて、方向ごとの一番手前の距離（深度バッファ、右下）を作る。物体が占める方向のどこを見ても、それより奥にあれば、隠れていると判断して描かない（紫）。"
        );
      },
      dispose() {
        boxes.dispose();
      },
    };
  },
};
