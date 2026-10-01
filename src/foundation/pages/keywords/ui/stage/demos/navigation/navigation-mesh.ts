import { Color, ConeGeometry, Mesh, Vector3 } from "three";
import { palette, polyline, rng, segments, standard } from "../../kit";
import { mannequin } from "../../mannequin";
import {
  NAV_BOUNDS,
  NAV_OBSTACLES,
  buildNavMesh,
  findCorridor,
  funnel,
  locate,
  navMeshView,
  obstacleBoxes,
  portalsOf,
  toVector,
} from "../../navmesh";
import type { NavMesh } from "../../navmesh";
import { walker } from "../../navgrid";
import type { Point2 } from "../../delaunay";
import type { DemoModule } from "../../types";

const GRID = 0.25;

const baseColor = (index: number) => {
  // 隣どうしの三角形を見分けられるよう、明るさを少しずつ変える
  const shade = ((index * 37) % 7) / 7;
  return new Color("#2d4c6b").lerp(new Color("#3d6488"), shade);
};

export const demo: DemoModule = {
  alt: "歩ける床を三角形の集まり（ナビゲーションメッシュ）で表し、その上で経路を探すデモ。壁や柱の周りは、キャラクターの半径の分だけ縮めてあるので、三角形の上ならどこに立っても壁にめり込まない。経路探索は三角形をノードとして行うので、同じ範囲を細かい格子で表す場合よりノードがずっと少ない。見つかった三角形の列（回廊）の中で、ファネル法で角をかすめる短い経路を引き、キャラクターがそれに沿って歩く。床をクリックすると目的地を変えられる。",
  camera: { position: [0, 11, 8.5], target: [0, 0, 0.2], fov: 42 },
  controls: [
    {
      type: "range",
      key: "radius",
      label: "キャラクターの半径（壁から縮める幅）",
      min: 0,
      max: 0.7,
      step: 0.05,
      value: 0.3,
    },
    {
      type: "select",
      key: "path",
      label: "回廊の中の経路",
      value: "funnel",
      options: [
        { value: "centers", label: "三角形の重心を結ぶ" },
        { value: "funnel", label: "ファネル法で引き締める" },
      ],
    },
    {
      type: "toggle",
      key: "grid",
      label: "同じ範囲を格子で表すと",
      value: false,
    },
  ],
  legend: [
    { color: "#35587a", label: "歩ける面（ナビメッシュ）" },
    { color: palette.amber, label: "通る三角形の列（回廊）" },
    { color: palette.coral, label: "経路" },
  ],
  hint: "床をクリックすると、そこを目的地にします",
  setup(context) {
    const { scene, params } = context;
    scene.add(obstacleBoxes(NAV_OBSTACLES));
    const man = mannequin({ accent: palette.amber });
    scene.add(man.root);
    const agent = walker(man, { speed: 1.8 });
    const flag = new Mesh(
      new ConeGeometry(0.16, 0.5, 16),
      standard(palette.coral, { emissive: 0.5 })
    );
    scene.add(flag);
    const pathLine = polyline([], palette.coral, { width: 4 });
    scene.add(pathLine);
    const gridLines = segments([], palette.ink, { width: 1, opacity: 0.25 });
    scene.add(gridLines);

    const random = rng(3);
    let mesh: NavMesh = buildNavMesh(NAV_BOUNDS, NAV_OBSTACLES, 0.3);
    let view = navMeshView(mesh);
    scene.add(view);
    let position: Point2 = { x: -6, y: 3.5 };
    let goal: Point2 = { x: 6, y: -3.5 };
    agent.setPath([toVector(position)]);
    let corridor: number[] = [];
    let expanded = 0;
    let gridCells = 0;
    let radius = -1;
    let mode = "";
    let pause = 0;

    const paint = () => {
      const inCorridor = new Set(corridor);
      for (let index = 0; index < mesh.triangles.length; index++) {
        view.tint(
          index,
          inCorridor.has(index)
            ? baseColor(index).lerp(new Color(palette.amber), 0.55)
            : baseColor(index)
        );
      }
      view.commit();
    };
    const plan = () => {
      const from = locate(mesh, position);
      const to = locate(mesh, goal);
      if (from < 0 || to < 0) {
        corridor = [];
        pathLine.visible = false;
        paint();
        return;
      }
      const found = findCorridor(mesh, from, to);
      ({ corridor, expanded } = found);
      const points =
        params["path"] === "centers"
          ? [
              position,
              ...corridor.slice(1, -1).map((t) => mesh.centroids[t] ?? goal),
              goal,
            ]
          : funnel(portalsOf(mesh, corridor, position, goal)).path;
      const route = points.map((p) => toVector(p));
      pathLine.setPoints(route.map((p) => p.clone().setY(0.12)));
      pathLine.visible = route.length > 1;
      agent.setPath(route);
      flag.position.copy(toVector(goal, 0.3));
      paint();
    };
    const rebuild = () => {
      scene.remove(view);
      view.dispose();
      mesh = buildNavMesh(NAV_BOUNDS, NAV_OBSTACLES, radius);
      view = navMeshView(mesh);
      scene.add(view);
      // 立っている場所が縮めた外になったら、近くの三角形の重心へ移す
      if (locate(mesh, position) < 0) {
        let best = mesh.centroids[0] ?? position;
        for (const c of mesh.centroids) {
          if (
            Math.hypot(c.x - position.x, c.y - position.y) <
            Math.hypot(best.x - position.x, best.y - position.y)
          ) {
            best = c;
          }
        }
        position = best;
      }
      if (locate(mesh, goal) < 0) {
        goal = mesh.centroids.at(-1) ?? goal;
      }
      const lines: Vector3[] = [];
      gridCells = 0;
      const { bounds, obstacles } = mesh;
      for (let x = bounds.x0; x < bounds.x1 - 1e-6; x += GRID) {
        for (let y = bounds.y0; y < bounds.y1 - 1e-6; y += GRID) {
          const cx = x + GRID / 2;
          const cy = y + GRID / 2;
          const blocked = obstacles.some(
            (o) => cx > o.x0 && cx < o.x1 && cy > o.y0 && cy < o.y1
          );
          if (!blocked) {
            gridCells++;
            lines.push(
              new Vector3(x, 0.06, y),
              new Vector3(x + GRID, 0.06, y),
              new Vector3(x, 0.06, y),
              new Vector3(x, 0.06, y + GRID)
            );
          }
        }
      }
      gridLines.setPoints(lines);
      agent.setPath([toVector(position)]);
      plan();
    };
    context.onPick((point) => {
      const target = { x: point.x, y: point.z };
      if (locate(mesh, target) < 0) {
        return;
      }
      const here = agent.position;
      position = { x: here.x, y: here.z };
      goal = target;
      pause = 0;
      plan();
    });

    return {
      update({ dt }) {
        const nextRadius = Number(params["radius"]);
        const nextMode = String(params["path"]);
        if (nextRadius !== radius) {
          radius = nextRadius;
          const here = agent.position;
          position = { x: here.x, y: here.z };
          rebuild();
        } else if (nextMode !== mode) {
          const here = agent.position;
          position = { x: here.x, y: here.z };
          plan();
        }
        mode = nextMode;
        gridLines.visible = params["grid"] === true;
        const { done } = agent.update(dt);
        if (done) {
          pause += dt;
          if (pause > 1.4) {
            pause = 0;
            const here = agent.position;
            position = { x: here.x, y: here.z };
            for (let tries = 0; tries < 50; tries++) {
              const candidate = {
                x: NAV_BOUNDS.x0 + random() * (NAV_BOUNDS.x1 - NAV_BOUNDS.x0),
                y: NAV_BOUNDS.y0 + random() * (NAV_BOUNDS.y1 - NAV_BOUNDS.y0),
              };
              const far =
                Math.hypot(candidate.x - position.x, candidate.y - position.y) >
                6;
              if (far && locate(mesh, candidate) >= 0) {
                goal = candidate;
                break;
              }
            }
            plan();
          }
        }
        context.readout(
          "ノードの数（三角形 / 同じ範囲の格子）",
          `${mesh.triangles.length} / ${gridCells}`
        );
        context.readout(
          "探索で調べた三角形 / 回廊の長さ",
          `${expanded} / ${corridor.length}`
        );
        context.caption(
          params["grid"] === true
            ? `同じ範囲を ${GRID} 刻みの格子で表すと ${gridCells} 個のノードになる。ナビメッシュなら ${mesh.triangles.length} 個の三角形で足り、広い床は大きな三角形 1 つで済むので、探索が速く、メモリも少ない。`
            : params["path"] === "centers"
              ? "三角形の重心を順に結ぶと、回廊の中をジグザグに進む不自然な経路になる。三角形の形しだいで遠回りにもなる。"
              : "探索で見つかった三角形の列（回廊、黄色）の中で、ファネル法により角をかすめる最短の折れ線を引く。壁や柱から半径の分だけ縮めた面なので、角をかすめてもキャラクターはめり込まない。"
        );
      },
      dispose() {
        view.dispose();
      },
    };
  },
};
