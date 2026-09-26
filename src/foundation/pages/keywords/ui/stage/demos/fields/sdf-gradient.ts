import { Vector3 } from "three";
import { arrowheadGeometry, crowd } from "../../agents";
import { glslSimplex } from "../../glsl";
import { palette, segments } from "../../kit";
import { distanceSection, glslSdf, raymarchWorld } from "../../raymarch";
import { gradient, sdBox, sdSphere, smin } from "../../sdf";
import type { DemoModule } from "../../types";

const methods = { central: 0, tetra: 1, forward: 2 } as const;
type Method = keyof typeof methods;
const isMethod = (value: unknown): value is Method =>
  typeof value === "string" && Object.hasOwn(methods, value);

const samples: Record<Method, number> = { central: 6, tetra: 4, forward: 4 };

const GRID_X = 13;
const GRID_Y = 8;

/** 断面の矢印用に CPU で評価する基本形（細部のノイズは含まない）。 */
const baseField = (x: number, y: number, z: number) =>
  smin(
    sdSphere(x + 0.45, y - 1.05, z, 0.72),
    sdBox(x - 0.6, y - 0.75, z, 0.42, 0.42, 0.42) - 0.08,
    0.5
  );

const baseGlsl = /* glsl */ `
  ${glslSdf}
  ${glslSimplex}
  float baseShape(vec3 p) {
    return smin(sdSphere(p - vec3(-0.45, 1.05, 0.0), 0.72), sdRoundBox(p - vec3(0.6, 0.75, 0.0), vec3(0.5), 0.08), 0.5);
  }
`;

export const demo: DemoModule = {
  alt: "距離場の値の変化（勾配）から表面の向き（法線）を求めるデモ。表面に細かなノイズの凹凸を足した岩のような形を、中心差分・四面体・前進差分の 3 つの方法と、差分を取る幅 ε を変えて陰影付けする。断面には各点の勾配を矢印で描いており、どの矢印も最寄りの表面から真っすぐ遠ざかる向きを指す。",
  camera: { position: [0.8, 2, 5.4], target: [0.1, 1, 0] },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "method",
      label: "差分の取り方",
      value: "tetra",
      options: [
        { value: "central", label: "中心差分（6 回）" },
        { value: "tetra", label: "四面体（4 回）" },
        { value: "forward", label: "前進差分（4 回）" },
      ],
    },
    {
      type: "range",
      key: "epsilon",
      label: "差分の幅 ε（対数）",
      min: -4,
      max: -0.7,
      step: 0.05,
      value: -2.6,
      format: (value) => (10 ** value).toFixed(4),
      hint: "小さすぎると数値誤差でざらつき、大きすぎると細かい凹凸がならされて消えます。",
    },
    {
      type: "select",
      key: "view",
      label: "表示",
      value: "shade",
      options: [
        { value: "shade", label: "陰影" },
        { value: "normal", label: "法線を色で" },
      ],
    },
    { type: "toggle", key: "section", label: "断面と勾配の矢印", value: false },
    {
      type: "range",
      key: "detail",
      label: "表面の細かい凹凸",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.6,
    },
  ],
  legend: [{ color: palette.lime, label: "勾配（距離が増える向き）" }],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uEps: { value: 0.0025 },
      uMethod: { value: 1 },
      uView: { value: 0 },
      uCut: { value: 0 },
      uDetail: { value: 0.6 },
    };
    raymarchWorld(context, {
      uniforms,
      customNormal: true,
      emission: true,
      stepScale: 0.8,
      steps: 180,
      functions: /* glsl */ `
        ${baseGlsl}
        float shape(vec3 p) {
          float d = baseShape(p);
          d += uDetail * 0.035 * fbm3(p * 6.0, 5);
          return d;
        }
        float map(vec3 p) {
          float d = shape(p);
          return uCut > 0.5 ? max(d, p.z + 0.006) : d;
        }
        vec3 customNormal(vec3 p) {
          float e = uEps;
          if (uMethod < 0.5) {
            return normalize(vec3(
              map(p + vec3(e, 0, 0)) - map(p - vec3(e, 0, 0)),
              map(p + vec3(0, e, 0)) - map(p - vec3(0, e, 0)),
              map(p + vec3(0, 0, e)) - map(p - vec3(0, 0, e))));
          }
          if (uMethod < 1.5) {
            const vec2 k = vec2(1.0, -1.0);
            return normalize(
              k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) +
              k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
          }
          float c = map(p);
          return normalize(vec3(map(p + vec3(e, 0, 0)) - c, map(p + vec3(0, e, 0)) - c, map(p + vec3(0, 0, e)) - c));
        }
        vec4 surface(vec3 p, vec3 n) {
          if (uView > 0.5) return vec4(0.0, 0.0, 0.0, 1.0);
          if (uCut > 0.5 && p.z > -0.01) return vec4(0.16, 0.2, 0.26, 0.8);
          return vec4(0.7, 0.66, 0.6, 0.6);
        }
        vec3 emission(vec3 p, vec3 n) {
          if (uView < 0.5) return vec3(0.0);
          return n * 0.5 + 0.5;
        }
      `,
    });

    const section = distanceSection({
      width: 4.4,
      height: 2.6,
      spacing: 0.15,
      uniforms: { uDetail: uniforms.uDetail },
      functions: /* glsl */ `
        ${baseGlsl}
        float sectionDistance(vec3 p) { return baseShape(vec3(p.xy, 0.0)) + uDetail * 0.035 * fbm3(vec3(p.xy, 0.0) * 6.0, 5); }
      `,
    });
    section.position.set(0.1, 1.2, 0.004);
    scene.add(section);

    const count = GRID_X * GRID_Y;
    const heads = crowd(count, "#ffffff", {
      geometry: arrowheadGeometry(0.09, 0.05),
      emissive: 0.1,
    });
    const shafts = segments([], palette.lime, { width: 1.6 });
    scene.add(heads, shafts);
    const point = new Vector3();
    const direction = new Vector3();
    const tip = new Vector3();
    const shaftPoints: Vector3[] = [];
    for (let j = 0; j < GRID_Y; j++) {
      for (let i = 0; i < GRID_X; i++) {
        const index = j * GRID_X + i;
        point.set(
          -2 + (i / (GRID_X - 1)) * 4.2,
          0.1 + (j / (GRID_Y - 1)) * 2.2,
          0.02
        );
        gradient(baseField, point, direction);
        direction.z = 0;
        direction.normalize();
        const inside = baseField(point.x, point.y, 0) < 0;
        tip.copy(point).addScaledVector(direction, 0.16);
        shaftPoints.push(point.clone(), tip.clone());
        heads.set(index, tip, direction, inside ? 0.8 : 1);
        heads.paint(index, inside ? palette.sky : palette.lime);
      }
    }
    heads.commit();
    shafts.setPoints(shaftPoints);

    return {
      update() {
        const method: Method = isMethod(params["method"])
          ? params["method"]
          : "tetra";
        const epsilon = 10 ** Number(params["epsilon"]);
        uniforms.uMethod.value = methods[method];
        uniforms.uEps.value = epsilon;
        uniforms.uView.value = params["view"] === "normal" ? 1 : 0;
        uniforms.uDetail.value = Number(params["detail"]);
        const showSection = params["section"] === true;
        uniforms.uCut.value = showSection ? 1 : 0;
        section.visible = showSection;
        heads.visible = showSection;
        shafts.visible = showSection;
        context.readout("1 画素あたりの距離評価", `${samples[method]} 回`);
        context.readout("ε", `${epsilon.toFixed(4)} m`);
        context.caption(
          epsilon > 0.05
            ? "ε が大きいと、広い範囲の平均的な傾きになり、細かい凹凸の陰影が消えてのっぺりする。"
            : epsilon < 0.0003
              ? "ε が小さすぎると、差が浮動小数点の誤差に埋もれて法線がばらつき、表面がざらつく。"
              : "距離が最も速く増える向き（勾配）が表面の外向き法線。近くの点で距離を測り、その差から勾配を求める。"
        );
      },
    };
  },
};
