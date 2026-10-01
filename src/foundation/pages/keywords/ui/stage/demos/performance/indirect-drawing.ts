import {
  CircleGeometry,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { diagramPanel, svg } from "../../arena";
import { palette, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";

const COUNT = 5000;
const RADIUS = 13;
const FOV = (70 * Math.PI) / 180;
const RANGE = 11;
const INDEX_COUNT = 36;

export const demo: DemoModule = {
  alt: "画面に描く物体の数を GPU 自身が決める、インダイレクト描画（間接描画）のデモ。上から見た地図の中心にゲームのカメラがあり、見える範囲（扇形）の中の物体だけを描く。見える物体の選び出し（カリング）を GPU で行うと、何個見えたかは GPU のメモリの中にある。CPU がその数を読み戻してから描画命令を出すと、読み戻しの遅れの分だけ古い結果で描くことになり、カメラを速く回すと、扇形の先の方で描き漏れ（赤）が出る。インダイレクト描画では、GPU が描画命令の引数（描く個数など）を自分でバッファに書き、その同じフレームのうちにそのバッファを使って描くので、遅れがない。WebGL には間接描画の命令がないので、このデモは流れを再現したもの。",
  camera: { position: [0, 20, 9], target: [0, 0, 0.5], fov: 45, orbit: false },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "描く数の決め方",
      value: "readback",
      options: [
        { value: "readback", label: "CPU が数を読み戻してから描く" },
        { value: "indirect", label: "インダイレクト描画（GPU が引数を書く）" },
      ],
    },
    {
      type: "range",
      key: "latency",
      label: "読み戻しの遅れ（フレーム）",
      min: 1,
      max: 6,
      step: 1,
      value: 3,
    },
    {
      type: "range",
      key: "spin",
      label: "カメラを回す速さ",
      min: 0,
      max: 3,
      step: 0.1,
      value: 1.4,
    },
  ],
  legend: [
    { color: palette.lime, label: "描いた物体" },
    { color: palette.coral, label: "見えているのに描き漏れた物体" },
    { color: palette.muted, label: "カメラの外（描かない）" },
    { color: palette.sky, label: "カメラの見える範囲" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(6);
    const positions = Array.from({ length: COUNT }, () => {
      const r = Math.sqrt(random()) * RADIUS;
      const a = random() * Math.PI * 2;
      return new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    });
    const geometry = new CylinderGeometry(0.07, 0.1, 0.35, 6).translate(
      0,
      0.17,
      0
    );
    const all = new InstancedMesh(
      geometry,
      standard("#3a4658", { roughness: 0.9 }),
      COUNT
    );
    const drawn = new InstancedMesh(
      geometry,
      standard(palette.lime, { roughness: 0.6, emissive: 0.3 }),
      COUNT
    );
    const missing = new InstancedMesh(
      geometry,
      standard(palette.coral, { roughness: 0.6, emissive: 0.5 }),
      COUNT
    );
    const matrix = new Matrix4();
    for (const [i, p] of positions.entries()) {
      matrix.makeTranslation(p.x, 0, p.z);
      all.setMatrixAt(i, matrix);
    }
    for (const mesh of [all, drawn, missing]) {
      mesh.frustumCulled = false;
      scene.add(mesh);
    }
    drawn.scale.setScalar(1.01);
    const wedge = new Mesh(
      new CircleGeometry(RANGE, 48, Math.PI / 2 - FOV / 2, FOV),
      new MeshBasicMaterial({
        color: palette.sky,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      })
    );
    wedge.rotation.x = -Math.PI / 2;
    wedge.position.y = 0.01;
    scene.add(wedge);
    const cameraMarker = standard(palette.sky, { emissive: 0.5 });
    const eye = new Mesh(
      new CylinderGeometry(0, 0.35, 0.7, 4).rotateX(Math.PI / 2),
      cameraMarker
    );
    eye.position.y = 0.35;
    scene.add(eye);

    const { root } = diagramPanel(context, {
      title: "描画命令の引数バッファ（DrawElementsIndirect）",
      width: 320,
      height: 150,
      rem: 17,
    });
    const fields = [
      "indexCount",
      "instanceCount",
      "firstIndex",
      "baseVertex",
      "firstInstance",
    ];
    const values = fields.map((name, i) => {
      root.append(
        svg(
          "text",
          {
            x: 10,
            y: 22 + i * 22,
            fill: "#8f9eb3",
            "font-size": 12,
            "font-family": "monospace",
          },
          name
        )
      );
      const value = svg("text", {
        x: 170,
        y: 22 + i * 22,
        fill: "#e8eef6",
        "font-size": 12,
        "font-family": "monospace",
      });
      root.append(value);
      return value;
    });
    const writer = svg("text", {
      x: 10,
      y: 140,
      fill: palette.amber,
      "font-size": 11,
    });
    root.append(writer);

    let yaw = 0;
    const history: number[][] = [];
    const visible = new Uint8Array(COUNT);

    return {
      update({ dt }) {
        yaw += dt * Number(params["spin"]);
        eye.rotation.y = yaw;
        wedge.rotation.z = yaw + Math.PI;
        const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        // カリング（本来は GPU のコンピュートシェーダーで行う）：見える物体の番号を詰めて並べる
        const list: number[] = [];
        for (const [i, p] of positions.entries()) {
          const distance = p.length();
          const inside =
            distance < RANGE &&
            (distance < 0.5 || forward.angleTo(p) < FOV / 2);
          visible[i] = inside ? 1 : 0;
          if (inside) {
            list.push(i);
          }
        }
        history.push(list);
        const latency = Number(params["latency"]);
        while (history.length > latency + 1) {
          history.shift();
        }
        const indirect = params["mode"] === "indirect";
        const used = indirect ? list : (history[0] ?? list);
        const usedSet = new Set(used);
        for (const [slot, i] of used.entries()) {
          const p = positions[i];
          if (p) {
            matrix.makeTranslation(p.x, 0, p.z);
            drawn.setMatrixAt(slot, matrix);
          }
        }
        drawn.count = used.length;
        drawn.instanceMatrix.needsUpdate = true;
        let missed = 0;
        for (const i of list) {
          if (!usedSet.has(i)) {
            const p = positions[i];
            if (p) {
              matrix.makeTranslation(p.x, 0, p.z);
              missing.setMatrixAt(missed++, matrix);
            }
          }
        }
        missing.count = missed;
        missing.instanceMatrix.needsUpdate = true;
        const wasted = used.filter((i) => visible[i] === 0).length;

        const args = [INDEX_COUNT, used.length, 0, 0, 0];
        for (const [k, text] of values.entries()) {
          text.textContent = `${args[k] ?? 0}`;
          text.setAttribute("fill", k === 1 ? palette.lime : "#e8eef6");
        }
        writer.textContent = indirect
          ? "instanceCount は GPU のカリングが同じフレームで書き込む"
          : `instanceCount は CPU が ${latency} フレーム前の結果を読み戻して書く`;
        context.readout("見えている物体", `${list.length}`);
        context.readout("描いた物体", `${used.length}`);
        context.readout("描き漏れ / むだに描いた", `${missed} / ${wasted}`);
        context.caption(
          indirect
            ? "GPU がカリングの結果から、描く個数（instanceCount）を引数バッファに直接書き、描画命令はそのバッファを参照する。CPU は数を知らなくてよいので、読み戻しの待ちも遅れもなく、見えている物体がそのフレームのうちに全部描かれる。"
            : "カリングの結果（何個見えたか）は GPU の中にある。CPU が読み戻すには GPU の処理が終わるのを待つ必要があり、待たないようにすると数フレーム古い結果を使うことになる。カメラを回すと、扇形の先の方の新しく見えた物体が描かれず（赤）、後ろの見えなくなった物体をむだに描く。"
        );
      },
      dispose() {
        geometry.dispose();
        all.dispose();
        drawn.dispose();
        missing.dispose();
      },
    };
  },
};
