import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { palette, pointCloud, standard } from "../../kit";
import type { DemoModule } from "../../types";

const MAX_SAMPLES = 64;
const SUBDIVISIONS = 4;
const MAX_VERTICES = MAX_SAMPLES * SUBDIVISIONS * 2;
const SAMPLE_RATE = 30;

/** カトマル・ロム補間（一様）。 */
function catmull(
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  p3: Vector3,
  t: number,
  out: Vector3
) {
  const t2 = t * t;
  const t3 = t2 * t;
  return out.set(
    0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 *
      (2 * p1.z +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)
  );
}

export const demo: DemoModule = {
  alt: "剣を振ると刃の軌跡に光の帯が残るデモ。刃の根元と先端の位置を毎フレーム記録し、隣り合う記録を三角形の帯でつないで剣閃を描く。記録点だけを表示したり、記録の間を曲線で補間したりして仕組みを確認できる。",
  camera: { position: [0.4, 1.8, 6.2], target: [0, 1.4, 0] },
  bloom: { strength: 0.8, radius: 0.45, threshold: 0.6 },
  studio: { background: "#06080e" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "表示",
      value: "ribbon",
      options: [
        { value: "ribbon", label: "リボン" },
        { value: "points", label: "記録した点だけ" },
      ],
    },
    {
      type: "range",
      key: "length",
      label: "軌跡の長さ（記録数）",
      min: 4,
      max: MAX_SAMPLES,
      step: 1,
      value: 18,
    },
    {
      type: "range",
      key: "speed",
      label: "振りの速さ",
      min: 0.3,
      max: 2,
      step: 0.05,
      value: 1,
    },
    {
      type: "toggle",
      key: "smooth",
      label: "記録の間を曲線で補間",
      value: true,
      hint: "記録は 30 回/秒。速く振ると補間なしでは帯がカクカクします。",
    },
  ],
  legend: [
    { color: palette.cyan, label: "剣閃のリボン" },
    { color: palette.amber, label: "記録した刃の根元と先端" },
  ],
  setup(context) {
    const { scene, params } = context;
    const pivot = new Group();
    pivot.position.set(0, 1.4, 0);
    const sword = new Group();
    const blade = new Mesh(
      new BoxGeometry(0.07, 1.7, 0.02),
      standard("#dfe6f0", { metalness: 0.9, roughness: 0.15 })
    );
    blade.position.y = 1.1;
    const guard = new Mesh(
      new BoxGeometry(0.36, 0.06, 0.08),
      standard(palette.amber, { metalness: 0.7, roughness: 0.3 })
    );
    guard.position.y = 0.22;
    const grip = new Mesh(
      new BoxGeometry(0.06, 0.4, 0.06),
      standard("#3b2c24")
    );
    sword.add(blade, guard, grip);
    sword.traverse((child) => {
      child.castShadow = true;
    });
    pivot.add(sword);
    scene.add(pivot);

    const positions = new Float32Array(MAX_VERTICES * 3);
    const params2 = new Float32Array(MAX_VERTICES * 2);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aTrail", new BufferAttribute(params2, 2));
    const indices: number[] = [];
    for (let segment = 0; segment < MAX_VERTICES / 2 - 1; segment++) {
      const a = segment * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geometry.setIndex(indices);
    const ribbon = new Mesh(
      geometry,
      new ShaderMaterial({
        vertexShader: /* glsl */ `
          attribute vec2 aTrail;
          varying vec2 vTrail;
          void main() {
            vTrail = aTrail;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vTrail;
          void main() {
            // x: 新しさ（1 = 刃の現在位置）、y: 根元 0 〜 先端 1
            float fade = pow(vTrail.x, 1.6);
            float edge = smoothstep(0.0, 1.0, vTrail.y);
            vec3 color = mix(vec3(0.1, 0.5, 1.0), vec3(0.75, 1.0, 1.0), edge * vTrail.x);
            gl_FragColor = vec4(color * fade * (0.2 + 0.8 * edge), 1.0);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      })
    );
    ribbon.frustumCulled = false;
    scene.add(ribbon);
    const dots = pointCloud(MAX_SAMPLES * 2, { size: 5, color: palette.amber });
    scene.add(dots);

    const bases: Vector3[] = [];
    const tips: Vector3[] = [];
    const base = new Vector3();
    const tip = new Vector3();
    const point = new Vector3();
    let clock = 0;
    let sampleTimer = 0;

    return {
      update({ dt }) {
        clock += dt * Number(params["speed"]);
        // カメラに向いた面で大きく振り下ろし・振り上げを繰り返す
        const phase = clock * 2.2;
        pivot.rotation.set(
          Math.sin(phase * 2) * 0.35,
          Math.sin(phase * 0.7) * 0.4,
          Math.sin(phase) * 1.7
        );
        pivot.updateMatrixWorld(true);
        base.set(0, 0.9, 0).applyMatrix4(sword.matrixWorld);
        tip.set(0, 1.95, 0).applyMatrix4(sword.matrixWorld);

        sampleTimer += dt;
        if (sampleTimer >= 1 / SAMPLE_RATE) {
          sampleTimer %= 1 / SAMPLE_RATE;
          bases.push(base.clone());
          tips.push(tip.clone());
        }
        const length = Number(params["length"]);
        while (bases.length > length) {
          bases.shift();
          tips.shift();
        }
        // 最新の点は記録を待たず、常に今の刃の位置にする
        const rows: [Vector3, Vector3][] = bases.map((item, index) => [
          item,
          tips[index] ?? item,
        ]);
        rows.push([base.clone(), tip.clone()]);

        const smooth = params["smooth"] === true;
        const steps = smooth ? SUBDIVISIONS : 1;
        const sampled: [Vector3, Vector3][] = [];
        for (let index = 0; index < rows.length - 1; index++) {
          const r0 = rows[Math.max(0, index - 1)];
          const r1 = rows[index];
          const r2 = rows[index + 1];
          const r3 = rows[Math.min(rows.length - 1, index + 2)];
          if (!(r0 && r1 && r2 && r3)) {
            continue;
          }
          for (let step = 0; step < steps; step++) {
            const t = step / steps;
            sampled.push([
              catmull(r0[0], r1[0], r2[0], r3[0], t, new Vector3()),
              catmull(r0[1], r1[1], r2[1], r3[1], t, new Vector3()),
            ]);
          }
        }
        const last = rows.at(-1);
        if (last) {
          sampled.push(last);
        }
        const count = Math.min(sampled.length, MAX_VERTICES / 2);
        for (let index = 0; index < MAX_VERTICES / 2; index++) {
          const row = sampled[Math.min(index, count - 1)];
          const age = count > 1 ? Math.min(index, count - 1) / (count - 1) : 1;
          if (row) {
            positions.set(
              [row[0].x, row[0].y, row[0].z, row[1].x, row[1].y, row[1].z],
              index * 6
            );
          }
          params2.set([age, 0, age, 1], index * 4);
        }
        geometry.setDrawRange(0, Math.max(0, count - 1) * 6);
        const positionAttribute = geometry.getAttribute("position");
        const trailAttribute = geometry.getAttribute("aTrail");
        positionAttribute.needsUpdate = true;
        trailAttribute.needsUpdate = true;

        for (let index = 0; index < MAX_SAMPLES * 2; index++) {
          const row = rows[Math.floor(index / 2)];
          const source = row ? row[index % 2] : undefined;
          if (source) {
            point.copy(source);
          } else {
            point.set(0, -100, 0);
          }
          dots.positions.set([point.x, point.y, point.z], index * 3);
        }
        dots.commit();
        const pointsOnly = params["mode"] === "points";
        ribbon.visible = !pointsOnly;
        dots.visible = pointsOnly || !smooth;

        context.readout("記録", `${rows.length} 組（根元・先端）`);
        context.readout("帯の三角形", `${Math.max(0, count - 1) * 2} 個`);
        context.caption(
          pointsOnly
            ? "毎フレーム記録しているのは、刃の根元と先端の 2 点だけ。これを古い順につなぐとリボンになる。"
            : "隣り合う記録の根元・先端の 4 点で 2 枚の三角形を作り、帯にする。古いほど透明にすると剣閃が尾を引く。"
        );
      },
    };
  },
};
