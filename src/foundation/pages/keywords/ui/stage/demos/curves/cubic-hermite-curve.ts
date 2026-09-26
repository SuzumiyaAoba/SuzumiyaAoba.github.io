import { CylinderGeometry, Group, Mesh, TorusGeometry, Vector3 } from "three";
import { arrow, marker, palette, polyline, standard, trail } from "../../kit";
import { handle, hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const HEIGHT = 0.7;
const SAMPLES = 80;

const h00 = (t: number) => 2 * t ** 3 - 3 * t ** 2 + 1;
const h10 = (t: number) => t ** 3 - 2 * t ** 2 + t;
const h01 = (t: number) => -2 * t ** 3 + 3 * t ** 2;
const h11 = (t: number) => t ** 3 - t ** 2;

function hermite(
  p0: Vector3,
  t0: Vector3,
  p1: Vector3,
  t1: Vector3,
  t: number,
  out: Vector3
) {
  return out
    .copy(p0)
    .multiplyScalar(h00(t))
    .addScaledVector(t0, h10(t))
    .addScaledVector(p1, h01(t))
    .addScaledVector(t1, h11(t));
}

export const demo: DemoModule = {
  alt: "砲台から標的へ曲がりながら飛ぶレーザーのデモ。始点と終点の位置、それぞれの接線（出る向きと入る向き）をドラッグで変えると、エルミート曲線の軌道が変わる。横のグラフは 4 つの基底関数。",
  camera: { position: [0.3, 6.2, 7.2], target: [0, 0.4, 0.3] },
  bloom: { strength: 0.9, radius: 0.4, threshold: 0.75 },
  controls: [
    {
      type: "range",
      key: "scale",
      label: "接線の長さ（倍率）",
      min: 0,
      max: 3,
      step: 0.05,
      value: 1.4,
      hint: "長いほど、端点の向きを長く保ってから曲がります。",
    },
    {
      type: "range",
      key: "speed",
      label: "発射間隔",
      min: 0.5,
      max: 3,
      step: 0.1,
      value: 1.4,
      format: (value) => `${value.toFixed(1)} 秒`,
    },
    { type: "toggle", key: "tangents", label: "接線と基底関数", value: true },
  ],
  legend: [
    { color: palette.cyan, label: "始点 P₀ と接線 T₀" },
    { color: palette.coral, label: "終点 P₁ と接線 T₁" },
  ],
  hint: "光る球をドラッグすると端点、矢印の先の球で接線を動かせます。",
  setup(context) {
    const { scene, params } = context;
    const p0 = new Vector3(-3.2, HEIGHT, 1.2);
    const p1 = new Vector3(3, HEIGHT, -0.6);
    const t0Base = new Vector3(1.2, 0, -2.4);
    const t1Base = new Vector3(1.6, 0, 2.2);

    const turret = new Group();
    const base = new Mesh(
      new CylinderGeometry(0.42, 0.52, 0.35, 32),
      standard("#56627a", { metalness: 0.5, roughness: 0.4 })
    );
    base.position.y = 0.18;
    const barrel = new Mesh(
      new CylinderGeometry(0.09, 0.11, 0.8, 16),
      standard("#8290a8", { metalness: 0.6, roughness: 0.35 })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.3, 0, 0);
    const head = new Group();
    head.position.y = HEIGHT;
    head.add(barrel);
    turret.add(base, head);
    for (const mesh of [base, barrel]) {
      mesh.castShadow = true;
    }
    scene.add(turret);

    const target = new Mesh(
      new TorusGeometry(0.42, 0.06, 16, 48),
      standard(palette.coral, { emissive: 0.8 })
    );
    scene.add(target);

    const startHandle = handle(palette.cyan);
    const endHandle = handle(palette.coral);
    const tangentStart = handle(palette.cyan, 0.08);
    const tangentEnd = handle(palette.coral, 0.08);
    const arrowStart = arrow(palette.cyan, { radius: 0.02 });
    const arrowEnd = arrow(palette.coral, { radius: 0.02 });
    scene.add(
      startHandle,
      endHandle,
      tangentStart,
      tangentEnd,
      arrowStart,
      arrowEnd
    );
    const labels = {
      p0: context.label("P₀", { color: palette.cyan }),
      p1: context.label("P₁", { color: palette.coral }),
      t0: context.label("T₀", { color: palette.cyan, tone: "muted" }),
      t1: context.label("T₁", { color: palette.coral, tone: "muted" }),
    };
    scene.add(labels.p0, labels.p1, labels.t0, labels.t1);

    const t0 = new Vector3();
    const t1 = new Vector3();
    const tangentScale = () => Number(params["scale"]);
    const clampHeight = (position: Vector3) => {
      position.y = HEIGHT;
      position.x = Math.max(-5, Math.min(5, position.x));
      position.z = Math.max(-3.5, Math.min(3.5, position.z));
    };
    const syncHandles = () => {
      startHandle.position.copy(p0);
      endHandle.position.copy(p1);
      t0.copy(t0Base).multiplyScalar(tangentScale());
      t1.copy(t1Base).multiplyScalar(tangentScale());
      tangentStart.position.copy(p0).addScaledVector(t0Base, 0.5);
      tangentEnd.position.copy(p1).addScaledVector(t1Base, 0.5);
    };
    syncHandles();
    context.draggable(startHandle, {
      clamp: clampHeight,
      onDrag: (position) => p0.copy(position),
    });
    context.draggable(endHandle, {
      clamp: clampHeight,
      onDrag: (position) => p1.copy(position),
    });
    context.draggable(tangentStart, {
      clamp: clampHeight,
      onDrag: (position) => t0Base.copy(position).sub(p0).multiplyScalar(2),
    });
    context.draggable(tangentEnd, {
      clamp: clampHeight,
      onDrag: (position) => t1Base.copy(position).sub(p1).multiplyScalar(2),
    });

    const path = polyline([], palette.amber, {
      width: 1.5,
      dashed: true,
      dashSize: 0.12,
      gapSize: 0.08,
      opacity: 0.6,
    });
    scene.add(path);
    const bolt = marker("#fff1c4", 0.1);
    bolt.material.emissiveIntensity = 3;
    const beam = trail(26, palette.amber, { width: 5 });
    scene.add(bolt, beam);

    const graph = hudGraph(context, {
      title: "基底関数（t に対する重み）",
      min: -0.2,
      max: 1,
      xLabel: "t",
    });
    graph.setSeries([
      { fn: h00, color: palette.cyan, label: "h₀₀ (P₀)" },
      { fn: h10, color: "#8fe9df", label: "h₁₀ (T₀)", dashed: true },
      { fn: h01, color: palette.coral, label: "h₀₁ (P₁)" },
      { fn: h11, color: "#ffb3ad", label: "h₁₁ (T₁)", dashed: true },
    ]);

    const point = new Vector3();
    const ahead = new Vector3();
    let clock = 0;
    let lastT = 0;

    return {
      update({ dt }) {
        syncHandles();
        const period = Number(params["speed"]);
        clock += dt;
        const t = (clock % period) / period;
        if (t < lastT) {
          beam.reset();
        }
        lastT = t;

        const points: Vector3[] = [];
        for (let sample = 0; sample <= SAMPLES; sample++) {
          points.push(hermite(p0, t0, p1, t1, sample / SAMPLES, new Vector3()));
        }
        path.setPoints(points);
        hermite(p0, t0, p1, t1, t, point);
        bolt.position.copy(point);
        beam.push(point);

        turret.position.set(p0.x, 0, p0.z);
        head.rotation.y = Math.atan2(-t0.z, t0.x);
        hermite(p0, t0, p1, t1, 0.999, ahead);
        target.position.copy(p1);
        target.lookAt(ahead.clone().add(t1));

        const showTangents = params["tangents"] === true;
        arrowStart.visible = showTangents;
        arrowEnd.visible = showTangents;
        tangentStart.visible = showTangents;
        tangentEnd.visible = showTangents;
        labels.t0.visible = showTangents;
        labels.t1.visible = showTangents;
        graph.setVisible(showTangents);
        arrowStart.set(p0, t0Base.clone().multiplyScalar(0.5));
        arrowEnd.set(p1, t1Base.clone().multiplyScalar(0.5));
        labels.p0.position.copy(p0).add(new Vector3(0, 0.45, 0));
        labels.p1.position.copy(p1).add(new Vector3(0, 0.6, 0));
        labels.t0.position
          .copy(tangentStart.position)
          .add(new Vector3(0, 0.3, 0));
        labels.t1.position
          .copy(tangentEnd.position)
          .add(new Vector3(0, 0.3, 0));
        graph.setMarker(t);

        context.readout("t", t.toFixed(2));
        context.readout("|T₀|", t0.length().toFixed(2));
        context.readout("|T₁|", t1.length().toFixed(2));
        context.caption(
          "位置は P₀→P₁、向きは T₀ で出て T₁ で入る。4 つの基底関数の重みで、この 4 つの量を混ぜ合わせている。"
        );
      },
    };
  },
};
