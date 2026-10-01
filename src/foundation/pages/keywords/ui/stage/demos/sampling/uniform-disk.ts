import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  SRGBColorSpace,
  Vector3,
} from "three";
import { TAU, palette, pointCloud, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const SIDE = 3.6;
const RADIUS = SIDE / 2;
const LEFT = -2.7;
const RIGHT = 2.7;
const CELLS = 8;
const MESH = 64;
const RINGS = 8;
const MAX = 32 * 32;

type Method = "naive" | "sqrt" | "concentric" | "rejection";
const isMethod = (value: unknown): value is Method =>
  value === "naive" ||
  value === "sqrt" ||
  value === "concentric" ||
  value === "rejection";

/** 正方形 [0,1]² の点 (u, v) を半径 1 の円盤へ写す。 */
function toDisk(method: Method, u: number, v: number): [number, number] {
  switch (method) {
    case "naive": {
      return [u * Math.cos(TAU * v), u * Math.sin(TAU * v)];
    }
    case "sqrt": {
      const r = Math.sqrt(u);
      return [r * Math.cos(TAU * v), r * Math.sin(TAU * v)];
    }
    case "concentric": {
      // シャーリーとチウの同心写像：正方形の同心の枠を、円盤の同心の輪へ写す
      const a = 2 * u - 1;
      const b = 2 * v - 1;
      if (a === 0 && b === 0) {
        return [0, 0];
      }
      const [r, phi] =
        Math.abs(a) > Math.abs(b)
          ? [a, (Math.PI / 4) * (b / a)]
          : [b, Math.PI / 2 - (Math.PI / 4) * (a / b)];
      return [r * Math.cos(phi), r * Math.sin(phi)];
    }
    case "rejection": {
      return [2 * u - 1, 2 * v - 1];
    }
    default: {
      return [0, 0];
    }
  }
}

/** 4 色の市松模様（区画ごとに色が変わる）。 */
function checkerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = CELLS;
  canvas.height = CELLS;
  const context2d = canvas.getContext("2d");
  const colors = ["#2f5f8a", "#3f8f86", "#8a6a3a", "#6b4f8f"];
  if (context2d) {
    for (let j = 0; j < CELLS; j++) {
      for (let i = 0; i < CELLS; i++) {
        context2d.fillStyle = colors[(i % 2) + (j % 2) * 2] ?? "#333";
        context2d.fillRect(i, j, 1, 1);
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** (MESH+1)² 頂点の格子。位置は毎フレーム写像で書き換える。 */
function gridGeometry() {
  const geometry = new BufferGeometry();
  const positions = new Float32Array((MESH + 1) ** 2 * 3);
  const uvs = new Float32Array((MESH + 1) ** 2 * 2);
  const indices: number[] = [];
  for (let j = 0; j <= MESH; j++) {
    for (let i = 0; i <= MESH; i++) {
      uvs.set([i / MESH, j / MESH], (j * (MESH + 1) + i) * 2);
      if (i < MESH && j < MESH) {
        const a = j * (MESH + 1) + i;
        const b = a + 1;
        const c = a + MESH + 1;
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    }
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

const CAPTIONS: Record<Method, string> = {
  naive:
    "半径を 0〜1 で一様に選ぶと、中心に点が集まる。半径が半分の円の面積は全体の 4 分の 1 しかないのに、点は半分入ってしまう。右の模様を見ると、中心の区画が小さく、外側の区画が大きく引き伸ばされている。",
  sqrt: "半径を √u にすると、半径 r より内側に入る割合が面積の割合 r² と一致し、面積に対して一様になる。ただし区画の形は、中心では細い扇形に、外側では平たい帯になる（層化した点の並びがゆがむ）。",
  concentric:
    "正方形の同心の枠を、円盤の同心の輪へ写す（シャーリーとチウの方法）。面積はそろったまま、区画の形のゆがみが小さいので、層化や低食い違い列の均等さがそのまま円盤に移る。",
  rejection:
    "円盤を囲む正方形に点を打ち、円の外に出た点を捨てる。簡単で正しいが、約 21.5% の点が無駄になり、点の数も一定にならない。層化した点の並びも崩れる。",
};

export const demo: DemoModule = {
  alt: "正方形の上で均等に並べた点を円盤の中へ写すときの方法を比べるデモ。左が正方形の点と区画、右が写した先の円盤。半径をそのまま一様に選ぶと中心に点が集まる。半径を平方根にすると面積に対して一様になるが、区画の形がゆがむ。同心写像では区画の形がほぼ保たれる。棄却法は円の外の点を捨てる。右下のグラフは、面積の等しい輪ごとの点の数。",
  camera: {
    position: [0, 0, 10.5],
    target: [0, -0.1, 0],
    orbit: false,
    fov: 40,
  },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "method",
      label: "円盤への写し方",
      value: "naive",
      options: [
        { value: "naive", label: "半径をそのまま一様に（誤り）" },
        { value: "sqrt", label: "半径を平方根に（極座標）" },
        { value: "concentric", label: "同心写像（シャーリーとチウ）" },
        { value: "rejection", label: "棄却法（外に出た点を捨てる）" },
      ],
    },
    {
      type: "range",
      key: "side",
      label: "層化の区画数",
      min: 4,
      max: 32,
      step: 1,
      value: 16,
      format: (value) => `${value} × ${value}`,
    },
    {
      type: "toggle",
      key: "morph",
      label: "正方形から円盤への変形を動かす",
      value: false,
    },
    { type: "toggle", key: "cells", label: "区画の模様を表示", value: true },
    { type: "button", key: "restart", label: "点を作り直す" },
  ],
  legend: [
    { color: palette.amber, label: "標本点（区画ごとに 1 点）" },
    { color: palette.coral, label: "棄却法で捨てた点" },
  ],
  setup(context) {
    const { scene, params } = context;
    const texture = context.track(checkerTexture());
    const squareMesh = new Mesh(
      gridGeometry(),
      new MeshBasicMaterial({ map: texture })
    );
    const diskMesh = new Mesh(
      gridGeometry(),
      new MeshBasicMaterial({ map: texture })
    );
    scene.add(squareMesh, diskMesh);
    const outline: Vector3[] = [];
    for (let s = 0; s < 96; s++) {
      const a0 = (s / 96) * TAU;
      const a1 = ((s + 1) / 96) * TAU;
      outline.push(
        new Vector3(RIGHT + Math.cos(a0) * RADIUS, Math.sin(a0) * RADIUS, 0.02),
        new Vector3(RIGHT + Math.cos(a1) * RADIUS, Math.sin(a1) * RADIUS, 0.02)
      );
    }
    for (const [ax, ay, bx, by] of [
      [0, 0, 1, 0],
      [1, 0, 1, 1],
      [1, 1, 0, 1],
      [0, 1, 0, 0],
    ] as const) {
      outline.push(
        new Vector3(LEFT + (ax - 0.5) * SIDE, (ay - 0.5) * SIDE, 0.02),
        new Vector3(LEFT + (bx - 0.5) * SIDE, (by - 0.5) * SIDE, 0.02)
      );
    }
    scene.add(segments(outline, palette.ink, { width: 1.6, opacity: 0.7 }));
    const inscribed: Vector3[] = [];
    for (let s = 0; s < 96; s++) {
      const a0 = (s / 96) * TAU;
      const a1 = ((s + 1) / 96) * TAU;
      inscribed.push(
        new Vector3(LEFT + Math.cos(a0) * RADIUS, Math.sin(a0) * RADIUS, 0.02),
        new Vector3(LEFT + Math.cos(a1) * RADIUS, Math.sin(a1) * RADIUS, 0.02)
      );
    }
    const inscribedLine = segments(inscribed, palette.coral, { width: 1.4 });
    scene.add(inscribedLine);
    const squareDots = pointCloud(MAX, { size: 10 });
    const diskDots = pointCloud(MAX, { size: 10 });
    squareDots.position.z = 0.04;
    diskDots.position.z = 0.04;
    scene.add(squareDots, diskDots);
    const squareLabel = context.label("正方形の上で層化した点", {
      tone: "strong",
    });
    squareLabel.position.set(LEFT, -RADIUS - 0.45, 0);
    const diskLabel = context.label("円盤へ写した点", { tone: "strong" });
    diskLabel.position.set(RIGHT, -RADIUS - 0.45, 0);
    const arrowLabel = context.label("→", { size: "md" });
    arrowLabel.position.set(0, 0, 0);
    scene.add(squareLabel, diskLabel, arrowLabel);
    const graph = hudGraph(context, {
      title: "面積の等しい輪ごとの点の数（均等なら 1）",
      min: 0,
      max: 3,
      xLabel: "中心 → 外周",
      samples: RINGS * 8,
    });

    const amber = new Color(palette.amber);
    const coral = new Color(palette.coral);
    let samples: [number, number][] = [];
    let seed = 5;
    let side = 0;
    const build = () => {
      const random = rng(seed);
      samples = [];
      for (let j = 0; j < side; j++) {
        for (let i = 0; i < side; i++) {
          samples.push([(i + random()) / side, (j + random()) / side]);
        }
      }
    };
    const rings = new Float32Array(RINGS);

    return {
      update({ time }) {
        const { method } = params;
        if (!isMethod(method)) {
          return;
        }
        const nextSide = Number(params["side"]);
        if (nextSide !== side) {
          side = nextSide;
          build();
        }
        const morph =
          params["morph"] === true ? 0.5 - 0.5 * Math.cos(time * 1.3) : 1;
        const blend = (u: number, v: number) => {
          const [x, y] = toDisk(method, u, v);
          const sx = (u - 0.5) * 2;
          const sy = (v - 0.5) * 2;
          return [
            RIGHT + (sx + (x - sx) * morph) * RADIUS,
            (sy + (y - sy) * morph) * RADIUS,
          ] as const;
        };
        const square = squareMesh.geometry.getAttribute("position");
        const disk = diskMesh.geometry.getAttribute("position");
        for (let j = 0; j <= MESH; j++) {
          for (let i = 0; i <= MESH; i++) {
            const index = j * (MESH + 1) + i;
            const u = i / MESH;
            const v = j / MESH;
            square.setXYZ(index, LEFT + (u - 0.5) * SIDE, (v - 0.5) * SIDE, 0);
            const [x, y] = blend(u, v);
            disk.setXYZ(index, x, y, 0);
          }
        }
        square.needsUpdate = true;
        disk.needsUpdate = true;
        const showCells = params["cells"] === true;
        squareMesh.visible = showCells;
        diskMesh.visible = showCells && method !== "rejection";
        inscribedLine.visible = method === "rejection";

        rings.fill(0);
        let accepted = 0;
        let diskIndex = 0;
        for (const [index, [u, v]] of samples.entries()) {
          const [x, y] = toDisk(method, u, v);
          const rejected = method === "rejection" && x * x + y * y > 1;
          squareDots.positions.set(
            [LEFT + (u - 0.5) * SIDE, (v - 0.5) * SIDE, 0],
            index * 3
          );
          const color = rejected ? coral : amber;
          squareDots.colors.set([color.r, color.g, color.b], index * 3);
          if (rejected) {
            continue;
          }
          const [bx, by] = blend(u, v);
          diskDots.positions.set([bx, by, 0], diskIndex * 3);
          diskDots.colors.set([amber.r, amber.g, amber.b], diskIndex * 3);
          diskIndex++;
          accepted++;
          const ring = Math.min(RINGS - 1, Math.floor((x * x + y * y) * RINGS));
          rings[ring] = (rings[ring] ?? 0) + 1;
        }
        squareDots.geometry.setDrawRange(0, samples.length);
        diskDots.geometry.setDrawRange(0, diskIndex);
        squareDots.commit();
        diskDots.commit();

        const expected = Math.max(1, accepted) / RINGS;
        graph.setSeries([
          {
            color: palette.amber,
            fn: (t) =>
              (rings[Math.min(RINGS - 1, Math.floor(t * t * RINGS))] ?? 0) /
              expected,
          },
        ]);
        graph.setMarker(0.5);
        const ratios = [...rings].map((value) => value / expected);
        context.readout(
          "輪の点の数（最少〜最多）",
          `${Math.min(...ratios).toFixed(2)} 〜 ${Math.max(...ratios).toFixed(2)} 倍`
        );
        context.readout(
          "捨てた点",
          method === "rejection"
            ? `${samples.length - accepted} / ${samples.length}（${(((samples.length - accepted) / Math.max(1, samples.length)) * 100).toFixed(1)}%）`
            : ""
        );
        context.caption(CAPTIONS[method]);
      },
      action(key) {
        if (key === "restart") {
          seed++;
          build();
        }
      },
    };
  },
};
