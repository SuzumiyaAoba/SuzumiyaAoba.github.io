import {
  BufferAttribute,
  BufferGeometry,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import { fbm2, valueNoise3 } from "../../kit";
import { applyCollapses, clusterVertices, qemSequence } from "../../decimate";
import type { Collapse } from "../../decimate";
import { weld } from "../../meshTopology";
import type { DemoModule } from "../../types";

const OFFSET = 2.35;

type Source = { positions: Float32Array; triangles: Uint32Array };

/** 平らな野原と、けわしい山のある地形（格子）。 */
function terrain(): Source {
  const n = 96;
  const positions = new Float32Array(n * n * 3);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 4 - 2;
      const z = (j / (n - 1)) * 4 - 2;
      const mountain = Math.max(0, 1 - Math.hypot(x - 0.6, z + 0.4) / 1.5);
      const ridge = 1 - Math.abs(fbm2(x * 0.9 + 3, z * 0.9 + 1, 5) * 2);
      const height = mountain * mountain * (0.5 + ridge * ridge * 1.1);
      positions.set([x, height, z], (j * n + i) * 3);
    }
  }
  const triangles: number[] = [];
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i;
      triangles.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
    }
  }
  return { positions, triangles: new Uint32Array(triangles) };
}

/** 細かい凸凹のある岩。 */
function rock(): Source {
  const geometry = weld(new IcosahedronGeometry(1, 36));
  const positions = Float32Array.from(geometry.getAttribute("position").array);
  for (let v = 0; v < positions.length; v += 3) {
    const x = positions[v] ?? 0;
    const y = positions[v + 1] ?? 0;
    const z = positions[v + 2] ?? 0;
    let noise = 0;
    let amplitude = 0.3;
    let frequency = 1.6;
    for (let octave = 0; octave < 5; octave++) {
      noise +=
        (valueNoise3(x * frequency + 5, y * frequency, z * frequency) - 0.5) *
        amplitude;
      amplitude *= 0.5;
      frequency *= 2.2;
    }
    const radius = 1.1 + noise;
    positions[v] = x * radius;
    positions[v + 1] = y * radius * 0.8 + 0.9;
    positions[v + 2] = z * radius;
  }
  return {
    positions,
    triangles: Uint32Array.from(geometry.index?.array ?? []),
  };
}

function soup(source: Source) {
  const out = new Float32Array(source.triangles.length * 3);
  for (const [n, v] of source.triangles.entries()) {
    out.set(
      [
        source.positions[v * 3] ?? 0,
        source.positions[v * 3 + 1] ?? 0,
        source.positions[v * 3 + 2] ?? 0,
      ],
      n * 3
    );
  }
  return out;
}

/** 三角形ごとの位置の配列から形を作り、面と辺の表示の両方に使う。 */
function setGeometry(
  view: { mesh: Mesh; wire: Mesh },
  positions: Float32Array
) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  view.mesh.geometry.dispose();
  view.mesh.geometry = geometry;
  view.wire.geometry = geometry;
}

export const demo: DemoModule = {
  alt: "見た目の誤差が小さい所から辺を点に縮めていき、面の数を減らすメッシュ簡略化（二次誤差 QEM）のデモ。左が元の形、右が簡略化した形。平らな野原のように、面を減らしても形が変わらない所では大きな三角形にまとめ、けわしい山の尾根のように形が変わりやすい所には細かい三角形を残す。単純に格子でまとめる方法と比べると、同じ面数でも形の保ち方がまったく違う。遠くの物を少ない面で描く LOD（詳細度の切り替え）の材料を作るのに使う。",
  camera: { position: [0, 4.6, 6.2], target: [0, 0.6, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "preset",
      label: "元の形",
      value: "terrain",
      options: [
        { value: "terrain", label: "野原と山の地形" },
        { value: "rock", label: "岩" },
      ],
    },
    {
      type: "select",
      key: "method",
      label: "減らし方",
      value: "qem",
      options: [
        { value: "qem", label: "二次誤差（QEM）で辺を縮める" },
        { value: "cluster", label: "格子でまとめる（頂点クラスタリング）" },
      ],
    },
    {
      type: "range",
      key: "ratio",
      label: "残す面の割合",
      min: 0.005,
      max: 1,
      step: 0.005,
      value: 0.05,
      format: (value) => `${(value * 100).toFixed(1)}%`,
    },
    {
      type: "toggle",
      key: "auto",
      label: "割合を自動で上下させる",
      value: false,
    },
    { type: "toggle", key: "wire", label: "三角形の辺を表示", value: true },
  ],
  legend: [
    { color: "#a8c686", label: "元の形（左）" },
    { color: "#d9b27c", label: "簡略化した形（右）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const makeView = (color: string, x: number) => {
      const mesh = new Mesh(
        new BufferGeometry(),
        new MeshStandardMaterial({
          color,
          roughness: 0.75,
          flatShading: true,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        })
      );
      mesh.position.x = x;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      const wire = new Mesh(
        mesh.geometry,
        new MeshBasicMaterial({
          color: "#1b2230",
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        })
      );
      wire.position.x = x;
      scene.add(wire);
      return { mesh, wire };
    };
    const left = makeView("#a8c686", -OFFSET);
    const right = makeView("#d9b27c", OFFSET);
    const leftLabel = context.label("元の形", { tone: "strong" });
    leftLabel.position.set(-OFFSET, 2.6, 0);
    const rightLabel = context.label("簡略化", { tone: "strong" });
    rightLabel.position.set(OFFSET, 2.6, 0);
    scene.add(leftLabel, rightLabel);

    let source: Source = terrain();
    let sequence: Collapse[] = [];
    let presetUsed = "";
    let signature = "";
    let buildMs = 0;
    let autoPhase = 0;

    return {
      update({ dt }) {
        const preset = String(params["preset"]);
        if (preset !== presetUsed) {
          presetUsed = preset;
          source = preset === "rock" ? rock() : terrain();
          const start = performance.now();
          sequence = qemSequence(source.positions, source.triangles);
          buildMs = performance.now() - start;
          setGeometry(left, soup(source));
          signature = "";
        }
        let ratio = Number(params["ratio"]);
        if (params["auto"] === true) {
          autoPhase += dt * 0.25;
          ratio =
            0.005 + (0.5 - 0.5 * Math.cos(autoPhase * Math.PI * 2)) ** 3 * 0.4;
        }
        const total = source.triangles.length / 3;
        const target = Math.max(8, Math.round(total * ratio));
        const key = `${preset}|${params["method"]}|${target}`;
        if (key !== signature) {
          signature = key;
          let positions: Float32Array;
          if (params["method"] === "cluster") {
            // 目標の面数にいちばん近くなる格子の細かさを探す
            let best = clusterVertices(source.positions, source.triangles, 2);
            for (let cells = 3; cells < 200; cells++) {
              const candidate = clusterVertices(
                source.positions,
                source.triangles,
                cells
              );
              if (candidate.length / 9 > target) {
                best =
                  Math.abs(candidate.length / 9 - target) <
                  Math.abs(best.length / 9 - target)
                    ? candidate
                    : best;
                break;
              }
              best = candidate;
            }
            positions = best;
          } else {
            // 面の数が目標を下回るまで、記録した縮約を先頭から適用する
            let low = 0;
            let high = sequence.length;
            while (low < high) {
              const middle = (low + high) >> 1;
              if ((sequence[middle]?.triangles ?? 0) <= target) {
                high = middle;
              } else {
                low = middle + 1;
              }
            }
            positions = applyCollapses(
              source.positions,
              source.triangles,
              sequence,
              low + 1
            );
          }
          setGeometry(right, positions);
          context.readout(
            "面の数",
            `${total.toLocaleString()} → ${(positions.length / 9).toLocaleString()}`
          );
          context.readout(
            "縮約の列を作る時間",
            `${buildMs.toFixed(0)} ms（最初に 1 回だけ）`
          );
        }
        const showWire = params["wire"] === true;
        left.wire.visible = showWire;
        right.wire.visible = showWire;
        context.caption(
          params["method"] === "cluster"
            ? "空間を格子に分け、同じマスに入った頂点を 1 点にまとめる。速くて簡単だが、形の大事な所かどうかを考えないので、平らな所にも山にも同じ細かさの三角形が並び、尾根や岩の角が崩れやすい。"
            : "各頂点に「周りの面の平面からの距離の 2 乗の和」（二次誤差）を持たせ、縮めても形が変わりにくい辺から順に 1 点へまとめる。平らな野原は少ない大きな三角形になり、山の尾根には細かい三角形が残る。まとめる順番を記録しておけば、好きな面数の形を一瞬で作れる。"
        );
      },
    };
  },
};
