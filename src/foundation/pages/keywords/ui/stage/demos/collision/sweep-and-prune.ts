import {
  Color,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from "three";
import { TAU, palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

const COUNT = 30;
const WIDTH = 11;
const DEPTH = 5;
const LANES = 6;
const AXIS_Z = DEPTH / 2 + 0.7;
const SWEEP_SECONDS = 4;

type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
};
type Endpoint = { value: number; box: number; start: boolean };

export const demo: DemoModule = {
  alt: "たくさんの箱の中から、重なっている組を素早く探すスイープ・アンド・プルーンのデモ。各箱を x 軸に投影した区間の端点（始まりと終わり）を、小さい順に並べておく。左から順に見ていき、始まりの端点に来たら、今開いている区間（アクティブな箱）と組にし、終わりの端点で閉じる。x で重なった組だけを y でも調べれば、全部の組を比べずに済む。物体はフレームごとに少ししか動かないので、前のフレームの並びを挿入ソートで直すだけで、並べ替えはほとんど手間がかからない。",
  camera: {
    position: [0, 10, 6.5],
    target: [0, 0, 0.9],
    fov: 42,
    orbit: false,
  },
  controls: [
    {
      type: "range",
      key: "speed",
      label: "箱の速さ",
      min: 0,
      max: 3,
      step: 0.1,
      value: 0.8,
    },
    {
      type: "toggle",
      key: "animate",
      label: "左から順に見ていく様子を表示",
      value: true,
    },
  ],
  legend: [
    { color: palette.amber, label: "スイープ線と、今開いている区間" },
    { color: palette.sky, label: "x で重なった組（候補）" },
    { color: palette.coral, label: "x と y の両方で重なった組" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(8);
    const boxes: Box[] = Array.from({ length: COUNT }, () => {
      const angle = random() * TAU;
      return {
        x: (random() - 0.5) * (WIDTH - 1),
        y: (random() - 0.5) * (DEPTH - 1),
        w: 0.35 + random() * 0.6,
        h: 0.3 + random() * 0.5,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
      };
    });
    const rects = new InstancedMesh(
      new PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ transparent: true, opacity: 0.75 }),
      COUNT
    );
    rects.frustumCulled = false;
    scene.add(rects);
    const bars = new InstancedMesh(
      new PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ transparent: true, opacity: 0.85 }),
      COUNT
    );
    bars.frustumCulled = false;
    scene.add(bars);
    const frame = segments(
      [
        new Vector3(-WIDTH / 2, 0.01, -DEPTH / 2),
        new Vector3(WIDTH / 2, 0.01, -DEPTH / 2),
        new Vector3(WIDTH / 2, 0.01, -DEPTH / 2),
        new Vector3(WIDTH / 2, 0.01, DEPTH / 2),
        new Vector3(WIDTH / 2, 0.01, DEPTH / 2),
        new Vector3(-WIDTH / 2, 0.01, DEPTH / 2),
        new Vector3(-WIDTH / 2, 0.01, DEPTH / 2),
        new Vector3(-WIDTH / 2, 0.01, -DEPTH / 2),
        new Vector3(-WIDTH / 2, 0.01, AXIS_Z - 0.2),
        new Vector3(WIDTH / 2, 0.01, AXIS_Z - 0.2),
      ],
      palette.muted,
      { width: 1.2, opacity: 0.7 }
    );
    scene.add(frame);
    const axisLabel = context.label("x 軸への投影（区間）", { tone: "muted" });
    axisLabel.position.set(-WIDTH / 2 + 1.3, 0.02, AXIS_Z - 0.45);
    scene.add(axisLabel);
    const sweepLine = segments([], palette.amber, { width: 3 });
    const candidateLines = segments([], palette.sky, {
      width: 1.5,
      opacity: 0.8,
    });
    const hitLines = segments([], palette.coral, { width: 3 });
    scene.add(sweepLine, candidateLines, hitLines);

    // 端点の並び：前のフレームの順番を保ち、挿入ソートで直す
    const endpoints: Endpoint[] = [];
    for (let i = 0; i < COUNT; i++) {
      endpoints.push(
        { value: 0, box: i, start: true },
        { value: 0, box: i, start: false }
      );
    }
    const matrix = new Matrix4();
    const base = new Color("#5d6b80");
    const amber = new Color(palette.amber);
    const coral = new Color(palette.coral);
    let sweepTime = 0;

    return {
      update({ dt }) {
        const speed = Number(params["speed"]);
        for (const box of boxes) {
          box.x += box.vx * dt * speed;
          box.y += box.vy * dt * speed;
          if (Math.abs(box.x) > WIDTH / 2 - box.w / 2) {
            box.vx *= -1;
            box.x = Math.sign(box.x) * (WIDTH / 2 - box.w / 2);
          }
          if (Math.abs(box.y) > DEPTH / 2 - box.h / 2) {
            box.vy *= -1;
            box.y = Math.sign(box.y) * (DEPTH / 2 - box.h / 2);
          }
        }
        for (const endpoint of endpoints) {
          const box = boxes[endpoint.box];
          if (box) {
            endpoint.value = endpoint.start
              ? box.x - box.w / 2
              : box.x + box.w / 2;
          }
        }
        let swaps = 0;
        for (let i = 1; i < endpoints.length; i++) {
          let j = i;
          while (
            j > 0 &&
            (endpoints[j - 1]?.value ?? 0) > (endpoints[j]?.value ?? 0)
          ) {
            const a = endpoints[j - 1];
            const b = endpoints[j];
            if (a && b) {
              endpoints[j - 1] = b;
              endpoints[j] = a;
            }
            swaps++;
            j--;
          }
        }

        // 左から順に見ていく（アニメーションでは、スイープ線より左の端点だけを処理する）
        sweepTime = (sweepTime + dt) % SWEEP_SECONDS;
        const animate = params["animate"] === true;
        const sweepX = animate
          ? -WIDTH / 2 + (sweepTime / SWEEP_SECONDS) * WIDTH * 1.05
          : Infinity;
        const active = new Set<number>();
        const candidates: [number, number][] = [];
        for (const endpoint of endpoints) {
          if (endpoint.value > sweepX) {
            break;
          }
          if (endpoint.start) {
            for (const other of active) {
              candidates.push([other, endpoint.box]);
            }
            active.add(endpoint.box);
          } else {
            active.delete(endpoint.box);
          }
        }
        const hits = candidates.filter(([a, b]) => {
          const p = boxes[a];
          const q = boxes[b];
          return p && q && Math.abs(p.y - q.y) * 2 < p.h + q.h;
        });
        const touching = new Set(hits.flat());

        const center = (i: number, y = 0.05) => {
          const box = boxes[i];
          return new Vector3(box?.x ?? 0, y, box?.y ?? 0);
        };
        for (const [i, box] of boxes.entries()) {
          matrix.makeScale(box.w, 1, box.h).setPosition(box.x, 0.02, box.y);
          rects.setMatrixAt(i, matrix);
          rects.setColorAt(
            i,
            touching.has(i) ? coral : active.has(i) ? amber : base
          );
          const lane = AXIS_Z + (i % LANES) * 0.17;
          matrix.makeScale(box.w, 1, 0.12).setPosition(box.x, 0.02, lane);
          bars.setMatrixAt(i, matrix);
          bars.setColorAt(
            i,
            active.has(i) ? amber : touching.has(i) ? coral : base
          );
        }
        for (const mesh of [rects, bars]) {
          mesh.instanceMatrix.needsUpdate = true;
          if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
          }
        }
        sweepLine.visible = animate;
        if (animate) {
          sweepLine.setPoints([
            new Vector3(sweepX, 0.06, -DEPTH / 2),
            new Vector3(sweepX, 0.06, AXIS_Z + LANES * 0.17),
          ]);
        }
        candidateLines.setPoints(
          candidates.flatMap(([a, b]) => [center(a), center(b)])
        );
        candidateLines.visible = candidates.length > 0;
        hitLines.setPoints(
          hits.flatMap(([a, b]) => [center(a, 0.07), center(b, 0.07)])
        );
        hitLines.visible = hits.length > 0;

        context.readout("全部の組", `${(COUNT * (COUNT - 1)) / 2}`);
        context.readout("x で重なった組（候補）", `${candidates.length}`);
        context.readout("x と y で重なった組", `${hits.length}`);
        context.readout("このフレームの並べ替えの交換", `${swaps} 回`);
        context.caption(
          animate
            ? "スイープ線（黄色）が端点を左から順に通過する。始まりの端点に来たら、今開いている区間（黄色の箱）すべてと組にしてから、自分も開く。終わりの端点で閉じる。こうして x で重なる組だけが候補になり、y も比べて本当に重なった組（赤）を得る。"
            : "端点の並びは、前のフレームからほとんど変わらない。挿入ソートなら、入れ替えが必要な所だけ直せばよいので、交換の回数はとても少ない（時間的な一貫性）。"
        );
      },
      dispose() {
        rects.dispose();
        bars.dispose();
      },
    };
  },
};
