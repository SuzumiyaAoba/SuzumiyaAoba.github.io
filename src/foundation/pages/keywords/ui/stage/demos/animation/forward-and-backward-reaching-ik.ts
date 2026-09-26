import {
  CylinderGeometry,
  Mesh,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, polyline, standard } from "../../kit";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

const MAX_SEGMENTS = 20;
const TOTAL_LENGTH = 2.6;
const up = new Vector3(0, 1, 0);

type Chain = {
  base: Vector3;
  points: Vector3[];
  segments: Mesh[];
  joints: Mesh[];
  backward: ReturnType<typeof polyline>;
};

/**
 * FABRIK：先端を目標に置いて根元へ向かって長さを直し（後ろ向き）、
 * 根元を元の位置に戻して先端へ向かって長さを直す（前向き）、をくり返す。
 */
function fabrik(
  points: Vector3[],
  base: Vector3,
  target: Vector3,
  length: number,
  iterations: number,
  record?: Vector3[]
) {
  const n = points.length - 1;
  if (base.distanceTo(target) >= length * n) {
    // 届かない：目標の方へまっすぐ伸ばす
    const direction = target.clone().sub(base).normalize();
    for (let i = 0; i <= n; i++) {
      points[i]?.copy(base).addScaledVector(direction, length * i);
    }
    return 0;
  }
  let used = 0;
  for (let iteration = 0; iteration < iterations; iteration++) {
    used++;
    // 後ろ向き：先端を目標に置き、各関節を「次の関節から長さ length の位置」へ引き寄せる
    points[n]?.copy(target);
    for (let i = n - 1; i >= 0; i--) {
      const next = points[i + 1];
      const current = points[i];
      if (next && current) {
        current.sub(next).normalize().multiplyScalar(length).add(next);
      }
    }
    if (iteration === 0 && record) {
      record.push(...points.map((p) => p.clone()));
    }
    // 前向き：根元を元の位置に戻し、先端に向かって同じことをする
    points[0]?.copy(base);
    for (let i = 1; i <= n; i++) {
      const previous = points[i - 1];
      const current = points[i];
      if (previous && current) {
        current.sub(previous).normalize().multiplyScalar(length).add(previous);
      }
    }
    if ((points[n]?.distanceTo(target) ?? 0) < 1e-3) {
      break;
    }
  }
  return used;
}

export const demo: DemoModule = {
  alt: "関節が何個もつながった触手を、FABRIK で目標へ伸ばすデモ。先端を目標の位置に置いてから、根元に向かって各関節を「隣の関節から骨の長さだけ離れた位置」へ順に引き寄せ、次に根元を元の場所へ戻して、先端へ向かって同じことをする。この往復を数回くり返すだけで、角度の計算をせずに、なめらかに曲がった姿勢が求まる。",
  camera: { position: [0, 2.2, 6], target: [0, 1.3, 0] },
  controls: [
    {
      type: "range",
      key: "segments",
      label: "関節の数",
      min: 2,
      max: MAX_SEGMENTS,
      step: 1,
      value: 10,
    },
    {
      type: "range",
      key: "iterations",
      label: "往復の回数",
      min: 1,
      max: 20,
      step: 1,
      value: 10,
    },
    { type: "toggle", key: "auto", label: "目標を自動で動かす", value: true },
    {
      type: "toggle",
      key: "pass",
      label: "1 回目の後ろ向きの結果を表示",
      value: false,
    },
  ],
  legend: [
    { color: palette.amber, label: "目標（ドラッグ）" },
    { color: palette.lime, label: "触手" },
    { color: palette.coral, label: "後ろ向きの処理の直後（根元が浮いている）" },
  ],
  hint: "黄色の球をドラッグすると、触手が追いかけます。",
  setup(context) {
    const { scene, params } = context;
    const target = handle(palette.amber, 0.09);
    target.position.set(1.2, 2, 0.3);
    scene.add(target);
    let dragging = false;
    context.draggable(target, {
      normal: [0, 0, 1],
      origin: [0, 0, 0.3],
      onDrag: () => {
        dragging = true;
      },
    });
    const segmentMaterial = standard("#8fcf6b", { roughness: 0.45 });
    const jointMaterial = standard("#3f6b3a", { roughness: 0.5 });
    const chains: Chain[] = [-1.4, 0, 1.4].map((x) => {
      const base = new Vector3(x, 0, 0);
      const points = Array.from(
        { length: MAX_SEGMENTS + 1 },
        (_, i) => new Vector3(x, (i * TOTAL_LENGTH) / MAX_SEGMENTS, 0)
      );
      const segments = Array.from({ length: MAX_SEGMENTS }, (_, i) => {
        const radius = 0.09 * (1 - (i / MAX_SEGMENTS) * 0.7);
        const mesh = new Mesh(
          new CylinderGeometry(radius * 0.8, radius, 1, 12),
          segmentMaterial
        );
        mesh.castShadow = true;
        scene.add(mesh);
        return mesh;
      });
      const joints = Array.from({ length: MAX_SEGMENTS + 1 }, (_, i) => {
        const mesh = new Mesh(
          new SphereGeometry(0.1 * (1 - (i / MAX_SEGMENTS) * 0.7), 12, 8),
          jointMaterial
        );
        mesh.castShadow = true;
        scene.add(mesh);
        return mesh;
      });
      const backward = polyline([], palette.coral, { width: 2, dashed: true });
      scene.add(backward);
      const pad = new Mesh(
        new CylinderGeometry(0.25, 0.3, 0.1, 24),
        standard("#4a5568")
      );
      pad.position.set(x, 0.05, 0);
      scene.add(pad);
      return { base, points, segments, joints, backward };
    });
    const quaternion = new Quaternion();
    const direction = new Vector3();
    let time = 0;
    let lastSegments = -1;

    return {
      update({ dt }) {
        time += dt;
        if (params["auto"] === true && !dragging) {
          target.position.set(
            Math.sin(time * 0.7) * 1.6,
            1.4 + Math.sin(time * 1.3) * 0.8,
            0.3 + Math.cos(time * 0.5) * 0.5
          );
        }
        dragging = false;
        const count = Number(params["segments"]);
        const iterations = Number(params["iterations"]);
        const length = TOTAL_LENGTH / count;
        let used = 0;
        for (const chain of chains) {
          const active = chain.points.slice(0, count + 1);
          if (count !== lastSegments) {
            for (const [i, p] of active.entries()) {
              p.set(chain.base.x, i * length, chain.base.z);
            }
          }
          const record: Vector3[] = [];
          used = fabrik(
            active,
            chain.base,
            target.position,
            length,
            iterations,
            record
          );
          for (const [i, mesh] of chain.segments.entries()) {
            const a = active[i];
            const b = active[i + 1];
            mesh.visible = i < count && a !== undefined && b !== undefined;
            if (a && b && mesh.visible) {
              direction.subVectors(b, a);
              mesh.position.copy(a).addScaledVector(direction, 0.5);
              quaternion.setFromUnitVectors(up, direction.clone().normalize());
              mesh.quaternion.copy(quaternion);
              mesh.scale.set(1, direction.length(), 1);
            }
          }
          for (const [i, mesh] of chain.joints.entries()) {
            const p = active[i];
            mesh.visible = i <= count && p !== undefined;
            if (p) {
              mesh.position.copy(p);
            }
          }
          chain.backward.visible = params["pass"] === true && record.length > 1;
          if (record.length > 1) {
            chain.backward.setPoints(record);
          }
        }
        lastSegments = count;
        context.readout("実際の往復回数", used === 0 ? "届かない" : `${used}`);
        context.caption(
          "①後ろ向き：先端を目標に置き、根元に向かって各関節を「一つ先の関節から骨の長さの位置」へ引き寄せる（根元は元の場所から浮く）。②前向き：根元を元の場所に戻し、先端に向かって同じように引き寄せる。これをくり返すと、根元も先端もそろう。"
        );
      },
    };
  },
};
