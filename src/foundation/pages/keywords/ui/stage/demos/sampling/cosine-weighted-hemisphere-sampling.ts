import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import {
  TAU,
  arrow,
  marker,
  palette,
  pointCloud,
  rng,
  segments,
} from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const DOME = 1.6;
const RAY_LENGTH = 2.6;
const SHOWN = 160;
const HISTORY = 90;

type Box = { min: Vector3; max: Vector3 };
const BOXES: readonly Box[] = [
  // 右の壁
  { min: new Vector3(1.1, 0, -1.8), max: new Vector3(1.5, 2.1, 1.8) },
  // 右上から張り出したひさし
  { min: new Vector3(-0.4, 2.1, -1.8), max: new Vector3(1.5, 2.3, 0.2) },
];

/** 原点から方向 d へ飛ばした光線が箱に当たる距離（当たらなければ Infinity）。 */
function hitDistance(d: Vector3) {
  let nearest = Number.POSITIVE_INFINITY;
  for (const { min, max } of BOXES) {
    let enter = 0;
    let exit = Number.POSITIVE_INFINITY;
    for (const axis of ["x", "y", "z"] as const) {
      const direction = d[axis];
      if (Math.abs(direction) < 1e-9) {
        if (min[axis] > 0 || max[axis] < 0) {
          enter = Number.POSITIVE_INFINITY;
        }
        continue;
      }
      const t0 = min[axis] / direction;
      const t1 = max[axis] / direction;
      enter = Math.max(enter, Math.min(t0, t1));
      exit = Math.min(exit, Math.max(t0, t1));
    }
    if (enter <= exit && enter < nearest) {
      nearest = enter;
    }
  }
  return nearest;
}

type Method = "uniform" | "cosine";

/** 半球上の方向を 1 つ選ぶ。法線は +y。disk には円盤上の点（マリーの方法）を返す。 */
function sampleDirection(
  method: Method,
  random: () => number,
  out: Vector3,
  disk: Vector3
) {
  const u = random();
  const v = random();
  const phi = TAU * v;
  if (method === "uniform") {
    // 高さを一様に選ぶと半球の面積に対して一様（pdf = 1/2π）
    const y = u;
    const ring = Math.sqrt(1 - y * y);
    disk.set(ring * Math.cos(phi), 0, ring * Math.sin(phi));
    return out.set(disk.x, y, disk.z);
  }
  // 円盤の上に一様に点を打ち、真上の半球へ持ち上げる（pdf = cosθ/π）
  const r = Math.sqrt(u);
  disk.set(r * Math.cos(phi), 0, r * Math.sin(phi));
  return out.set(disk.x, Math.sqrt(Math.max(0, 1 - u)), disk.z);
}

/** 1 本の光線の寄与。どちらも期待値は「空の見える割合（余弦で重みづけ）」になる。 */
const contribution = (method: Method, visible: boolean, cosine: number) => {
  if (!visible) {
    return 0;
  }
  // 一様：V cosθ / π ÷ (1/2π) = 2 cosθ、余弦重み：V cosθ / π ÷ (cosθ/π) = 1
  return method === "uniform" ? 2 * cosine : 1;
};

const deviation = (values: readonly number[]) => {
  if (values.length < 2) {
    return 0;
  }
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  const mean = sum / values.length;
  let squares = 0;
  for (const value of values) {
    squares += (value - mean) ** 2;
  }
  return Math.sqrt(squares / (values.length - 1));
};

export const demo: DemoModule = {
  alt: "床の 1 点から半球の方向へ光線を飛ばし、壁やひさしに遮られずに空が見える割合（アンビエントオクルージョンや拡散光の明るさ）を見積もるデモ。半球に一様に光線を飛ばす方法と、法線に近い方向を多く選ぶ余弦重みの方法を比べる。明るさへの寄与は法線に近い方向ほど大きいので、余弦重みで選ぶと、同じ光線の数でも見積もりのばらつき（ノイズ）が小さくなる。余弦重みの方向は、床の円盤に一様に点を打って真上の半球へ持ち上げるだけで作れる（マリーの方法）。",
  camera: { position: [-3.6, 3.4, 5.4], target: [0.2, 0.8, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "method",
      label: "表示する光線の選び方",
      value: "cosine",
      options: [
        { value: "uniform", label: "半球に一様" },
        { value: "cosine", label: "余弦重み（法線に近い方向を多く）" },
      ],
    },
    {
      type: "range",
      key: "rays",
      label: "1 画素あたりの光線の数",
      min: 4,
      max: 64,
      step: 4,
      value: 16,
    },
    {
      type: "toggle",
      key: "malley",
      label: "円盤から持ち上げる様子（マリーの方法）",
      value: true,
    },
    { type: "toggle", key: "occluders", label: "壁とひさし", value: true },
  ],
  legend: [
    { color: palette.sky, label: "空に抜けた光線" },
    { color: palette.coral, label: "壁やひさしに当たった光線" },
    { color: palette.amber, label: "床の円盤に打った点" },
  ],
  setup(context) {
    const { scene, params } = context;
    const wallMaterial = new MeshStandardMaterial({
      color: "#5b6576",
      roughness: 0.85,
    });
    const walls = BOXES.map(({ min, max }) => {
      const size = max.clone().sub(min);
      const mesh = new Mesh(
        new BoxGeometry(size.x, size.y, size.z),
        wallMaterial
      );
      mesh.position.copy(min).addScaledVector(size, 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    });
    const dome = new Mesh(
      new SphereGeometry(DOME, 32, 16, 0, TAU, 0, Math.PI / 2),
      new MeshStandardMaterial({
        color: palette.sky,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      })
    );
    scene.add(dome);
    const point = marker(palette.amber, 0.07);
    scene.add(point);
    const normal = arrow(palette.ink);
    normal.set(new Vector3(), new Vector3(0, 0.9, 0));
    scene.add(normal);
    const missLines = segments([], palette.sky, { width: 1.4, opacity: 0.8 });
    const hitLines = segments([], palette.coral, { width: 1.4, opacity: 0.9 });
    const liftLines = segments([], palette.amber, {
      width: 1,
      opacity: 0.45,
      dashed: true,
      dashSize: 0.05,
      gapSize: 0.05,
    });
    scene.add(missLines, hitLines, liftLines);
    const diskDots = pointCloud(SHOWN, { size: 6, color: palette.amber });
    diskDots.position.y = 0.01;
    scene.add(diskDots);

    // 正解：余弦重みで 20 万本飛ばした平均
    const truthFor = (occluded: boolean) => {
      const random = rng(99);
      const d = new Vector3();
      const disk = new Vector3();
      let sum = 0;
      const total = 200_000;
      for (let k = 0; k < total; k++) {
        sampleDirection("cosine", random, d, disk);
        sum += occluded && Number.isFinite(hitDistance(d)) ? 0 : 1;
      }
      return sum / total;
    };
    const truth = { occluded: truthFor(true), open: 1 };
    const graph = historyGraph(context, {
      title: "1 画素の明るさの見積もり（点線が正解）",
      min: 0,
      max: 1.2,
      length: HISTORY,
      series: [
        { color: palette.coral, label: "一様" },
        { color: palette.lime, label: "余弦重み" },
        { color: palette.ink, dashed: true },
      ],
    });

    const random = rng(7);
    const direction = new Vector3();
    const disk = new Vector3();
    const estimates: Record<Method, number[]> = { uniform: [], cosine: [] };
    let timer = 0;
    return {
      update({ dt }) {
        const method: Method =
          params["method"] === "uniform" ? "uniform" : "cosine";
        const occluded = params["occluders"] === true;
        for (const wall of walls) {
          wall.visible = occluded;
        }
        timer -= dt;
        if (timer > 0) {
          return;
        }
        timer = 0.12;
        const rays = Number(params["rays"]);
        const shown: Record<"hit" | "miss" | "lift", Vector3[]> = {
          hit: [],
          miss: [],
          lift: [],
        };
        let dotCount = 0;
        for (const m of ["uniform", "cosine"] as const) {
          let sum = 0;
          for (let k = 0; k < rays; k++) {
            sampleDirection(m, random, direction, disk);
            const distance = occluded
              ? hitDistance(direction)
              : Number.POSITIVE_INFINITY;
            const visible = !Number.isFinite(distance);
            sum += contribution(m, visible, direction.y);
            if (m !== method) {
              continue;
            }
            const end = direction
              .clone()
              .multiplyScalar(Math.min(distance, RAY_LENGTH));
            (visible ? shown.miss : shown.hit).push(new Vector3(), end);
            if (dotCount < SHOWN) {
              const onDisk = disk.clone().multiplyScalar(DOME);
              diskDots.positions.set([onDisk.x, 0, onDisk.z], dotCount * 3);
              dotCount++;
              shown.lift.push(onDisk, direction.clone().multiplyScalar(DOME));
            }
          }
          const list = estimates[m];
          list.push(sum / rays);
          if (list.length > HISTORY) {
            list.shift();
          }
        }
        missLines.setPoints(shown.miss);
        hitLines.setPoints(shown.hit);
        missLines.visible = shown.miss.length > 0;
        hitLines.visible = shown.hit.length > 0;
        const malley = params["malley"] === true;
        liftLines.setPoints(shown.lift);
        liftLines.visible = malley && shown.lift.length > 0;
        diskDots.visible = malley;
        diskDots.geometry.setDrawRange(0, dotCount);
        diskDots.commit();

        const correct = occluded ? truth.occluded : truth.open;
        graph.push([
          estimates.uniform.at(-1) ?? 0,
          estimates.cosine.at(-1) ?? 0,
          correct,
        ]);
        const spreadUniform = deviation(estimates.uniform);
        const spreadCosine = deviation(estimates.cosine);
        context.readout("正解（空の見える割合）", correct.toFixed(3));
        context.readout(
          "見積もりのばらつき（一様 / 余弦重み）",
          `${spreadUniform.toFixed(3)} / ${spreadCosine.toFixed(3)}`
        );
        context.caption(
          occluded
            ? method === "uniform"
              ? "半球に一様に飛ばすと、明るさにほとんど効かない水平に近い方向にも多くの光線を使う。1 本ごとの寄与（2cosθ）が方向でばらつくので、見積もりのノイズが大きい。"
              : "余弦重みでは、明るさへの寄与が大きい真上に近い方向を多く選ぶ。1 本の寄与は「当たったら 0、抜けたら 1」だけになり、ばらつきが小さい。床の円盤に一様に点を打ち、真上へ持ち上げるだけで作れる。"
            : "遮るものがないと、余弦重みの見積もりは毎回ぴったり 1（ばらつき 0）になる。一様な方法は、cosθ のばらつきがそのままノイズになる。重要度サンプリングで、被積分関数と同じ形の分布を選んだ理想の場合。"
        );
      },
    };
  },
};
