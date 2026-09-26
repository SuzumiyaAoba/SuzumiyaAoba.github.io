import {
  BoxGeometry,
  DodecahedronGeometry,
  Mesh,
  MeshPhysicalMaterial,
  PlaneGeometry,
} from "three";
import { palette, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";

const N = 128;
const SIZE = 10;
const CELL = SIZE / N;

export const demo: DemoModule = {
  alt: "池の水面に広がる波紋を、格子状に並べた水面の高さだけで計算する波動シミュレーションのデモ。各点の高さは、周りの点との高さの差に引っ張られて加速するので、1 か所を押し下げると輪になって波が広がり、岩に当たって跳ね返り、重なり合う。水面をクリックすると、しずくを落とせる。",
  camera: { position: [0, 8.5, 9], target: [0, 0, 0] },
  studio: { floor: false, background: "#16202a" },
  controls: [
    { type: "toggle", key: "rain", label: "雨を降らせる", value: true },
    {
      type: "range",
      key: "speed",
      label: "波の速さ",
      min: 0.1,
      max: 0.5,
      step: 0.01,
      value: 0.35,
    },
    {
      type: "range",
      key: "damping",
      label: "減衰",
      min: 0,
      max: 0.05,
      step: 0.001,
      value: 0.012,
      hint: "大きいほど波がすぐに消えます。",
    },
    { type: "toggle", key: "rocks", label: "岩で波をさえぎる", value: true },
  ],
  legend: [{ color: palette.sky, label: "水面" }],
  hint: "水面をクリックすると、しずくが落ちて波紋が広がります。",
  setup(context) {
    const { scene, params } = context;
    const random = rng(8);
    let current = new Float32Array(N * N);
    let previous = new Float32Array(N * N);
    const blocked = new Uint8Array(N * N);
    const rocks = [
      { x: -2.2, z: 0.8, r: 0.7 },
      { x: 1.8, z: -1.2, r: 0.55 },
      { x: 0.6, z: 2.2, r: 0.4 },
    ];
    const rockMeshes = rocks.map(({ x, z, r }) => {
      const mesh = new Mesh(
        new DodecahedronGeometry(r, 1),
        standard("#5d5a55", { roughness: 0.9 })
      );
      mesh.position.set(x, 0, z);
      mesh.scale.y = 0.7;
      mesh.castShadow = true;
      scene.add(mesh);
      return mesh;
    });
    const markRocks = (enabled: boolean) => {
      blocked.fill(0);
      if (!enabled) {
        return;
      }
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const x = (i + 0.5) * CELL - SIZE / 2;
          const z = (j + 0.5) * CELL - SIZE / 2;
          for (const rock of rocks) {
            if (Math.hypot(x - rock.x, z - rock.z) < rock.r * 0.95) {
              blocked[j * N + i] = 1;
            }
          }
        }
      }
    };
    let rocksOn = true;
    markRocks(true);

    // 池の底と縁
    const bottom = new Mesh(
      new PlaneGeometry(SIZE, SIZE),
      standard("#6b5f4a", { roughness: 1 })
    );
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -0.8;
    scene.add(bottom);
    const rimMaterial = standard("#8a8378", { roughness: 0.85 });
    for (const [x, z, w, d] of [
      [0, -SIZE / 2 - 0.3, SIZE + 1.2, 0.6],
      [0, SIZE / 2 + 0.3, SIZE + 1.2, 0.6],
      [-SIZE / 2 - 0.3, 0, 0.6, SIZE],
      [SIZE / 2 + 0.3, 0, 0.6, SIZE],
    ] as const) {
      const rim = new Mesh(new BoxGeometry(w, 1.2, d), rimMaterial);
      rim.position.set(x, -0.3, z);
      rim.castShadow = true;
      rim.receiveShadow = true;
      scene.add(rim);
    }

    const geometry = new PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
    geometry.rotateX(-Math.PI / 2);
    const water = new Mesh(
      geometry,
      new MeshPhysicalMaterial({
        color: "#1f5d73",
        roughness: 0.05,
        metalness: 0,
        transparent: true,
        opacity: 0.9,
        clearcoat: 1,
      })
    );
    water.receiveShadow = true;
    scene.add(water);
    scene.environmentIntensity = 0.8;

    const drop = (i: number, j: number, strength: number, radius = 2) => {
      for (let dj = -radius; dj <= radius; dj++) {
        for (let di = -radius; di <= radius; di++) {
          const x = i + di;
          const z = j + dj;
          if (x > 0 && x < N - 1 && z > 0 && z < N - 1) {
            const falloff = Math.max(
              0,
              1 - Math.hypot(di, dj) / (radius + 0.5)
            );
            current[z * N + x] = (current[z * N + x] ?? 0) - strength * falloff;
          }
        }
      }
    };
    context.onPick((point) => {
      drop(
        Math.round((point.x + SIZE / 2) / CELL),
        Math.round((point.z + SIZE / 2) / CELL),
        0.6,
        4
      );
    });

    const step = (c2: number, damping: number) => {
      // h_new = 2h − h_old + c²（周りの平均との差）… 波動方程式の差分
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          const index = j * N + i;
          if (blocked[index] === 1) {
            previous[index] = 0;
            continue;
          }
          const h = current[index] ?? 0;
          const laplacian =
            (current[index - 1] ?? 0) +
            (current[index + 1] ?? 0) +
            (current[index - N] ?? 0) +
            (current[index + N] ?? 0) -
            4 * h;
          const next = 2 * h - (previous[index] ?? 0) + c2 * laplacian;
          previous[index] = next * (1 - damping);
        }
      }
      [current, previous] = [previous, current];
    };

    return {
      update({ dt }) {
        const enabled = params["rocks"] === true;
        if (enabled !== rocksOn) {
          rocksOn = enabled;
          markRocks(enabled);
        }
        for (const mesh of rockMeshes) {
          mesh.visible = enabled;
        }
        if (params["rain"] === true && random() < dt * 6) {
          drop(
            3 + Math.floor(random() * (N - 6)),
            3 + Math.floor(random() * (N - 6)),
            0.12 + random() * 0.1,
            2
          );
        }
        const speed = Number(params["speed"]);
        const c2 = speed * speed;
        const damping = Number(params["damping"]) * 0.4;
        const steps = dt > 0 ? 2 : 0;
        for (let s = 0; s < steps; s++) {
          step(c2, damping);
        }
        // しずくは水面を押し下げるだけなので、平均の高さがずれないよう戻す
        let mean = 0;
        for (let index = 0; index < N * N; index++) {
          mean += current[index] ?? 0;
        }
        mean /= N * N;
        for (let index = 0; index < N * N; index++) {
          current[index] = (current[index] ?? 0) - mean;
          previous[index] = (previous[index] ?? 0) - mean;
        }
        const position = geometry.getAttribute("position");
        for (let index = 0; index < N * N; index++) {
          position.setY(
            index,
            Math.max(-0.4, Math.min(0.4, (current[index] ?? 0) * 0.4))
          );
        }
        position.needsUpdate = true;
        geometry.computeVertexNormals();
        context.readout("格子", `${N}×${N}`);
        context.caption(
          "各点の高さは、上下左右の点との高さの差に引っ張られて加速する（波動方程式）。1 点を押し下げると、その周りが次々に引っ張られて輪になって広がり、岩や池の縁で跳ね返る。"
        );
      },
    };
  },
};
