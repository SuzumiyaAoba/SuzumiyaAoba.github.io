import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { marker, palette, segments } from "../../kit";
import type { DemoModule } from "../../types";

const LENGTH = 3.2;
const RADIUS = 0.34;
const RINGS = 90;
const SIDES = 48;
const ROWS = [
  { key: "lbs", name: "線形ブレンド（LBS）", y: 2.75 },
  { key: "dqs", name: "デュアルクォータニオン（DQS）", y: 0.95 },
] as const;

/** デュアルクォータニオン（回転 real と、平行移動を表す dual の組）。 */
type Dual = { real: Quaternion; dual: Quaternion };

/** 回転 q のあとに平行移動 t をする変換。dual = ½ t q。 */
function toDual(q: Quaternion, t: Vector3): Dual {
  const dual = new Quaternion(t.x, t.y, t.z, 0).multiply(q);
  return {
    real: q.clone(),
    dual: new Quaternion(
      dual.x * 0.5,
      dual.y * 0.5,
      dual.z * 0.5,
      dual.w * 0.5
    ),
  };
}

export const demo: DemoModule = {
  alt: "関節で骨が回ったときに、周りの皮膚（頂点）をどう動かすかを比べるデモ。上は線形ブレンドスキニング（LBS）で、2 本の骨の変換を行列のまま重みで平均する。関節を大きくねじると、ねじれの真ん中で腕が細くつぶれる（キャンディの包み紙のようになる）。下はデュアルクォータニオンスキニング（DQS）で、回転と平行移動をまとめたデュアルクォータニオンを平均するので、ねじっても曲げても太さが保たれる。縞模様はねじれの様子を見やすくするため。",
  camera: { position: [0.6, 2.2, 7.4], target: [0, 1.8, 0], fov: 42 },
  controls: [
    {
      type: "range",
      key: "twist",
      label: "ねじり（度）",
      min: 0,
      max: 180,
      step: 1,
      value: 150,
    },
    {
      type: "range",
      key: "bend",
      label: "曲げ（度）",
      min: 0,
      max: 150,
      step: 1,
      value: 40,
    },
    {
      type: "range",
      key: "blend",
      label: "重みを混ぜる幅",
      min: 0.1,
      max: 1.6,
      step: 0.05,
      value: 0.9,
    },
    { type: "toggle", key: "auto", label: "自動で動かす", value: true },
  ],
  legend: [
    { color: palette.amber, label: "骨と関節" },
    { color: palette.coral, label: "上の骨の重み" },
    { color: palette.sky, label: "下の骨の重み" },
  ],
  setup(context) {
    const { scene, params } = context;
    // 腕：x 方向の円柱。関節は x = 0
    const rest: Vector3[] = [];
    const along: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const upper = new Color(palette.coral);
    const lower = new Color(palette.sky);
    const color = new Color();
    for (let ring = 0; ring <= RINGS; ring++) {
      const x = (ring / RINGS - 0.5) * LENGTH;
      for (let side = 0; side <= SIDES; side++) {
        const angle = (side / SIDES) * Math.PI * 2;
        rest.push(
          new Vector3(x, Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS)
        );
        along.push(x);
        // ねじれが見えるよう、角度方向に縞を入れる
        const stripe = Math.floor((side / SIDES) * 8) % 2 === 0 ? 1 : 0.55;
        color.copy(x < 0 ? upper : lower).multiplyScalar(stripe);
        colors.push(color.r, color.g, color.b);
      }
    }
    for (let ring = 0; ring < RINGS; ring++) {
      for (let side = 0; side < SIDES; side++) {
        const a = ring * (SIDES + 1) + side;
        const b = a + 1;
        const c = a + SIDES + 1;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    const rows = ROWS.map((row) => {
      const geometry = new BufferGeometry();
      geometry.setAttribute(
        "position",
        new BufferAttribute(new Float32Array(rest.length * 3), 3)
      );
      geometry.setAttribute(
        "color",
        new BufferAttribute(new Float32Array(colors), 3)
      );
      geometry.setIndex(indices);
      const mesh = new Mesh(
        geometry,
        new MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })
      );
      mesh.position.y = row.y;
      mesh.castShadow = true;
      scene.add(mesh);
      const bones = segments([], palette.amber, { width: 3 });
      bones.position.y = row.y;
      bones.position.z = 0.6;
      scene.add(bones);
      const joint = marker(palette.amber, 0.08);
      joint.position.set(0, row.y, 0.6);
      scene.add(joint);
      const label = context.label(row.name, { tone: "strong" });
      label.position.set(-LENGTH / 2 - 0.2, row.y + 0.75, 0);
      scene.add(label);
      return { ...row, geometry, bones };
    });

    const rotation = new Quaternion();
    const twist = new Quaternion();
    const bend = new Quaternion();
    const point = new Vector3();
    const jointPosition = new Vector3(0, 0, 0);
    let clock = 0;
    return {
      update({ dt }) {
        clock += dt;
        let twistAngle = (Number(params["twist"]) * Math.PI) / 180;
        let bendAngle = (Number(params["bend"]) * Math.PI) / 180;
        if (params["auto"] === true) {
          twistAngle = (0.5 - 0.5 * Math.cos(clock * 0.8)) * Math.PI * 0.95;
          bendAngle = (0.5 - 0.5 * Math.cos(clock * 0.53 + 1)) * 2.2;
        }
        // 下の骨：関節の周りに、まず自分の軸（x）でねじり、次に z 軸で曲げる
        twist.setFromAxisAngle(new Vector3(1, 0, 0), twistAngle);
        bend.setFromAxisAngle(new Vector3(0, 0, 1), bendAngle);
        rotation.copy(bend).multiply(twist);
        // 関節 J の周りの回転 = 回転 R と平行移動 J − R J
        const translation = jointPosition
          .clone()
          .sub(jointPosition.clone().applyQuaternion(rotation));
        const identity = toDual(new Quaternion(), new Vector3());
        const moved = toDual(rotation, translation);
        const width = Number(params["blend"]);
        const minimum: Record<string, number> = { lbs: RADIUS, dqs: RADIUS };
        for (const row of rows) {
          const positions = row.geometry.getAttribute("position");
          const { array } = positions;
          let smallest = Number.POSITIVE_INFINITY;
          for (const [index, p] of rest.entries()) {
            const x = along[index] ?? 0;
            // 下の骨の重み：関節の前後 width の範囲でなめらかに 0 → 1
            const t = Math.min(1, Math.max(0, (x + width / 2) / width));
            const w = t * t * (3 - 2 * t);
            if (row.key === "lbs") {
              // 2 つの変換をそれぞれ当てた位置を、重みで平均する（行列の線形ブレンドと同じ）
              point
                .copy(p)
                .applyQuaternion(rotation)
                .add(translation)
                .multiplyScalar(w)
                .addScaledVector(p, 1 - w);
            } else {
              // デュアルクォータニオンを重みで足して正規化し、1 つの剛体変換として当てる
              const sign = identity.real.dot(moved.real) < 0 ? -1 : 1;
              const real = new Quaternion(
                identity.real.x * (1 - w) + moved.real.x * w * sign,
                identity.real.y * (1 - w) + moved.real.y * w * sign,
                identity.real.z * (1 - w) + moved.real.z * w * sign,
                identity.real.w * (1 - w) + moved.real.w * w * sign
              );
              const dual = new Quaternion(
                identity.dual.x * (1 - w) + moved.dual.x * w * sign,
                identity.dual.y * (1 - w) + moved.dual.y * w * sign,
                identity.dual.z * (1 - w) + moved.dual.z * w * sign,
                identity.dual.w * (1 - w) + moved.dual.w * w * sign
              );
              const norm = real.length();
              real.set(
                real.x / norm,
                real.y / norm,
                real.z / norm,
                real.w / norm
              );
              dual.set(
                dual.x / norm,
                dual.y / norm,
                dual.z / norm,
                dual.w / norm
              );
              // 平行移動 t = 2 · dual · conj(real)
              const t2 = dual.clone().multiply(real.clone().conjugate());
              point
                .copy(p)
                .applyQuaternion(real)
                .add(new Vector3(t2.x * 2, t2.y * 2, t2.z * 2));
            }
            array[index * 3] = point.x;
            array[index * 3 + 1] = point.y;
            array[index * 3 + 2] = point.z;
            if (Math.abs(x) < 0.05) {
              // 関節の断面の太さ：断面の中心からの距離
              const center =
                x < 0
                  ? new Vector3(x, 0, 0)
                  : new Vector3(x, 0, 0)
                      .applyQuaternion(rotation)
                      .add(translation);
              smallest = Math.min(
                smallest,
                point.distanceTo(center.lerp(new Vector3(x, 0, 0), 0.5))
              );
            }
          }
          positions.needsUpdate = true;
          row.geometry.computeVertexNormals();
          minimum[row.key] = smallest;
          // 骨の線
          const end = new Vector3(LENGTH / 2, 0, 0)
            .applyQuaternion(rotation)
            .add(translation);
          row.bones.setPoints([
            new Vector3(-LENGTH / 2, 0, 0),
            new Vector3(0, 0, 0),
            new Vector3(0, 0, 0),
            end,
          ]);
        }
        context.readout(
          "ねじり / 曲げ",
          `${Math.round((twistAngle * 180) / Math.PI)}° / ${Math.round((bendAngle * 180) / Math.PI)}°`
        );
        context.readout(
          "関節の細さ（LBS）",
          `${Math.round(((minimum["lbs"] ?? RADIUS) / RADIUS) * 100)}%`
        );
        context.readout(
          "関節の細さ（DQS）",
          `${Math.round(((minimum["dqs"] ?? RADIUS) / RADIUS) * 100)}%`
        );
        context.caption(
          "LBS は、上の骨で動かした位置と下の骨で動かした位置を重みで平均する。ねじりが 180° に近づくと、2 つの位置が円柱の反対側になり、平均が中心へ寄ってつぶれる。DQS は回転そのものを平均してから当てるので、関節の途中の断面も同じ半径のまま回るだけになる。"
        );
      },
    };
  },
};
