import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from "three";
import { marker, palette, polyline, rng, segments } from "../../kit";
import {
  circumcircle,
  delaunaySteps,
  minimumAngle,
  minimumSpanningTree,
  uniqueEdges,
} from "../../delaunay";
import type { Point2, Triangle } from "../../delaunay";
import type { DemoModule } from "../../types";

const WIDTH = 16;
const HEIGHT = 8.6;
const MAX_POINTS = 60;

function circlePoints(x: number, y: number, r: number, z = 0.02) {
  const points: Vector3[] = [];
  for (let index = 0; index <= 72; index++) {
    const angle = (index / 72) * Math.PI * 2;
    points.push(
      new Vector3(x + Math.cos(angle) * r, y + Math.sin(angle) * r, z)
    );
  }
  return points;
}

function triangleGeometry(
  points: readonly Point2[],
  triangles: readonly Triangle[],
  z = 0
) {
  const positions = new Float32Array(triangles.length * 9);
  for (const [n, t] of triangles.entries()) {
    for (let corner = 0; corner < 3; corner++) {
      const p = points[t[corner] ?? 0];
      positions.set([p?.x ?? 0, p?.y ?? 0, z], n * 9 + corner * 3);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  return geometry;
}

function edgePoints(
  points: readonly Point2[],
  edges: readonly [number, number][],
  z = 0.01
) {
  const result: Vector3[] = [];
  for (const [a, b] of edges) {
    const pa = points[a];
    const pb = points[b];
    if (pa && pb) {
      result.push(new Vector3(pa.x, pa.y, z), new Vector3(pb.x, pb.y, z));
    }
  }
  return result;
}

function cross(u: Point2, v: Point2, w: Point2) {
  return (v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x);
}

function insideTriangle(p: Point2, a: Point2, b: Point2, c: Point2) {
  const d1 = cross(a, b, p);
  const d2 = cross(b, c, p);
  const d3 = cross(c, a, p);
  return (d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0);
}

type Room = { x: number; y: number; w: number; h: number };

export const demo: DemoModule = {
  alt: "ばらばらに置いた点を、細長い三角形ができるだけ少なくなるようにつなぐドロネー分割のデモ。どの三角形も、3 つの頂点を通る円（外接円）の中にほかの点を含まない。点をドラッグすると三角形がつなぎ直され、ポインターを置いた三角形の外接円が表示される。「1 点ずつ追加」では、点を足すたびに外接円に入られた三角形を取り除いてつなぎ直すボウヤー・ワトソン法の手順を再生する。「ダンジョンの通路」では、部屋の中心をドロネー分割し、最小全域木で部屋をつないで通路を作る。",
  camera: { position: [0, 0, 15], target: [0, 0, 0], orbit: false, fov: 40 },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "表示",
      value: "triangulate",
      options: [
        { value: "triangulate", label: "ドロネー分割" },
        { value: "steps", label: "1 点ずつ追加（ボウヤー・ワトソン法）" },
        { value: "dungeon", label: "ダンジョンの通路" },
      ],
    },
    {
      type: "range",
      key: "count",
      label: "点の数",
      min: 4,
      max: MAX_POINTS,
      step: 1,
      value: 22,
    },
    {
      type: "toggle",
      key: "circles",
      label: "すべての外接円を表示",
      value: false,
    },
    {
      type: "toggle",
      key: "voronoi",
      label: "ボロノイ図（双対）を重ねる",
      value: false,
    },
    {
      type: "range",
      key: "loops",
      label: "通路に残す輪の割合（ダンジョン）",
      min: 0,
      max: 0.5,
      step: 0.01,
      value: 0.15,
    },
    { type: "button", key: "shuffle", label: "点を並べ直す" },
  ],
  legend: [
    { color: palette.ink, label: "ドロネー分割の辺" },
    { color: palette.amber, label: "外接円（中に点がない）" },
    { color: palette.coral, label: "取り除く三角形" },
    { color: palette.sky, label: "ボロノイ図" },
  ],
  hint: "点をドラッグして動かせます。三角形にポインターを置くと、その外接円が出ます。",
  setup(context) {
    const { scene, params } = context;
    const board = new Mesh(
      new PlaneGeometry(WIDTH + 1, HEIGHT + 1),
      new MeshBasicMaterial({ color: "#223047" })
    );
    board.position.z = -0.05;
    scene.add(board);

    const layer = new Group();
    scene.add(layer);
    const fillMaterial = new MeshBasicMaterial({
      color: "#35507a",
      transparent: true,
      opacity: 0.55,
      side: DoubleSide,
    });
    const fillMesh = new Mesh(new BufferGeometry(), fillMaterial);
    layer.add(fillMesh);
    const badMesh = new Mesh(
      new BufferGeometry(),
      new MeshBasicMaterial({
        color: palette.coral,
        transparent: true,
        opacity: 0.45,
        side: DoubleSide,
      })
    );
    badMesh.position.z = 0.005;
    layer.add(badMesh);
    const edgeLines = segments([], palette.ink, { width: 1.6, opacity: 0.9 });
    layer.add(edgeLines);
    const allCircles = segments([], palette.amber, { width: 1, opacity: 0.25 });
    layer.add(allCircles);
    const voronoiLines = segments([], palette.sky, { width: 2 });
    layer.add(voronoiLines);
    const focusCircle = polyline([], palette.amber, { width: 2.5 });
    layer.add(focusCircle);
    const focusTriangle = polyline([], palette.amber, { width: 3.5 });
    layer.add(focusTriangle);
    const boundaryLines = segments([], palette.amber, { width: 3.5 });
    layer.add(boundaryLines);
    const treeLines = segments([], palette.lime, { width: 5 });
    layer.add(treeLines);
    const loopLines = segments([], palette.lime, {
      width: 3,
      opacity: 0.6,
      dashed: true,
    });
    layer.add(loopLines);
    const roomMesh = new Mesh(
      new BufferGeometry(),
      new MeshBasicMaterial({ color: "#8a7560" })
    );
    roomMesh.position.z = 0.03;
    layer.add(roomMesh);

    const handles = Array.from({ length: MAX_POINTS }, () => {
      const handle = marker(palette.ink, 0.1);
      handle.position.z = 0.1;
      layer.add(handle);
      context.draggable(handle, {
        normal: [0, 0, 1],
        clamp: (position) => {
          position.x = Math.max(-WIDTH / 2, Math.min(WIDTH / 2, position.x));
          position.y = Math.max(-HEIGHT / 2, Math.min(HEIGHT / 2, position.y));
          position.z = 0.1;
        },
      });
      return handle;
    });
    const newPoint = marker(palette.coral, 0.16);
    newPoint.position.z = 0.15;
    layer.add(newPoint);

    let seed = 3;
    const scatter = () => {
      const random = rng(seed);
      for (const handle of handles) {
        handle.position.set(
          (random() - 0.5) * WIDTH,
          (random() - 0.5) * HEIGHT,
          0.1
        );
      }
    };
    scatter();

    let rooms: Room[] = [];
    const makeRooms = () => {
      const random = rng(seed * 7 + 1);
      rooms = [];
      for (
        let attempt = 0;
        attempt < 400 && rooms.length < Math.min(16, Number(params["count"]));
        attempt++
      ) {
        const w = 0.7 + random() * 1.3;
        const h = 0.6 + random() * 0.9;
        const room = {
          x: (random() - 0.5) * (WIDTH - w),
          y: (random() - 0.5) * (HEIGHT - h),
          w,
          h,
        };
        const overlaps = rooms.some(
          (other) =>
            Math.abs(other.x - room.x) < (other.w + room.w) / 2 + 0.7 &&
            Math.abs(other.y - room.y) < (other.h + room.h) / 2 + 0.7
        );
        if (!overlaps) {
          rooms.push(room);
        }
      }
    };

    let stepIndex = 0;
    let stepClock = 0;
    let signature = "";
    const pointerPoint = new Vector3();
    return {
      action(key) {
        if (key === "shuffle") {
          seed++;
          scatter();
          signature = "";
          stepIndex = 0;
        }
      },
      update({ dt }) {
        const mode = String(params["mode"]);
        const count = Number(params["count"]);
        // 表示を切り替えたら、ほかの表示の数値を消す
        const labels: Record<string, string[]> = {
          dungeon: ["部屋", "ドロネーの辺 → 通路"],
          steps: ["追加した点"],
          triangulate: ["三角形", "いちばん小さい角"],
        };
        for (const [owner, keys] of Object.entries(labels)) {
          if (owner !== mode) {
            for (const label of keys) {
              context.readout(label, "");
            }
          }
        }
        for (const [index, handle] of handles.entries()) {
          handle.visible = mode !== "dungeon" && index < count;
        }
        const points: Point2[] = handles
          .slice(0, count)
          .map((handle) => ({ x: handle.position.x, y: handle.position.y }));
        const at = (index: number): Point2 => points[index] ?? { x: 0, y: 0 };

        const showAll = (visible: boolean) => {
          for (const object of [
            fillMesh,
            edgeLines,
            allCircles,
            voronoiLines,
            focusCircle,
            focusTriangle,
          ]) {
            object.visible = visible;
          }
        };
        badMesh.visible = false;
        boundaryLines.visible = false;
        newPoint.visible = false;
        treeLines.visible = false;
        loopLines.visible = false;
        roomMesh.visible = false;

        if (mode === "dungeon") {
          showAll(false);
          const key = `dungeon|${seed}|${count}|${params["loops"]}`;
          if (key !== signature) {
            signature = key;
            makeRooms();
            const centers = rooms.map((room) => ({ x: room.x, y: room.y }));
            const { triangles } = delaunaySteps(centers);
            const edges = uniqueEdges(triangles);
            const { tree, rest } = minimumSpanningTree(centers, edges);
            // 最小全域木だけだと行き止まりばかりになるので、残りの辺を少しだけ足して輪を作る
            const random = rng(seed * 13);
            const loops = rest.filter(() => random() < Number(params["loops"]));
            // 通路は L 字に曲げて描く
            const corridor = (list: [number, number][]) => {
              const result: Vector3[] = [];
              for (const [a, b] of list) {
                const pa = centers[a];
                const pb = centers[b];
                if (pa && pb) {
                  result.push(
                    new Vector3(pa.x, pa.y, 0.02),
                    new Vector3(pb.x, pa.y, 0.02),
                    new Vector3(pb.x, pa.y, 0.02),
                    new Vector3(pb.x, pb.y, 0.02)
                  );
                }
              }
              return result;
            };
            treeLines.setPoints(corridor(tree));
            loopLines.setPoints(corridor(loops));
            edgeLines.setPoints(edgePoints(centers, edges));
            const positions: number[] = [];
            for (const room of rooms) {
              const x0 = room.x - room.w / 2;
              const y0 = room.y - room.h / 2;
              const x1 = room.x + room.w / 2;
              const y1 = room.y + room.h / 2;
              positions.push(
                x0,
                y0,
                0,
                x1,
                y0,
                0,
                x1,
                y1,
                0,
                x0,
                y0,
                0,
                x1,
                y1,
                0,
                x0,
                y1,
                0
              );
            }
            roomMesh.geometry.setAttribute(
              "position",
              new BufferAttribute(new Float32Array(positions), 3)
            );
            context.readout("部屋", `${rooms.length}`);
            context.readout(
              "ドロネーの辺 → 通路",
              `${edges.length} → ${tree.length + loops.length}`
            );
          }
          edgeLines.visible = true;
          edgeLines.material.opacity = 0.25;
          treeLines.visible = true;
          loopLines.visible = true;
          roomMesh.visible = true;
          context.caption(
            "部屋の中心をドロネー分割すると、近い部屋どうしを結ぶ辺（薄い線）だけが候補に残る。そこから最小全域木（緑）を取れば、すべての部屋が最短の通路でつながる。行き止まりばかりにならないよう、残りの辺を少しだけ足して輪（点線）を作る。"
          );
          return;
        }
        edgeLines.material.opacity = 0.9;

        if (mode === "steps") {
          signature = "";
          showAll(false);
          edgeLines.visible = true;
          fillMesh.visible = true;
          const run = delaunaySteps(points);
          stepClock += dt;
          if (stepClock > 1.4) {
            stepClock = 0;
            stepIndex = (stepIndex + 1) % (run.steps.length + 2);
          }
          const step = run.steps[Math.min(stepIndex, run.steps.length - 1)];
          if (!step) {
            return;
          }
          const showing = stepIndex < run.steps.length;
          const phaseBefore = showing && stepClock < 0.8;
          // 全体を囲む大きな三角形は画面に収まらないので、実際の点だけでできた三角形と辺を描く
          const real = (t: Triangle) =>
            t.every((vertex) => vertex < points.length);
          const visibleTriangles = (
            phaseBefore ? (run.steps[stepIndex - 1]?.after ?? []) : step.after
          ).filter(real);
          fillMesh.geometry = triangleGeometry(run.all, visibleTriangles);
          edgeLines.setPoints(
            edgePoints(run.all, uniqueEdges(visibleTriangles))
          );
          if (showing) {
            const p = run.all[step.point];
            newPoint.visible = true;
            newPoint.position.set(p?.x ?? 0, p?.y ?? 0, 0.15);
            if (phaseBefore) {
              badMesh.visible = true;
              badMesh.geometry = triangleGeometry(
                run.all,
                step.bad.filter(real),
                0.005
              );
              boundaryLines.visible = true;
              boundaryLines.setPoints(
                edgePoints(
                  run.all,
                  step.boundary.filter(
                    ([a, b]) => a < points.length && b < points.length
                  ),
                  0.02
                )
              );
            }
          }
          for (const [index, handle] of handles.entries()) {
            handle.visible = index < Math.min(count, stepIndex + 1);
          }
          context.readout(
            "追加した点",
            `${Math.min(stepIndex + 1, points.length)} / ${points.length}`
          );
          context.caption(
            phaseBefore
              ? "新しい点（赤）が外接円の中に入ってしまう三角形（赤く塗った部分）を取り除く。取り除いた穴のふち（黄色）は、どれも新しい点から見えるので、ふちの辺と新しい点を結べば、また外接円の中に点のない三角形だけになる。"
              : "穴のふちと新しい点を結んでつなぎ直した。実際には、最初に全体を囲む大きな三角形を置いて始めている（画面の外なので描いていない）。すべての点を足し終えたら、大きな三角形の頂点につながる三角形を取り除けば完成する。"
          );
          return;
        }

        showAll(true);
        const key = `${points.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(";")}|${params["circles"]}|${params["voronoi"]}`;
        const { triangles } = delaunaySteps(points);
        if (key !== signature) {
          signature = key;
          fillMesh.geometry = triangleGeometry(points, triangles);
          edgeLines.setPoints(edgePoints(points, uniqueEdges(triangles)));
          const circles: Vector3[] = [];
          if (params["circles"] === true) {
            for (const t of triangles) {
              const c = circumcircle(at(t[0]), at(t[1]), at(t[2]));
              const ring = circlePoints(c.x, c.y, c.r);
              for (let index = 0; index + 1 < ring.length; index++) {
                circles.push(
                  ring[index] ?? new Vector3(),
                  ring[index + 1] ?? new Vector3()
                );
              }
            }
          }
          allCircles.setPoints(circles);
          // ボロノイ図：隣り合う 2 つの三角形の外接円の中心を結ぶ
          const voronoi: Vector3[] = [];
          if (params["voronoi"] === true) {
            const owners = new Map<string, Point2[]>();
            for (const t of triangles) {
              const c = circumcircle(at(t[0]), at(t[1]), at(t[2]));
              for (const [a, b] of [
                [t[0], t[1]],
                [t[1], t[2]],
                [t[2], t[0]],
              ] as const) {
                const edgeKey = a < b ? `${a},${b}` : `${b},${a}`;
                owners.set(edgeKey, [...(owners.get(edgeKey) ?? []), c]);
              }
            }
            for (const centers of owners.values()) {
              const [c0, c1] = centers;
              if (c0 && c1) {
                voronoi.push(
                  new Vector3(c0.x, c0.y, 0.015),
                  new Vector3(c1.x, c1.y, 0.015)
                );
              }
            }
          }
          voronoiLines.setPoints(voronoi);
          context.readout("三角形", `${triangles.length}`);
          context.readout(
            "いちばん小さい角",
            `${minimumAngle(points, triangles).toFixed(1)}°`
          );
        }
        // ポインターの下の三角形の外接円
        const hit = context.pointerOnPlane({ normal: [0, 0, 1] }, pointerPoint);
        const focus = hit
          ? triangles.find((t) =>
              insideTriangle(
                hit,
                points[t[0]] ?? hit,
                points[t[1]] ?? hit,
                points[t[2]] ?? hit
              )
            )
          : undefined;
        focusCircle.visible = focus !== undefined;
        focusTriangle.visible = focus !== undefined;
        if (focus) {
          const [a, b, c] = focus.map(
            (index) => points[index] ?? { x: 0, y: 0 }
          );
          if (a && b && c) {
            const circle = circumcircle(a, b, c);
            focusCircle.setPoints(
              circlePoints(circle.x, circle.y, circle.r, 0.03)
            );
            focusTriangle.setPoints([
              new Vector3(a.x, a.y, 0.03),
              new Vector3(b.x, b.y, 0.03),
              new Vector3(c.x, c.y, 0.03),
              new Vector3(a.x, a.y, 0.03),
            ]);
          }
        }
        context.caption(
          "どの三角形も、3 つの頂点を通る円（外接円）の中にほかの点を含まない。この条件を満たすつなぎ方は、いちばん小さい角が最も大きくなる（細長い三角形が最も少ない）ことが知られている。点をドラッグすると、条件が崩れた所だけ辺がつなぎ変わる。"
        );
      },
    };
  },
};
