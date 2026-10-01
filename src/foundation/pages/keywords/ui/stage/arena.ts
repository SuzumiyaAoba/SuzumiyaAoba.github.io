import {
  CircleGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { palette } from "./kit";
import { mannequin } from "./mannequin";
import type { Mannequin } from "./mannequin";
import {
  cellAt,
  cellCenter,
  gridSearch,
  parseMap,
  walkable,
  walker,
} from "./navgrid";
import type { GridMap } from "./navgrid";
import type { DemoContext } from "./types";
import { handle } from "./widgets";

/** 判断（AI）のデモで共通に使う、部屋と柱のある小さな地図。 */
export const ARENA = [
  "############################",
  "#..........#...............#",
  "#..........#...............#",
  "#...##.....#.....####......#",
  "#...##...........####......#",
  "#..........#...............#",
  "#..........#...............#",
  "#####..#####.....#.....#####",
  "#................#.........#",
  "#................#.........#",
  "#.....###........#...##....#",
  "#.....###..................#",
  "#..........................#",
  "#..............#...........#",
  "#..............#...........#",
  "############################",
];

export function arenaMap() {
  return parseMap(ARENA, 0.5);
}

/** 2 点の間に壁がないか（格子を細かく調べる）。 */
export function lineOfSight(map: GridMap, a: Vector3, b: Vector3) {
  const distance = a.distanceTo(b);
  const steps = Math.ceil(distance / (map.cell * 0.25));
  for (let k = 1; k < steps; k++) {
    const t = k / steps;
    const x = a.x + (b.x - a.x) * t;
    const z = a.z + (b.z - a.z) * t;
    if (!walkable(map, cellAt(map, x, z))) {
      return false;
    }
  }
  return true;
}

/** 位置に最も近い歩けるセル（壁の中にいても抜け出せるように）。 */
export function nearestWalkable(map: GridMap, point: Vector3) {
  const center = cellAt(map, point.x, point.z);
  if (walkable(map, center)) {
    return center;
  }
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  const probe = new Vector3();
  for (let index = 0; index < map.blocked.length; index++) {
    if (walkable(map, index)) {
      const distance = cellCenter(map, index, probe).distanceToSquared(point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
  }
  return best;
}

/** 格子の A* で経路を求め、見通しのきく点を飛ばして折れ線を短くする。 */
export function routeTo(map: GridMap, from: Vector3, to: Vector3) {
  const start = nearestWalkable(map, from);
  const goal = nearestWalkable(map, to);
  if (start < 0 || goal < 0) {
    return [from.clone()];
  }
  const { path } = gridSearch(map, [start], goal, {
    mode: "astar",
    diagonal: true,
  });
  const raw = [from.clone(), ...path.map((i) => cellCenter(map, i))];
  const last = raw.at(-1);
  if (last) {
    last.copy(to).setY(0);
  }
  const result = [raw[0] ?? from.clone()];
  let anchor = 0;
  while (anchor < raw.length - 1) {
    const origin = raw[anchor] ?? from;
    let next = raw.length - 1;
    while (
      next > anchor + 1 &&
      !lineOfSight(map, origin, raw[next] ?? origin)
    ) {
      next--;
    }
    const point = raw[next];
    if (point) {
      result.push(point);
    }
    anchor = next;
  }
  return result;
}

/** 地図の中のランダムな歩ける点。 */
export function randomWalkable(map: GridMap, random: () => number) {
  for (let tries = 0; tries < 200; tries++) {
    const index = Math.floor(random() * map.blocked.length);
    if (walkable(map, index)) {
      return cellCenter(map, index);
    }
  }
  return new Vector3();
}

export type Npc = ReturnType<typeof npc>;

/**
 * 視界の扇形と頭上のアイコン付きのキャラクター。
 * goTo で経路を引いて歩かせ、update で進める。
 */
export function npc(
  context: DemoContext,
  map: GridMap,
  options: {
    accent?: string;
    fov?: number;
    range?: number;
    speed?: number;
  } = {}
) {
  const man: Mannequin = mannequin({ accent: options.accent ?? palette.coral });
  const move = walker(man, { speed: options.speed ?? 1.3 });
  const fov = options.fov ?? (110 * Math.PI) / 180;
  const range = options.range ?? 4.5;
  const cone = new Mesh(
    new CircleGeometry(range, 32, Math.PI / 2 - fov / 2, fov),
    new MeshBasicMaterial({
      color: options.accent ?? palette.coral,
      transparent: true,
      opacity: 0.13,
      side: DoubleSide,
      depthWrite: false,
    })
  );
  cone.rotation.x = -Math.PI / 2;
  cone.position.y = 0.03;
  const icon = context.label("", { size: "md", tone: "strong" });
  icon.position.set(0, 1.25, 0);
  const { root } = man;
  context.scene.add(root, cone, icon);
  let destination: Vector3 | null = null;
  const goTo = (target: Vector3) => {
    if (destination && destination.distanceTo(target) < 0.3) {
      return;
    }
    destination = target.clone();
    move.setPath(routeTo(map, root.position, target));
  };
  const stop = () => {
    destination = null;
    move.setPath([root.position.clone()]);
  };
  /** 相手が視界の扇形の中にいて、壁にさえぎられていないか。 */
  const sees = (target: Vector3) => {
    const toTarget = target.clone().sub(root.position).setY(0);
    const distance = toTarget.length();
    if (distance > range) {
      return false;
    }
    const facing = new Vector3(
      Math.sin(root.rotation.y),
      0,
      Math.cos(root.rotation.y)
    );
    const angle = facing.angleTo(toTarget);
    return angle < fov / 2 && lineOfSight(map, root.position, target);
  };
  const update = (dt: number, speed?: number) => {
    const result = move.update(dt, speed);
    cone.position.set(root.position.x, 0.03, root.position.z);
    cone.rotation.z = root.rotation.y + Math.PI;
    icon.position.set(root.position.x, 1.3, root.position.z);
    if (result.done) {
      destination = null;
    }
    return result;
  };
  const setIcon = (text: string) => {
    icon.setText(text);
    icon.visible = text.length > 0;
  };
  return {
    root,
    man,
    cone,
    icon,
    goTo,
    stop,
    sees,
    update,
    setIcon,
    face: move.face,
    get arrived() {
      return destination === null;
    },
    get position() {
      return root.position;
    },
    setConeColor(color: string) {
      cone.material.color.set(color);
    },
  };
}

/**
 * プレイヤー（ドラッグで動かせる光る球）。ドラッグしていない間は巡回路を自動で回る。
 */
export function playerTarget(
  context: DemoContext,
  map: GridMap,
  loop: readonly Vector3[]
) {
  const body = handle(palette.lime, 0.16);
  body.position.copy(loop[0] ?? new Vector3()).setY(0.2);
  context.scene.add(body);
  let dragging = 0;
  let segment = 0;
  context.draggable(body, {
    normal: [0, 1, 0],
    origin: [0, 0.2, 0],
    clamp: (position) => {
      if (!walkable(map, cellAt(map, position.x, position.z))) {
        position.copy(body.position);
      }
      position.y = 0.2;
    },
    onDrag: () => {
      dragging = 4;
    },
  });
  const update = (dt: number, auto: boolean) => {
    dragging = Math.max(0, dragging - dt);
    if (!auto || dragging > 0 || loop.length < 2) {
      return;
    }
    const target = loop[(segment + 1) % loop.length];
    if (!target) {
      return;
    }
    const direction = target.clone().setY(0.2).sub(body.position);
    const distance = direction.length();
    const step = dt * 1.1;
    if (distance <= step) {
      segment = (segment + 1) % loop.length;
    } else {
      body.position.addScaledVector(direction, step / distance);
    }
  };
  const reset = () => {
    segment = 0;
    body.position.copy(loop[0] ?? body.position).setY(0.2);
  };
  return {
    body,
    update,
    reset,
    get position() {
      return body.position;
    },
    get dragging() {
      return dragging > 0;
    },
  };
}

/** 格子の座標（列, 行）から位置を作る。 */
export const at = (map: GridMap, col: number, row: number) =>
  cellCenter(map, row * map.cols + col);

const SVG = "http://www.w3.org/2000/svg";

/** SVG の要素を作る。 */
export function svg<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number>,
  text?: string
) {
  const element = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

/** HUD（右下）に置く図の枠。width は rem 単位の表示幅。 */
export function diagramPanel(
  context: DemoContext,
  options: { title: string; width: number; height: number; rem?: number }
) {
  const container = document.createElement("figure");
  container.className = "keyword-stage-graph";
  const caption = document.createElement("figcaption");
  caption.textContent = options.title;
  const root = svg("svg", {
    viewBox: `0 0 ${options.width} ${options.height}`,
  });
  root.style.width = `${options.rem ?? 16}rem`;
  container.append(caption, root);
  context.hud(container);
  return { root, container, caption };
}
