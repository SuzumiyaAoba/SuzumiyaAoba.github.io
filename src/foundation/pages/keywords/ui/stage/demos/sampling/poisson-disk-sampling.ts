import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  Vector3,
} from "three";
import { fbm2, palette, pointCloud, rng } from "../../kit";
import type { DemoModule } from "../../types";

const WIDTH = 13;
const DEPTH = 8;
const MAX = 3000;

type Point = { x: number; z: number; r: number };

export const demo: DemoModule = {
  alt: "どの 2 点も決められた距離より近づかないように、森の木を並べていくポアソンディスク分布のデモ。ブリッドソンの方法では、すでに置いた点の周りの輪の中に候補を何個か試し、近すぎる点がなければ採用する。候補が見つからなくなった点は「成長を終えた点」として外す。これを続けると、すき間なく、しかも重ならない自然な木の並びができる。でたらめに置いた場合と比べると、木が重なったり、大きなすき間ができたりしない。ノイズで距離を変えると、密な森とまばらな林を作り分けられる。",
  camera: { position: [0, 8.5, 8.8], target: [0, 0, 0.3], fov: 42 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "置き方",
      value: "poisson",
      options: [
        { value: "poisson", label: "ポアソンディスク（最小距離を守る）" },
        {
          value: "variable",
          label: "場所で距離を変える（密な森とまばらな林）",
        },
        { value: "random", label: "でたらめ（比較用）" },
      ],
    },
    {
      type: "range",
      key: "radius",
      label: "最小距離",
      min: 0.2,
      max: 1.2,
      step: 0.02,
      value: 0.5,
    },
    {
      type: "range",
      key: "attempts",
      label: "1 点あたりの試行回数 k",
      min: 1,
      max: 40,
      step: 1,
      value: 20,
    },
    {
      type: "range",
      key: "speed",
      label: "1 秒に試す回数",
      min: 20,
      max: 3000,
      step: 20,
      value: 300,
    },
    {
      type: "toggle",
      key: "discs",
      label: "木ごとの「近寄れない範囲」を表示",
      value: true,
    },
    { type: "button", key: "restart", label: "最初から" },
  ],
  legend: [
    { color: palette.amber, label: "まだ周りを探している点（アクティブ）" },
    { color: palette.coral, label: "近すぎて捨てた候補" },
    { color: palette.sky, label: "近寄れない範囲（半径は最小距離の半分）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const ground = new Mesh(
      new PlaneGeometry(WIDTH + 0.6, DEPTH + 0.6),
      new MeshStandardMaterial({ color: "#5d7f45", roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const trees = new Group();
    scene.add(trees);
    const crowns = new InstancedMesh(
      new ConeGeometry(0.2, 0.7, 7),
      new MeshStandardMaterial({ color: "#2f6b3c", roughness: 0.8 }),
      MAX
    );
    const trunks = new InstancedMesh(
      new CylinderGeometry(0.04, 0.05, 0.25, 6),
      new MeshStandardMaterial({ color: "#6b4a33" }),
      MAX
    );
    const discs = new InstancedMesh(
      new RingGeometry(0.93, 1, 40),
      new MeshBasicMaterial({
        color: palette.sky,
        transparent: true,
        opacity: 0.55,
      }),
      MAX
    );
    for (const mesh of [crowns, trunks, discs]) {
      mesh.frustumCulled = false;
      mesh.count = 0;
      trees.add(mesh);
    }
    crowns.castShadow = true;
    const active = pointCloud(MAX, { size: 16, color: palette.amber });
    active.position.y = 0.05;
    scene.add(active);
    const rejected = pointCloud(400, { size: 10, color: palette.coral });
    rejected.position.y = 0.05;
    scene.add(rejected);

    let points: Point[] = [];
    let activeList: number[] = [];
    let rejectedList: { x: number; z: number; age: number }[] = [];
    let grid = new Map<string, number[]>();
    let cell = 0.3;
    let random = rng(1);
    let seed = 1;
    let signature = "";
    let budget = 0;
    let done = false;
    let doneTime = 0;

    const radiusAt = (x: number, z: number) => {
      const base = Number(params["radius"]);
      if (params["mode"] !== "variable") {
        return base;
      }
      // ノイズの値で、森の濃い所（半分の距離）とまばらな所（2 倍の距離）を作る
      const n = fbm2(x * 0.28 + 5, z * 0.28 - 2, 3) * 2;
      return (
        base * (n > 0 ? 1 - Math.min(0.5, n * 0.9) : 1 + Math.min(1, -n * 1.6))
      );
    };
    const key = (x: number, z: number) =>
      `${Math.floor((x + WIDTH / 2) / cell)},${Math.floor((z + DEPTH / 2) / cell)}`;
    const insert = (point: Point) => {
      points.push(point);
      const index = points.length - 1;
      const k = key(point.x, point.z);
      const list = grid.get(k);
      if (list) {
        list.push(index);
      } else {
        grid.set(k, [index]);
      }
      return index;
    };
    /** 候補の近くの格子だけを調べ、近すぎる点がないか確かめる。 */
    const fits = (x: number, z: number, r: number) => {
      if (Math.abs(x) > WIDTH / 2 || Math.abs(z) > DEPTH / 2) {
        return false;
      }
      const reach = Math.ceil((Number(params["radius"]) * 2) / cell) + 1;
      const cx = Math.floor((x + WIDTH / 2) / cell);
      const cz = Math.floor((z + DEPTH / 2) / cell);
      for (let dz = -reach; dz <= reach; dz++) {
        for (let dx = -reach; dx <= reach; dx++) {
          for (const index of grid.get(`${cx + dx},${cz + dz}`) ?? []) {
            const other = points[index];
            if (
              other &&
              Math.hypot(other.x - x, other.z - z) < (r + other.r) / 2
            ) {
              return false;
            }
          }
        }
      }
      return true;
    };

    const restart = () => {
      random = rng(seed);
      points = [];
      activeList = [];
      rejectedList = [];
      grid = new Map();
      done = false;
      const minimum =
        Number(params["radius"]) * (params["mode"] === "variable" ? 0.5 : 1);
      cell = minimum / Math.SQRT2;
      if (params["mode"] !== "random") {
        const x = (random() - 0.5) * WIDTH;
        const z = (random() - 0.5) * DEPTH;
        activeList.push(insert({ x, z, r: radiusAt(x, z) }));
      }
    };

    /** 1 回の試行：アクティブな点を 1 つ選び、周りの輪の中に候補を置いてみる。 */
    const attempt = () => {
      if (params["mode"] === "random") {
        // でたらめ：ポアソンディスクと同じ本数になるまで、何も確かめずに置く
        const target = Math.round(
          (WIDTH * DEPTH) / (Number(params["radius"]) ** 2 * 1.6)
        );
        if (points.length >= Math.min(target, MAX)) {
          return false;
        }
        insert({
          x: (random() - 0.5) * WIDTH,
          z: (random() - 0.5) * DEPTH,
          r: Number(params["radius"]),
        });
        return true;
      }
      if (activeList.length === 0 || points.length >= MAX) {
        return false;
      }
      const slot = Math.floor(random() * activeList.length);
      const origin = points[activeList[slot] ?? 0];
      if (!origin) {
        return false;
      }
      const tries = Number(params["attempts"]);
      for (let n = 0; n < tries; n++) {
        const angle = random() * Math.PI * 2;
        const distance = origin.r * (1 + random()); // 半径 r〜2r の輪の中
        const x = origin.x + Math.cos(angle) * distance;
        const z = origin.z + Math.sin(angle) * distance;
        const r = radiusAt(x, z);
        if (fits(x, z, r)) {
          activeList.push(insert({ x, z, r }));
          return true;
        }
        if (rejectedList.length < 400) {
          rejectedList.push({ x, z, age: 0 });
        }
      }
      // k 回試しても置けなければ、この点の周りは埋まったとみなして外す
      activeList.splice(slot, 1);
      return true;
    };

    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const flat = new Quaternion().setFromAxisAngle(
      new Vector3(1, 0, 0),
      -Math.PI / 2
    );
    const draw = () => {
      for (const [index, point] of points.entries()) {
        const s = Math.min(1.6, point.r / 0.5) * 0.9;
        matrix.compose(
          new Vector3(point.x, 0.25 * s + 0.35 * s, point.z),
          quaternion,
          new Vector3(s, s, s)
        );
        crowns.setMatrixAt(index, matrix);
        matrix.compose(
          new Vector3(point.x, 0.12 * s, point.z),
          quaternion,
          new Vector3(s, s, s)
        );
        trunks.setMatrixAt(index, matrix);
        matrix.compose(
          new Vector3(point.x, 0.01, point.z),
          flat,
          new Vector3(point.r / 2, point.r / 2, 1)
        );
        discs.setMatrixAt(index, matrix);
      }
      crowns.count = points.length;
      trunks.count = points.length;
      discs.count = params["discs"] === true ? points.length : 0;
      for (const mesh of [crowns, trunks, discs]) {
        mesh.instanceMatrix.needsUpdate = true;
      }
      for (const [n, index] of activeList.entries()) {
        const point = points[index];
        if (point) {
          active.positions.set([point.x, 0, point.z], n * 3);
        }
      }
      active.geometry.setDrawRange(0, activeList.length);
      active.commit();
      for (const [n, point] of rejectedList.entries()) {
        rejected.positions.set([point.x, 0, point.z], n * 3);
      }
      rejected.geometry.setDrawRange(0, rejectedList.length);
      rejected.commit();
    };

    const minimumDistance = () => {
      let smallest = Number.POSITIVE_INFINITY;
      for (const [index, point] of points.entries()) {
        for (let other = index + 1; other < points.length; other++) {
          const q = points[other];
          if (q) {
            smallest = Math.min(
              smallest,
              Math.hypot(point.x - q.x, point.z - q.z)
            );
          }
        }
      }
      return smallest;
    };

    return {
      action(name) {
        if (name === "restart") {
          seed++;
          signature = "";
        }
      },
      update({ time, dt }) {
        const next = [
          params["mode"],
          params["radius"],
          params["attempts"],
          seed,
        ].join("|");
        if (next !== signature) {
          signature = next;
          restart();
        }
        budget += dt * Number(params["speed"]);
        let steps = 0;
        while (budget >= 1 && steps < 3000) {
          budget -= 1;
          steps++;
          if (!attempt()) {
            if (!done) {
              done = true;
              doneTime = time;
            }
            budget = 0;
            break;
          }
        }
        rejectedList = rejectedList.filter((point) => (point.age += dt) < 0.4);
        if (done && time - doneTime > 4) {
          seed++;
          signature = "";
        }
        draw();
        context.readout("木の本数", `${points.length}`);
        context.readout("アクティブな点", `${activeList.length}`);
        context.readout(
          "いちばん近い 2 本の距離",
          points.length > 1 && points.length < 1500
            ? minimumDistance().toFixed(2)
            : "—"
        );
        const mode = String(params["mode"]);
        context.caption(
          mode === "random"
            ? "何も確かめずにでたらめに置くと、同じ本数でも、木が重なって生える所（近寄れない範囲の輪が重なる所）と、大きな空き地ができる。人の目には「偏っている」と感じられる。"
            : mode === "variable"
              ? "最小距離を場所ごとに変えている（ノイズで決める）。距離が短い所は密な森に、長い所はまばらな林になり、どちらの中でも木どうしは重ならない。"
              : "黄色いアクティブな点の周りの輪（最小距離〜その 2 倍）に候補を置き、近すぎる木がなければ採用する（赤は捨てた候補）。k 回試してだめなら、その点は外す。アクティブな点がなくなったら、すき間なく埋まったということ。"
        );
      },
    };
  },
};
