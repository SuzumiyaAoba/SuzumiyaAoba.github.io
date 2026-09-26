import { CircleGeometry, Color, Mesh, MeshBasicMaterial, Vector3 } from "three";
import {
  clamp,
  palette,
  pointCloud,
  rng,
  segments,
  TAU,
  valueNoise3,
} from "../../kit";
import type { DemoModule } from "../../types";

const COUNT = 5000;
const LIFE = 7;
const EPSILON = 0.01;

const potential = (x: number, y: number, z: number, t: number, out: Vector3) =>
  out.set(
    valueNoise3(x, y + t, z) - 0.5,
    valueNoise3(x + 31.4, y - t, z + 12.7) - 0.5,
    valueNoise3(x - 17.9, y + 5.1, z + t + 41.3) - 0.5
  );

const a = new Vector3();
const b = new Vector3();

/** ポテンシャル場 ψ の回転 ∇×ψ を中心差分で求める。 */
function curl(x: number, y: number, z: number, t: number, out: Vector3) {
  potential(x, y + EPSILON, z, t, a);
  potential(x, y - EPSILON, z, t, b);
  const dPzdy = (a.z - b.z) / (2 * EPSILON);
  const dPxdy = (a.x - b.x) / (2 * EPSILON);
  potential(x, y, z + EPSILON, t, a);
  potential(x, y, z - EPSILON, t, b);
  const dPydz = (a.y - b.y) / (2 * EPSILON);
  const dPxdz = (a.x - b.x) / (2 * EPSILON);
  potential(x + EPSILON, y, z, t, a);
  potential(x - EPSILON, y, z, t, b);
  const dPydx = (a.y - b.y) / (2 * EPSILON);
  const dPzdx = (a.z - b.z) / (2 * EPSILON);
  return out.set(dPzdy - dPydz, dPxdz - dPzdx, dPydx - dPxdy);
}

/** 比較用：ノイズ値をそのまま速度にした場（発散がゼロにならない）。 */
function rawNoise(x: number, y: number, z: number, t: number, out: Vector3) {
  return potential(x, y, z, t, out).multiplyScalar(6);
}

const wrap = (value: number, min: number, size: number) =>
  min + ((((value - min) % size) + size) % size);

const BOX = 2.4;
const BOX_BOTTOM = 0.4;
const BOX_HEIGHT = 4;
const CELLS = 4;

export const demo: DemoModule = {
  alt: "数千個の光の粒子を速度場で動かすデモ。カールノイズでは粒子が渦を巻きながらも均一に混ざり、ノイズをそのまま速度にすると粒子が特定の点に吸い込まれて固まる。",
  camera: { position: [5.6, 3.6, 6.8], target: [0, 2.2, 0], autoRotate: 3 },
  bloom: { strength: 0.9, radius: 0.6, threshold: 0.05 },
  controls: [
    {
      type: "select",
      key: "field",
      label: "速度場",
      value: "curl",
      options: [
        { value: "curl", label: "カールノイズ" },
        { value: "raw", label: "ノイズをそのまま使う" },
      ],
      hint: "後者は発散を持つため、粒子が吸い込み点に溜まります。",
    },
    {
      type: "select",
      key: "scene",
      label: "場面",
      value: "plume",
      options: [
        { value: "plume", label: "立ち上る煙" },
        { value: "box", label: "箱いっぱいの粒子" },
      ],
      hint: "箱では粒子の偏りを数値で比べられます。",
    },
    {
      type: "range",
      key: "strength",
      label: "渦の強さ",
      min: 0,
      max: 3,
      step: 0.1,
      value: 1.6,
    },
    {
      type: "range",
      key: "scale",
      label: "渦の大きさ",
      min: 0.3,
      max: 2,
      step: 0.05,
      value: 0.9,
      hint: "小さいほど細かい渦になります。",
    },
    {
      type: "toggle",
      key: "arrows",
      label: "速度場の矢印を表示",
      value: false,
    },
  ],
  legend: [
    { color: palette.cyan, label: "粒子（若い／下層）" },
    { color: palette.violet, label: "粒子（古い／上層）" },
    { color: palette.amber, label: "速度場（水平断面）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(7);
    const particles = pointCloud(COUNT, { size: 9, additive: true });
    scene.add(particles);
    const velocities = new Float32Array(COUNT);
    const ages = new Float32Array(COUNT);
    const layers = new Float32Array(COUNT);
    const young = new Color(palette.cyan);
    const old = new Color(palette.violet);
    const mixed = new Color();
    const isBox = () => params["scene"] === "box";

    const spawn = (index: number) => {
      const ix = index * 3;
      if (isBox()) {
        particles.positions[ix] = (random() * 2 - 1) * BOX;
        particles.positions[ix + 1] = BOX_BOTTOM + random() * BOX_HEIGHT;
        particles.positions[ix + 2] = (random() * 2 - 1) * BOX;
        layers[index] =
          ((particles.positions[ix + 1] ?? 0) - BOX_BOTTOM) / BOX_HEIGHT;
        return;
      }
      const angle = random() * TAU;
      const radius = Math.sqrt(random()) * 0.35;
      particles.positions[ix] = Math.cos(angle) * radius;
      particles.positions[ix + 1] = random() * 0.1;
      particles.positions[ix + 2] = Math.sin(angle) * radius;
      velocities[index] = 0.8 + random() * 0.4;
    };
    const reset = () => {
      for (let index = 0; index < COUNT; index++) {
        spawn(index);
        ages[index] = random() * LIFE;
      }
    };
    reset();

    const emitter = new Mesh(
      new CircleGeometry(0.45, 48),
      new MeshBasicMaterial({
        color: palette.cyan,
        transparent: true,
        opacity: 0.35,
      })
    );
    emitter.rotation.x = -Math.PI / 2;
    emitter.position.y = 0.01;
    scene.add(emitter);
    const emitterLabel = context.label("発生源", { color: palette.cyan });
    emitterLabel.position.set(0, -0.05, 0.7);
    scene.add(emitterLabel);

    const boxCorners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const;
    const boxEdges: Vector3[] = [];
    for (let corner = 0; corner < 4; corner++) {
      const [x0, z0] = boxCorners[corner] ?? [0, 0];
      const [x1, z1] = boxCorners[(corner + 1) % 4] ?? [0, 0];
      for (const y of [BOX_BOTTOM, BOX_BOTTOM + BOX_HEIGHT]) {
        boxEdges.push(
          new Vector3(x0 * BOX, y, z0 * BOX),
          new Vector3(x1 * BOX, y, z1 * BOX)
        );
      }
      boxEdges.push(
        new Vector3(x0 * BOX, BOX_BOTTOM, z0 * BOX),
        new Vector3(x0 * BOX, BOX_BOTTOM + BOX_HEIGHT, z0 * BOX)
      );
    }
    const box = segments(boxEdges, palette.muted, { width: 1, opacity: 0.4 });
    scene.add(box);

    const GRID = 9;
    const sliceY = 2.4;
    const arrows = segments([], palette.amber, { width: 1.6, opacity: 0.8 });
    scene.add(arrows);
    const arrowPoints = Array.from(
      { length: GRID * GRID * 2 },
      () => new Vector3()
    );
    const sliceLabel = context.label("y = 2.4 の断面", {
      color: palette.amber,
      tone: "muted",
    });
    sliceLabel.position.set(2.3, sliceY, -2.3);
    scene.add(sliceLabel);

    const velocity = new Vector3();
    const cells = new Float32Array(CELLS * CELLS * CELLS);

    return {
      change(key) {
        if (key === "scene") {
          reset();
        }
      },
      update({ time, dt }) {
        const strength = Number(params["strength"]);
        const scale = Number(params["scale"]);
        const field = params["field"] === "curl" ? curl : rawNoise;
        const boxMode = isBox();
        const flowTime = time * 0.12;
        emitter.visible = !boxMode;
        emitterLabel.visible = !boxMode;
        box.visible = boxMode;
        cells.fill(0);
        for (let index = 0; index < COUNT; index++) {
          const ix = index * 3;
          const age = (ages[index] ?? 0) + dt;
          ages[index] = age;
          if (!boxMode && age > LIFE) {
            ages[index] = 0;
            spawn(index);
          }
          const x = particles.positions[ix] ?? 0;
          const y = particles.positions[ix + 1] ?? 0;
          const z = particles.positions[ix + 2] ?? 0;
          field(x / scale, y / scale, z / scale, flowTime, velocity);
          const rise = boxMode ? 0 : (velocities[index] ?? 1);
          let nx = x + velocity.x * strength * dt;
          let ny = y + (velocity.y * strength + rise) * dt;
          let nz = z + velocity.z * strength * dt;
          if (boxMode) {
            nx = wrap(nx, -BOX, BOX * 2);
            ny = wrap(ny, BOX_BOTTOM, BOX_HEIGHT);
            nz = wrap(nz, -BOX, BOX * 2);
            const cx = Math.min(
              CELLS - 1,
              Math.floor(((nx + BOX) / (BOX * 2)) * CELLS)
            );
            const cy = Math.min(
              CELLS - 1,
              Math.floor(((ny - BOX_BOTTOM) / BOX_HEIGHT) * CELLS)
            );
            const cz = Math.min(
              CELLS - 1,
              Math.floor(((nz + BOX) / (BOX * 2)) * CELLS)
            );
            const cell = (cy * CELLS + cz) * CELLS + cx;
            cells[cell] = (cells[cell] ?? 0) + 1;
          }
          particles.positions[ix] = nx;
          particles.positions[ix + 1] = ny;
          particles.positions[ix + 2] = nz;
          if (boxMode) {
            mixed
              .copy(young)
              .lerp(old, layers[index] ?? 0)
              .multiplyScalar(0.55);
          } else {
            const t = clamp((ages[index] ?? 0) / LIFE);
            const fade = Math.min(1, (ages[index] ?? 0) * 3) * (1 - t) ** 1.5;
            mixed.copy(young).lerp(old, t).multiplyScalar(fade);
          }
          particles.colors[ix] = mixed.r;
          particles.colors[ix + 1] = mixed.g;
          particles.colors[ix + 2] = mixed.b;
        }
        particles.commit();

        context.readout("粒子数", COUNT.toLocaleString("ja-JP"));
        if (boxMode) {
          let maxCell = 0;
          let empty = 0;
          for (const value of cells) {
            maxCell = Math.max(maxCell, value);
            if (value < (COUNT / cells.length) * 0.25) {
              empty++;
            }
          }
          context.readout(
            "最も混んだ区画 / 平均",
            `${(maxCell / (COUNT / cells.length)).toFixed(2)} 倍`
          );
          context.readout("ほぼ空の区画", `${empty} / ${cells.length}`);
        } else {
          context.readout("最も混んだ区画 / 平均", "—");
          context.readout("ほぼ空の区画", "—");
        }

        arrows.visible = params["arrows"] === true;
        sliceLabel.visible = arrows.visible;
        if (arrows.visible) {
          for (let gx = 0; gx < GRID; gx++) {
            for (let gz = 0; gz < GRID; gz++) {
              const x = (gx / (GRID - 1) - 0.5) * 4.6;
              const z = (gz / (GRID - 1) - 0.5) * 4.6;
              field(x / scale, sliceY / scale, z / scale, flowTime, velocity);
              velocity.y = 0;
              velocity.multiplyScalar(0.12 * (0.4 + strength));
              const base = (gx * GRID + gz) * 2;
              arrowPoints[base]?.set(x, sliceY, z);
              arrowPoints[base + 1]?.set(
                x + velocity.x,
                sliceY,
                z + velocity.z
              );
            }
          }
          arrows.setPoints(arrowPoints);
        }
        const curlMode = params["field"] === "curl";
        context.caption(
          boxMode
            ? curlMode
              ? "発散ゼロの流れでは、かき混ぜても粒子の密度はほぼ一様のまま。色の層だけが渦で混ざる。"
              : "発散のある流れでは粒子が吸い込み点へ集まり、空っぽの区画が増えていく。"
            : curlMode
              ? "カールノイズは発散ゼロの流れ。粒子は渦を巻いても一か所に溜まらない。"
              : "ノイズ値をそのまま速度にすると、流れの吸い込み口に粒子が固まってしまう。"
        );
      },
    };
  },
};
