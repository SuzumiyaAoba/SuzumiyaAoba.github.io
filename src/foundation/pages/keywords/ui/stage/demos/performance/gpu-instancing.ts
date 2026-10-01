import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const MAX = 12_000;
const AREA = 26;

/** 幹と 2 段の葉を 1 つの形にまとめた木。 */
function treeGeometry() {
  const trunk = new CylinderGeometry(0.05, 0.07, 0.4, 6).translate(0, 0.2, 0);
  const lower = new ConeGeometry(0.32, 0.6, 7).translate(0, 0.62, 0);
  const upper = new ConeGeometry(0.22, 0.5, 7).translate(0, 0.95, 0);
  const merged = mergeGeometries([
    trunk.toNonIndexed(),
    lower.toNonIndexed(),
    upper.toNonIndexed(),
  ]);
  trunk.dispose();
  lower.dispose();
  upper.dispose();
  return merged;
}

export const demo: DemoModule = {
  alt: "同じ形の物体をたくさん描くときに、GPU インスタンシングで描画命令（ドローコール）をまとめるデモ。森の木を 1 本ずつ別の物体として描くと、木の数だけ CPU から GPU へ描画命令を出すので、木が増えるとフレームレートが落ちる。インスタンシングでは、形は 1 つだけ送り、木ごとの位置・向き・大きさ・色を配列で渡して、1 回の描画命令で全部を描く。描画命令の数とフレームレートを比べられる。",
  camera: { position: [0, 9, 17], target: [0, 0, 0], fov: 45, autoRotate: 6 },
  studio: { shadows: false },
  controls: [
    {
      type: "select",
      key: "method",
      label: "描き方",
      value: "instanced",
      options: [
        { value: "separate", label: "1 本ずつ別の物体" },
        { value: "instanced", label: "インスタンシング" },
      ],
    },
    {
      type: "range",
      key: "count",
      label: "木の数",
      min: 500,
      max: MAX,
      step: 500,
      value: 4000,
    },
  ],
  legend: [
    { color: palette.lime, label: "木（色と大きさを 1 本ずつ変えている）" },
  ],
  setup(context) {
    const { scene, params, renderer } = context;
    const geometry = context.track(treeGeometry());
    const random = rng(4);
    const matrices: Matrix4[] = [];
    const colors: Color[] = [];
    const rotation = new Quaternion();
    for (let i = 0; i < MAX; i++) {
      const position = new Vector3(
        (random() - 0.5) * AREA,
        0,
        (random() - 0.5) * AREA
      );
      const scale = 0.6 + random() * 0.9;
      rotation.setFromAxisAngle(new Vector3(0, 1, 0), random() * 6.28);
      matrices.push(
        new Matrix4().compose(
          position,
          rotation,
          new Vector3(scale, scale * (0.8 + random() * 0.5), scale)
        )
      );
      colors.push(
        new Color().setHSL(0.26 + random() * 0.1, 0.45, 0.28 + random() * 0.18)
      );
    }
    // インスタンシング：形 1 つ + 行列と色の配列
    const instanced = new InstancedMesh(
      geometry,
      new MeshStandardMaterial({ roughness: 0.8 }),
      MAX
    );
    for (let i = 0; i < MAX; i++) {
      instanced.setMatrixAt(i, matrices[i] ?? new Matrix4());
      instanced.setColorAt(i, colors[i] ?? new Color());
    }
    scene.add(instanced);
    // 1 本ずつ別の物体：色ごとにマテリアルを分ける（よくある素朴な作り方）
    const palettes = Array.from({ length: 8 }, (_, k) =>
      context.track(
        new MeshStandardMaterial({
          roughness: 0.8,
          color: new Color().setHSL(
            0.26 + k * 0.012,
            0.45,
            0.28 + (k % 4) * 0.045
          ),
        })
      )
    );
    const separate = new Group();
    const meshes: Mesh[] = [];
    for (let i = 0; i < MAX; i++) {
      const mesh = new Mesh(geometry, palettes[i % palettes.length]);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(matrices[i] ?? new Matrix4());
      meshes.push(mesh);
    }
    scene.add(separate);
    const graph = historyGraph(context, {
      title: "描画命令を出す CPU の時間（ミリ秒）",
      min: 0,
      max: 20,
      series: [{ color: palette.amber }],
    });
    let shownCount = -1;
    let shownMethod = "";
    let fps = 60;
    let renderCost = 0;
    // 描画命令を出す CPU 側の時間を測る（GPU の完了は待たない）
    context.setRender(() => {
      const start = performance.now();
      renderer.render(scene, context.camera);
      renderCost += (performance.now() - start - renderCost) * 0.1;
    });

    return {
      update({ dt }) {
        const count = Number(params["count"]);
        const method = String(params["method"]);
        if (count !== shownCount || method !== shownMethod) {
          shownCount = count;
          shownMethod = method;
          instanced.count = count;
          instanced.visible = method === "instanced";
          separate.clear();
          if (method === "separate") {
            for (let i = 0; i < count; i++) {
              const mesh = meshes[i];
              if (mesh) {
                separate.add(mesh);
              }
            }
          }
        }
        fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;
        graph.push([renderCost]);
        const { calls, triangles } = renderer.info.render;
        context.readout(
          "描画命令（ドローコール）",
          `${calls.toLocaleString()} 回`
        );
        context.readout("三角形", triangles.toLocaleString());
        context.readout(
          "描画命令を出す CPU の時間",
          `${renderCost.toFixed(2)} ms`
        );
        context.readout("フレームレート", `${fps.toFixed(0)} fps`);
        context.caption(
          method === "instanced"
            ? `インスタンシングでは、木の形を 1 つだけ GPU に送り、${count.toLocaleString()} 本分の位置・向き・大きさ・色を配列で渡して、1 回の描画命令で描く。三角形の数は同じでも、CPU の仕事がほとんどなくなる。`
            : `1 本ずつ描くと、木の数だけ描画命令を出す。命令ごとに CPU で状態の設定と確認が必要なので、三角形の数は同じでも、木を増やすと描画命令を出す CPU の時間（右下）が増え、やがてフレームレートが落ちる。`
        );
      },
      dispose() {
        instanced.dispose();
      },
    };
  },
};
