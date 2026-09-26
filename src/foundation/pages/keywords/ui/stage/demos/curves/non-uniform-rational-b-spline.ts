import { Mesh, SphereGeometry, Vector3, Vector4 } from "three";
import { palette, polyline, segments, standard, trail } from "../../kit";
import type { DemoModule } from "../../types";

const RADIUS = 3;
const HEIGHT = 1.4;
const DEGREE = 2;
const KNOTS = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4];
const SAMPLES = 360;

/** 同次座標 (xw, yw, zw, w) で de Boor を行い、最後に w で割る。 */
function nurbs(points: readonly Vector4[], u: number, out: Vector3) {
  const spans = KNOTS.at(-1) ?? 1;
  const clampedU = Math.min(Math.max(u, 0), spans - 1e-6);
  let k = DEGREE;
  while (k < KNOTS.length - DEGREE - 2 && clampedU >= (KNOTS[k + 1] ?? 0)) {
    k++;
  }
  const d: Vector4[] = [];
  for (let j = 0; j <= DEGREE; j++) {
    d.push((points[j + k - DEGREE] ?? new Vector4()).clone());
  }
  for (let r = 1; r <= DEGREE; r++) {
    for (let j = DEGREE; j >= r; j--) {
      const left = KNOTS[j + k - DEGREE] ?? 0;
      const right = KNOTS[j + 1 + k - r] ?? 1;
      const alpha = (clampedU - left) / Math.max(1e-6, right - left);
      const previous = d[j - 1];
      const current = d[j];
      if (previous && current) {
        current
          .multiplyScalar(alpha)
          .add(previous.clone().multiplyScalar(1 - alpha));
      }
    }
  }
  const result = d[DEGREE] ?? new Vector4(0, 0, 0, 1);
  return out.set(result.x / result.w, result.y / result.w, result.z / result.w);
}

export const demo: DemoModule = {
  alt: "惑星の周りを回る衛星の軌道を NURBS で描くデモ。四角形の角にある制御点の重みを約 0.707 にすると軌道は正確な円になり、重みを変えると円から外れて膨らんだりしぼんだりする。",
  camera: { position: [0, 7.2, 7.4], target: [0, 1, 0] },
  bloom: { strength: 0.5, radius: 0.4, threshold: 0.8 },
  controls: [
    {
      type: "range",
      key: "weight",
      label: "角の制御点の重み w",
      min: 0.1,
      max: 3,
      step: 0.001,
      value: Math.SQRT1_2,
      hint: "√2/2 ≈ 0.707 のとき正確な円になります。",
    },
    {
      type: "button",
      key: "exact",
      label: "w = √2/2 に戻す",
    },
    { type: "toggle", key: "reference", label: "真円（比較用）", value: true },
  ],
  legend: [
    { color: palette.cyan, label: "NURBS 曲線" },
    { color: palette.muted, label: "真円" },
    { color: palette.amber, label: "角の制御点（重み付き）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const planet = new Mesh(
      new SphereGeometry(0.9, 64, 48),
      standard("#3f6fb5", { roughness: 0.55 })
    );
    planet.position.y = HEIGHT;
    planet.castShadow = true;
    const moon = new Mesh(
      new SphereGeometry(0.18, 32, 24),
      standard("#e7e2d6", { roughness: 0.7, emissive: 0.1 })
    );
    moon.castShadow = true;
    const moonTrail = trail(60, palette.cyan, { width: 3 });
    scene.add(planet, moon, moonTrail);

    const square = [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
      [1, 0],
    ];
    const cornerMarkers = square.map(([x, z], index) => {
      const item = new Mesh(
        new SphereGeometry(0.08, 20, 14),
        standard(index % 2 === 1 ? palette.amber : palette.ink, {
          emissive: 0.6,
        })
      );
      item.position.set((x ?? 0) * RADIUS, HEIGHT, (z ?? 0) * RADIUS);
      scene.add(item);
      return item;
    });
    const hull = polyline(
      cornerMarkers.map((item) => item.position.clone()),
      palette.muted,
      { width: 1, dashed: true, dashSize: 0.12, gapSize: 0.1, opacity: 0.6 }
    );
    const circle: Vector3[] = [];
    for (let sample = 0; sample <= SAMPLES; sample++) {
      const angle = (sample / SAMPLES) * Math.PI * 2;
      circle.push(
        new Vector3(Math.cos(angle) * RADIUS, HEIGHT, Math.sin(angle) * RADIUS)
      );
    }
    const reference = polyline(circle, palette.muted, {
      width: 1.5,
      opacity: 0.8,
    });
    const curve = polyline([], palette.cyan, { width: 3 });
    const errors = segments([], palette.coral, { width: 1.5 });
    scene.add(hull, reference, curve, errors);
    const weightLabels = cornerMarkers
      .filter((_, index) => index % 2 === 1)
      .map((item) => {
        const label = context.label("", {
          color: palette.amber,
          tone: "muted",
        });
        label.position.copy(item.position).add(new Vector3(0, 0.3, 0));
        scene.add(label);
        return label;
      });
    let angle = 0;

    return {
      action(key) {
        if (key === "exact") {
          context.setParam("weight", Math.SQRT1_2);
        }
      },
      update({ dt }) {
        const weight = Number(params["weight"]);
        const homogeneous = square.map(([x, z], index) => {
          const w = index % 2 === 1 ? weight : 1;
          return new Vector4(
            (x ?? 0) * RADIUS * w,
            HEIGHT * w,
            (z ?? 0) * RADIUS * w,
            w
          );
        });
        const points: Vector3[] = [];
        const spokes: Vector3[] = [];
        let maxError = 0;
        for (let sample = 0; sample <= SAMPLES; sample++) {
          const point = nurbs(
            homogeneous,
            (sample / SAMPLES) * 4,
            new Vector3()
          );
          points.push(point);
          const radius = Math.hypot(point.x, point.z);
          maxError = Math.max(maxError, Math.abs(radius - RADIUS));
          if (sample % 12 === 0) {
            const onCircle = point.clone().setY(HEIGHT).setLength(1);
            spokes.push(
              point,
              new Vector3(onCircle.x * RADIUS, HEIGHT, onCircle.z * RADIUS)
            );
          }
        }
        curve.setPoints(points);
        errors.setPoints(spokes);
        errors.visible = maxError > 0.01;
        reference.visible = params["reference"] === true;
        for (const label of weightLabels) {
          label.setText(`w = ${weight.toFixed(3)}`);
        }
        for (const [index, item] of cornerMarkers.entries()) {
          if (index % 2 === 1) {
            item.scale.setScalar(0.6 + Math.min(2.4, weight) * 0.6);
          }
        }

        angle = (angle + dt * 0.25) % 1;
        nurbs(homogeneous, angle * 4, moon.position);
        moonTrail.push(moon.position);
        planet.rotation.y += dt * 0.2;

        context.readout("真円からの最大ずれ", `${maxError.toFixed(4)} m`);
        context.readout("重み w", weight.toFixed(3));
        context.caption(
          Math.abs(weight - Math.SQRT1_2) < 0.002
            ? "角の重みを √2/2 にした有理 2 次曲線は、多項式では表せない円を誤差ゼロで表す。"
            : weight > Math.SQRT1_2
              ? "重みを大きくすると、曲線がその制御点に強く引き寄せられ、角ばった形になる。"
              : "重みを小さくすると制御点の影響が弱まり、曲線は内側へしぼんでいく。"
        );
      },
    };
  },
};
