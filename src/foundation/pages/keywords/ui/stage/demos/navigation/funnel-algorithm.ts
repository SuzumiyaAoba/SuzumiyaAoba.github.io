import { Color, ConeGeometry, Mesh } from "three";
import { marker, palette, polyline, rng, segments, standard } from "../../kit";
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
import type { FunnelStep, Portal } from "../../navmesh";
import { walker } from "../../navgrid";
import type { Point2 } from "../../delaunay";
import type { DemoModule } from "../../types";

const RADIUS = 0.3;
const Y = 0.1;

const polylineLength = (points: readonly Point2[]) => {
  let total = 0;
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1];
    const b = points[k];
    if (a && b) {
      total += Math.hypot(b.x - a.x, b.y - a.y);
    }
  }
  return total;
};

export const demo: DemoModule = {
  alt: "ナビメッシュで見つかった三角形の列（回廊）の中で、角をかすめる最短の折れ線を引くファネル法（ストリングプリング）のデモ。スタートを頂点として、境目の辺（ポータル）の左右の端へ 2 本の線（漏斗）を張り、ポータルを 1 つずつ進めながら漏斗を狭めていく。片側の線が反対側の線を越えたら、越えられた側の端が曲がり角になり、そこを新しい頂点として続ける。ポータルの中点を結んだジグザグの経路と比べて、短く自然な経路になる。",
  camera: { position: [0, 11, 8.5], target: [0, 0, 0.2], fov: 42 },
  controls: [
    {
      type: "range",
      key: "interval",
      label: "1 手順の時間（秒）",
      min: 0.05,
      max: 1.5,
      step: 0.05,
      value: 0.45,
    },
    {
      type: "toggle",
      key: "midpoints",
      label: "ポータルの中点を結んだ経路と比べる",
      value: true,
    },
    { type: "button", key: "restart", label: "最初から" },
  ],
  legend: [
    { color: palette.ink, label: "ポータル（通る三角形の境目の辺）" },
    { color: palette.sky, label: "漏斗の左の線" },
    { color: palette.amber, label: "漏斗の右の線" },
    { color: palette.coral, label: "確定した経路" },
    { color: palette.violet, label: "ポータルの中点を結んだ経路" },
  ],
  hint: "床をクリックすると、そこを目的地にします",
  setup(context) {
    const { scene, params } = context;
    scene.add(obstacleBoxes(NAV_OBSTACLES));
    const mesh = buildNavMesh(NAV_BOUNDS, NAV_OBSTACLES, RADIUS);
    const view = navMeshView(mesh);
    scene.add(view);
    const man = mannequin({ accent: palette.amber });
    scene.add(man.root);
    const agent = walker(man, { speed: 1.8 });
    const flag = new Mesh(
      new ConeGeometry(0.16, 0.5, 16),
      standard(palette.coral, { emissive: 0.5 })
    );
    scene.add(flag);
    const portalLines = segments([], palette.ink, {
      width: 1.4,
      opacity: 0.55,
    });
    const currentPortal = segments([], palette.ink, { width: 4 });
    const leftLine = segments([], palette.sky, { width: 3 });
    const rightLine = segments([], palette.amber, { width: 3 });
    const pathLine = polyline([], palette.coral, { width: 4 });
    const middleLine = polyline([], palette.violet, {
      width: 2,
      dashed: true,
      dashSize: 0.14,
      gapSize: 0.1,
    });
    const apexMarker = marker(palette.ink, 0.09);
    scene.add(
      portalLines,
      currentPortal,
      leftLine,
      rightLine,
      pathLine,
      middleLine,
      apexMarker
    );

    const random = rng(11);
    let position: Point2 = { x: -6, y: 3.5 };
    let goal: Point2 = { x: 6, y: -3.5 };
    agent.setPath([toVector(position)]);
    let portals: Portal[] = [];
    let steps: FunnelStep[] = [];
    let finalPath: Point2[] = [];
    let middlePath: Point2[] = [];
    let stepIndex = 0;
    let timer = 0;
    let walking = false;
    let pause = 0;

    const plan = () => {
      const from = locate(mesh, position);
      const to = locate(mesh, goal);
      if (from < 0 || to < 0) {
        return;
      }
      const { corridor } = findCorridor(mesh, from, to);
      const inCorridor = new Set(corridor);
      for (let index = 0; index < mesh.triangles.length; index++) {
        view.tint(
          index,
          inCorridor.has(index)
            ? new Color("#3d6488").lerp(new Color(palette.amber), 0.35)
            : "#2b4561"
        );
      }
      view.commit();
      portals = portalsOf(mesh, corridor, position, goal);
      ({ steps, path: finalPath } = funnel(portals));
      middlePath = [
        position,
        ...portals.slice(1, -1).map((p) => ({
          x: (p.left.x + p.right.x) / 2,
          y: (p.left.y + p.right.y) / 2,
        })),
        goal,
      ];
      portalLines.setPoints(
        portals
          .slice(1, -1)
          .flatMap((p) => [toVector(p.left, Y), toVector(p.right, Y)])
      );
      middleLine.setPoints(middlePath.map((p) => toVector(p, Y + 0.01)));
      flag.position.copy(toVector(goal, 0.3));
      stepIndex = 0;
      timer = 0;
      walking = false;
      agent.setPath([toVector(position)]);
    };
    plan();
    context.onPick((point) => {
      const target = { x: point.x, y: point.z };
      if (locate(mesh, target) < 0) {
        return;
      }
      const here = agent.position;
      position = { x: here.x, y: here.z };
      goal = target;
      plan();
    });

    return {
      update({ dt }) {
        middleLine.visible = params["midpoints"] === true;
        const step = steps[Math.min(stepIndex, steps.length - 1)];
        if (!walking) {
          timer += dt;
          if (timer >= Number(params["interval"])) {
            timer = 0;
            stepIndex++;
            if (stepIndex >= steps.length) {
              walking = true;
              agent.setPath(finalPath.map((p) => toVector(p)));
            }
          }
        }
        const showFunnel = !walking && step !== undefined;
        leftLine.visible = showFunnel;
        rightLine.visible = showFunnel;
        currentPortal.visible = showFunnel;
        apexMarker.visible = showFunnel;
        if (step && showFunnel) {
          const apex = toVector(step.apex, Y + 0.03);
          leftLine.setPoints([apex, toVector(step.left, Y + 0.03)]);
          rightLine.setPoints([apex, toVector(step.right, Y + 0.03)]);
          const portal = portals[step.portal];
          if (portal) {
            currentPortal.setPoints([
              toVector(portal.left, Y + 0.02),
              toVector(portal.right, Y + 0.02),
            ]);
          }
          apexMarker.position.copy(apex);
          pathLine.setPoints(step.path.map((p) => toVector(p, Y + 0.04)));
          pathLine.visible = step.path.length > 1;
        } else {
          pathLine.setPoints(finalPath.map((p) => toVector(p, Y + 0.04)));
          pathLine.visible = true;
        }
        const { done } = agent.update(walking ? dt : 0);
        if (walking && done) {
          pause += dt;
          if (pause > 1.2) {
            pause = 0;
            const here = agent.position;
            position = { x: here.x, y: here.z };
            for (let tries = 0; tries < 60; tries++) {
              const candidate = {
                x: NAV_BOUNDS.x0 + random() * (NAV_BOUNDS.x1 - NAV_BOUNDS.x0),
                y: NAV_BOUNDS.y0 + random() * (NAV_BOUNDS.y1 - NAV_BOUNDS.y0),
              };
              const far =
                Math.hypot(candidate.x - position.x, candidate.y - position.y) >
                7;
              if (far && locate(mesh, candidate) >= 0) {
                goal = candidate;
                break;
              }
            }
            plan();
          }
        }
        context.readout("ポータルの数", `${Math.max(0, portals.length - 2)}`);
        context.readout("曲がり角の数", `${Math.max(0, finalPath.length - 2)}`);
        context.readout(
          "経路の長さ（中点を結ぶ / ファネル法）",
          `${polylineLength(middlePath).toFixed(2)} / ${polylineLength(finalPath).toFixed(2)}`
        );
        context.caption(
          walking
            ? "漏斗が最後まで進むと、角をかすめる最短の折れ線ができる。ポータルの中点を結ぶ（紫の点線）よりも短く、壁ぎりぎりを自然に曲がる。キャラクターはこの折れ線に沿って歩く。"
            : "頂点（白い点）から、ポータルの左端へ青い線、右端へ黄色い線を張る。次のポータルの端が漏斗の内側にあれば線を狭める。片側の線が反対側の線を越えたら、越えられた側の端を曲がり角として経路に加え（赤）、そこを新しい頂点にしてやり直す。"
        );
      },
      action(key) {
        if (key === "restart") {
          const here = agent.position;
          position = { x: here.x, y: here.z };
          plan();
        }
      },
      dispose() {
        view.dispose();
      },
    };
  },
};
