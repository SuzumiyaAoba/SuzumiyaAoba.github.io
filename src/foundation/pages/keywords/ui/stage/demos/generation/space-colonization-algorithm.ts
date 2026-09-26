import {
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { palette, pointCloud, rng } from "../../kit";
import type { DemoModule } from "../../types";

const MAX_NODES = 6000;
const MAX_ATTRACTORS = 4000;

type Node = {
  position: Vector3;
  parent: number;
  children: number;
  radius: number;
  depth: number;
};

/** 誘引点を置く範囲（樹冠の形）。 */
function sampleCrown(shape: string, random: () => number) {
  for (;;) {
    const x = random() * 2 - 1;
    const y = random() * 2 - 1;
    const z = random() * 2 - 1;
    if (shape === "cone") {
      // 針葉樹：下が広く上がとがった円錐
      const height = (y + 1) / 2;
      if (Math.hypot(x, z) < 1 - height) {
        return new Vector3(x * 1.5, 1.2 + height * 4, z * 1.5);
      }
    } else if (shape === "leaf") {
      // 葉脈：平たい葉の形（上下に細長い、厚みほぼ 0）
      const r = Math.hypot(x * 1.6, (y - 0.1) * 1.05);
      if (r < 1 - Math.abs(y) * 0.25) {
        return new Vector3(x * 1.4, 2.8 + y * 2.4, 0);
      }
    } else if (x * x + y * y + z * z < 1) {
      // 広葉樹：少しつぶれた球
      return new Vector3(x * 2, 3.4 + y * 1.4, z * 2);
    }
  }
}

export const demo: DemoModule = {
  alt: "空間にばらまいた誘引点（葉の芽の候補）に向かって、枝の先が少しずつ伸びていく空間占有法のデモ。各誘引点は、決められた距離の中で一番近い枝の節を 1 つだけ引き寄せる。節は、自分を引き寄せている誘引点の方向の平均へ新しい節を伸ばし、枝に十分近づいた誘引点は消える。誘引点の奪い合いで枝どうしが自然に避け合い、樹冠を埋めるように広がる。枝の太さは、先から根元へ「子の太さの和」で決める（パイプモデル）。",
  camera: { position: [0, 3.2, 9.5], target: [0, 2.8, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "shape",
      label: "誘引点の範囲",
      value: "crown",
      options: [
        { value: "crown", label: "広葉樹（丸い樹冠）" },
        { value: "cone", label: "針葉樹（円錐）" },
        { value: "leaf", label: "葉脈（平たい葉）" },
      ],
    },
    {
      type: "range",
      key: "attractors",
      label: "誘引点の数",
      min: 100,
      max: MAX_ATTRACTORS,
      step: 50,
      value: 1500,
    },
    {
      type: "range",
      key: "influence",
      label: "引き寄せる距離",
      min: 0.3,
      max: 3,
      step: 0.05,
      value: 1.2,
    },
    {
      type: "range",
      key: "kill",
      label: "消える距離",
      min: 0.05,
      max: 0.8,
      step: 0.01,
      value: 0.22,
    },
    {
      type: "range",
      key: "step",
      label: "1 回に伸びる長さ",
      min: 0.04,
      max: 0.3,
      step: 0.01,
      value: 0.1,
    },
    { type: "toggle", key: "points", label: "誘引点を表示", value: true },
    { type: "button", key: "restart", label: "もう一度育てる" },
  ],
  legend: [
    { color: palette.amber, label: "誘引点（まだ枝が来ていない）" },
    { color: "#7a5236", label: "枝（太さはパイプモデル）" },
    { color: palette.lime, label: "枝先の葉" },
  ],
  setup(context) {
    const { scene, params } = context;
    const group = new Group();
    scene.add(group);
    const branches = new InstancedMesh(
      new CylinderGeometry(1, 1, 1, 7, 1, true),
      new MeshStandardMaterial({ color: "#7a5236", roughness: 0.85 }),
      MAX_NODES
    );
    branches.castShadow = true;
    branches.count = 0;
    // 最初は 0 本なので、包囲球で視野外と判定されないようにする
    branches.frustumCulled = false;
    group.add(branches);
    const attractorView = pointCloud(MAX_ATTRACTORS, {
      size: 6,
      color: palette.amber,
    });
    group.add(attractorView);
    const leaves = pointCloud(MAX_NODES, { size: 12, color: palette.lime });
    group.add(leaves);

    let nodes: Node[] = [];
    let attractors: Vector3[] = [];
    let seed = 5;
    let signature = "";
    let finished = false;
    let finishedTime = 0;
    let iterations = 0;
    let stalled = 0;
    let lastRemaining = 0;

    const restart = () => {
      const random = rng(seed);
      const count = Number(params["attractors"]);
      const shape = String(params["shape"]);
      attractors = Array.from({ length: count }, () =>
        sampleCrown(shape, random)
      );
      // 根元から、樹冠の下まで幹を 1 本伸ばしておく
      nodes = [
        {
          position: new Vector3(0, 0, 0),
          parent: -1,
          children: 0,
          radius: 0,
          depth: 0,
        },
      ];
      finished = false;
      iterations = 0;
      stalled = 0;
      lastRemaining = attractors.length;
    };

    /** 1 回分の成長。伸びた節の数を返す。 */
    const grow = () => {
      const influence = Number(params["influence"]);
      const kill = Number(params["kill"]);
      const step = Number(params["step"]);
      // 節を格子に入れておき、近くの節だけを調べる
      const cell = influence;
      const grid = new Map<string, number[]>();
      const keyOf = (p: Vector3, dx = 0, dy = 0, dz = 0) =>
        `${Math.floor(p.x / cell) + dx},${Math.floor(p.y / cell) + dy},${Math.floor(p.z / cell) + dz}`;
      for (const [index, node] of nodes.entries()) {
        const key = keyOf(node.position);
        const list = grid.get(key);
        if (list) {
          list.push(index);
        } else {
          grid.set(key, [index]);
        }
      }
      const pull = new Map<number, Vector3>();
      const survivors: Vector3[] = [];
      for (const attractor of attractors) {
        let best = -1;
        let bestDistance = influence;
        let killed = false;
        for (let dx = -1; dx <= 1 && !killed; dx++) {
          for (let dy = -1; dy <= 1 && !killed; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              for (const index of grid.get(keyOf(attractor, dx, dy, dz)) ??
                []) {
                const distance =
                  nodes[index]?.position.distanceTo(attractor) ??
                  Number.POSITIVE_INFINITY;
                if (distance < kill) {
                  killed = true;
                  break;
                }
                if (distance < bestDistance) {
                  bestDistance = distance;
                  best = index;
                }
              }
              if (killed) {
                break;
              }
            }
          }
        }
        if (killed) {
          continue; // 枝が十分近くまで来たので、この誘引点は役目を終える
        }
        survivors.push(attractor);
        const node = nodes[best];
        if (node) {
          const direction = attractor.clone().sub(node.position).normalize();
          pull.set(best, (pull.get(best) ?? new Vector3()).add(direction));
        }
      }
      attractors = survivors;
      let grown = 0;
      if (pull.size === 0 && nodes.length < 400) {
        // まだどの誘引点にも届かない：幹をまっすぐ上へ伸ばす
        const tip = nodes.at(-1);
        if (tip) {
          const tipIndex = nodes.length - 1;
          nodes.push({
            position: tip.position.clone().add(new Vector3(0, step, 0)),
            parent: tipIndex,
            children: 0,
            radius: 0,
            depth: tip.depth,
          });
          tip.children++;
          grown++;
        }
      }
      for (const [index, direction] of pull) {
        const node = nodes[index];
        if (!node || nodes.length >= MAX_NODES || direction.lengthSq() < 1e-8) {
          continue;
        }
        nodes.push({
          position: node.position
            .clone()
            .addScaledVector(direction.normalize(), step),
          parent: index,
          children: 0,
          radius: 0,
          depth: node.depth + (node.children > 0 ? 1 : 0),
        });
        node.children++;
        grown++;
      }
      return grown;
    };

    const matrix = new Matrix4();
    const up = new Vector3(0, 1, 0);
    const quaternion = new Quaternion();
    const scale = new Vector3();
    const draw = () => {
      // パイプモデル：枝先を細い基本の太さにし、根元へ向かって r^2.5 を足し合わせる
      const exponent = 2.7;
      for (const node of nodes) {
        node.radius = 0;
      }
      for (let index = nodes.length - 1; index >= 0; index--) {
        const node = nodes[index];
        if (!node) {
          continue;
        }
        if (node.children === 0) {
          node.radius = 0.01;
        }
        const parent = nodes[node.parent];
        if (parent) {
          parent.radius =
            (parent.radius ** exponent + node.radius ** exponent) **
            (1 / exponent);
        }
      }
      let count = 0;
      let leafCount = 0;
      for (const [index, node] of nodes.entries()) {
        const parent = nodes[node.parent];
        if (parent) {
          const offset = node.position.clone().sub(parent.position);
          const length = offset.length();
          quaternion.setFromUnitVectors(up, offset.normalize());
          scale.set(node.radius, length * 1.05, node.radius);
          matrix.compose(
            parent.position.clone().lerp(node.position, 0.5),
            quaternion,
            scale
          );
          branches.setMatrixAt(count, matrix);
          count++;
        }
        if (node.children === 0 && index > 0 && finished) {
          leaves.positions.set(
            [node.position.x, node.position.y, node.position.z],
            leafCount * 3
          );
          leafCount++;
        }
      }
      branches.count = count;
      branches.instanceMatrix.needsUpdate = true;
      leaves.geometry.setDrawRange(0, leafCount);
      leaves.commit();
      for (const [index, point] of attractors.entries()) {
        attractorView.positions.set([point.x, point.y, point.z], index * 3);
      }
      attractorView.geometry.setDrawRange(0, attractors.length);
      attractorView.commit();
    };

    return {
      action(key) {
        if (key === "restart") {
          seed++;
          signature = "";
        }
      },
      update({ time, dt }) {
        const key = [
          params["shape"],
          params["attractors"],
          params["influence"],
          params["kill"],
          params["step"],
          seed,
        ].join("|");
        if (key !== signature) {
          signature = key;
          restart();
        }
        if (!finished) {
          // 1 フレームに数回ずつ育てる
          for (let n = 0; n < 3; n++) {
            const grown = grow();
            iterations++;
            // 残った誘引点が減らない状態が続いたら（枝が行ったり来たりするだけなら）打ち切る
            stalled = attractors.length === lastRemaining ? stalled + 1 : 0;
            lastRemaining = attractors.length;
            if (grown === 0 || attractors.length === 0 || stalled > 25) {
              finished = true;
              finishedTime = time;
              break;
            }
          }
          draw();
        } else if (time - finishedTime > 5) {
          seed++;
          signature = "";
        }
        attractorView.visible = params["points"] === true;
        group.rotation.y += params["shape"] === "leaf" ? 0 : dt * 0.15;
        if (params["shape"] === "leaf") {
          group.rotation.y = 0;
        }
        context.readout("節の数", nodes.length.toLocaleString());
        context.readout("残りの誘引点", attractors.length.toLocaleString());
        context.readout("成長の回数", `${iterations}`);
        context.caption(
          finished
            ? "誘引点がなくなるか、どの枝も伸びなくなったら完成。枝どうしが同じ誘引点を奪い合うので、枝が重ならずに空間を埋め、根元へ向かうほど太くなる。"
            : "各誘引点（黄色）は、引き寄せる距離の中で一番近い節を 1 つ引っぱる。節は、引っぱられる向きの平均へ新しい節を伸ばす。枝が近づいた誘引点は消えていく。"
        );
      },
    };
  },
};
