import {
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import { palette, rng, valueNoise3 } from "../../kit";
import {
  meshVolume,
  updatePositions,
  vertexNeighbors,
  weld,
} from "../../meshTopology";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const CENTER_Y = 1.5;

/** 元の形：丸い塊に、選んだ種類の凸凹を加える。 */
function sourcePositions(base: Float32Array, preset: string) {
  const positions = new Float32Array(base.length);
  const random = rng(5);
  for (let index = 0; index < base.length; index += 3) {
    const x = base[index] ?? 0;
    const y = base[index + 1] ?? 0;
    const z = base[index + 2] ?? 0;
    const length = Math.hypot(x, y, z) || 1;
    // 基本の形：少しつぶれた豆のような塊
    let radius = 1.25 + 0.25 * Math.sin(x * 2.2) * Math.cos(z * 1.7);
    if (preset === "rock") {
      let noise = 0;
      let amplitude = 0.35;
      let frequency = 2.2;
      for (let octave = 0; octave < 4; octave++) {
        noise +=
          (valueNoise3(x * frequency + 3, y * frequency, z * frequency) - 0.5) *
          amplitude;
        amplitude *= 0.55;
        frequency *= 2.1;
      }
      radius += noise;
    } else if (preset === "scan") {
      radius += (random() - 0.5) * 0.12;
    }
    let px = (x / length) * radius;
    let py = (y / length) * radius * 0.85;
    let pz = (z / length) * radius;
    if (preset === "voxel") {
      // ボクセル（格子）に合わせた階段状の形
      const cell = 0.22;
      px = Math.round(px / cell) * cell;
      py = Math.round(py / cell) * cell;
      pz = Math.round(pz / cell) * cell;
    }
    positions[index] = px;
    positions[index + 1] = py;
    positions[index + 2] = pz;
  }
  return positions;
}

export const demo: DemoModule = {
  alt: "凸凹のある形の各頂点を、つながっている周りの頂点の平均へ少しずつ近づけて、表面をなめらかにするラプラシアン平滑化のデモ。ノイズで荒れた岩、ボクセルの階段、スキャンの細かい雑音の 3 種類を用意した。くり返すほどなめらかになるが、単純な平滑化は形全体が縮んでしまう。タウビンの方法では、縮める一歩と膨らませる一歩を交互に行うので、細かい凸凹だけを消して大きさを保てる。右下のグラフは元の体積に対する割合。",
  camera: { position: [3.2, 3.2, 4.6], target: [0, 1.4, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "preset",
      label: "元の形",
      value: "voxel",
      options: [
        { value: "voxel", label: "ボクセルの階段" },
        { value: "rock", label: "ノイズの岩" },
        { value: "scan", label: "スキャンの雑音" },
      ],
    },
    {
      type: "select",
      key: "method",
      label: "平滑化の方法",
      value: "laplacian",
      options: [
        { value: "laplacian", label: "ラプラシアン（平均へ寄せる）" },
        { value: "taubin", label: "タウビン（縮めて膨らませる）" },
      ],
    },
    {
      type: "range",
      key: "iterations",
      label: "くり返しの回数",
      min: 0,
      max: 150,
      step: 1,
      value: 0,
    },
    {
      type: "range",
      key: "lambda",
      label: "1 回に寄せる割合 λ",
      min: 0.05,
      max: 1,
      step: 0.05,
      value: 0.5,
    },
    { type: "toggle", key: "auto", label: "回数を自動で増やす", value: true },
    { type: "toggle", key: "ghost", label: "元の形を重ねる", value: false },
    { type: "toggle", key: "wire", label: "ポリゴンの辺を表示", value: false },
  ],
  legend: [
    { color: palette.sky, label: "体積（元の形 = 100%）" },
    { color: palette.muted, label: "元の形（重ねて表示）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const geometry = weld(new IcosahedronGeometry(1, 28));
    const index = geometry.index ? [...geometry.index.array] : [];
    const base = Float32Array.from(geometry.getAttribute("position").array);
    const neighbors = vertexNeighbors(geometry);
    const material = new MeshStandardMaterial({
      color: "#d7b28c",
      roughness: 0.55,
      metalness: 0.02,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.y = CENTER_Y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const wire = new Mesh(
      geometry,
      new MeshBasicMaterial({
        color: "#1b2230",
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      })
    );
    wire.position.y = CENTER_Y;
    scene.add(wire);
    const ghostGeometry = geometry.clone();
    const ghost = new Mesh(
      ghostGeometry,
      new MeshBasicMaterial({
        color: palette.muted,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      })
    );
    ghost.position.y = CENTER_Y;
    scene.add(ghost);
    const graph = historyGraph(context, {
      title: "体積（元の形に対する %）",
      min: 60,
      max: 105,
      series: [{ color: palette.sky }],
    });

    let original = new Float32Array(0);
    let originalVolume = 1;
    let signature = "";
    let autoCount = 0;
    const current = new Float32Array(base.length);
    const next = new Float32Array(base.length);

    /** 1 回分：各頂点を、つながった頂点の平均へ factor の割合だけ近づける（factor が負なら遠ざける）。 */
    const step = (factor: number) => {
      for (const [vertex, list] of neighbors.entries()) {
        const o = vertex * 3;
        let ax = 0;
        let ay = 0;
        let az = 0;
        for (const other of list) {
          ax += current[other * 3] ?? 0;
          ay += current[other * 3 + 1] ?? 0;
          az += current[other * 3 + 2] ?? 0;
        }
        const count = list.length || 1;
        const x = current[o] ?? 0;
        const y = current[o + 1] ?? 0;
        const z = current[o + 2] ?? 0;
        next[o] = x + factor * (ax / count - x);
        next[o + 1] = y + factor * (ay / count - y);
        next[o + 2] = z + factor * (az / count - z);
      }
      current.set(next);
    };

    const run = (iterations: number) => {
      current.set(original);
      const lambda = Number(params["lambda"]);
      // タウビン：λ で縮めたあと、少し大きい μ（負）で膨らませる。通過帯域 k = 0.1 から μ を決める
      const mu = 1 / (0.1 - 1 / lambda);
      for (let n = 0; n < iterations; n++) {
        step(lambda);
        if (params["method"] === "taubin") {
          step(mu);
        }
      }
      updatePositions(geometry, current);
      const volume = meshVolume(current, index);
      return volume / originalVolume;
    };

    return {
      update({ dt }) {
        const preset = String(params["preset"]);
        if (preset !== signature.split("|")[0]) {
          original = sourcePositions(base, preset);
          originalVolume = meshVolume(original, index);
          updatePositions(ghostGeometry, original);
          autoCount = 0;
          graph.clear();
          signature = "";
        }
        let iterations = Number(params["iterations"]);
        if (params["auto"] === true) {
          autoCount += dt * 12;
          if (autoCount > 150) {
            autoCount = 0;
            graph.clear();
          }
          iterations = Math.floor(autoCount);
        }
        const key = [
          preset,
          params["method"],
          params["lambda"],
          iterations,
        ].join("|");
        if (key !== signature) {
          signature = key;
          const ratio = run(iterations);
          graph.push([ratio * 100]);
          context.readout("くり返し", `${iterations} 回`);
          context.readout("体積", `${(ratio * 100).toFixed(1)}%`);
          context.readout("頂点", neighbors.length.toLocaleString());
        }
        wire.visible = params["wire"] === true;
        ghost.visible = params["ghost"] === true;
        context.caption(
          params["method"] === "taubin"
            ? "λ で周りの平均へ寄せた直後に、μ（負の値）で少し押し戻す。細かい凸凹は寄せる一歩で消え、押し戻す一歩では戻らない。形全体の大きなふくらみは、寄せた分だけ押し戻されるので、体積がほとんど減らない。"
            : "各頂点を、つながった頂点の平均の位置へ λ の割合だけ近づける。細かい凸凹から先に消えていくが、くり返すと形全体も平均へ引き寄せられて縮み、とがった所から丸まっていく。右下のグラフで体積が減り続けるのがわかる。"
        );
      },
    };
  },
};
