import {
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { marker, palette, polyline, segments, standard, TAU } from "../../kit";
import { glslSdf, raymarchWorld } from "../../raymarch";
import { sdBox, sdSphere } from "../../sdf";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

const EYE = new Vector3(-2.7, 1.5, 0);
const MAX_STEPS = 48;
const RING_SEGMENTS = 48;

/** 断面（z = 0）上で評価する距離場。床（y = 0）も含む。 */
function sceneDistance(x: number, y: number, z: number) {
  const box = sdBox(x + 0.3, y - 0.5, z, 0.42, 0.42, 0.42) - 0.08;
  const sphere = sdSphere(x - 1.35, y - 1.15, z, 0.55);
  const pillar = sdBox(x - 2.4, y - 0.9, z, 0.18, 0.9, 0.18) - 0.04;
  return Math.min(box, sphere, pillar, y);
}

const sceneGlsl = /* glsl */ `
  ${glslSdf}
  float shapes(vec3 p) {
    float box = sdRoundBox(p - vec3(-0.3, 0.5, 0.0), vec3(0.5), 0.08);
    float sphere = sdSphere(p - vec3(1.35, 1.15, 0.0), 0.55);
    float pillar = sdRoundBox(p - vec3(2.4, 0.9, 0.0), vec3(0.22, 0.94, 0.22), 0.04);
    return min(box, min(sphere, pillar));
  }
`;

type Step = { point: Vector3; radius: number };

export const demo: DemoModule = {
  alt: "距離場の中で視線を進めるスフィアトレーシングのデモ。視点から伸びる 1 本の光線について、各地点の距離を半径とする円（その内側には何もないと保証された範囲）を描き、その半径だけ前進することを繰り返す。表面に近づくほど歩幅が小さくなり、距離がほぼ 0 になったら表面に当たったと判断する。",
  camera: { position: [0.6, 1.8, 7.4], target: [0.3, 0.9, 0] },
  studio: { floor: false },
  bloom: { strength: 0.5, radius: 0.3, threshold: 0.85 },
  controls: [
    {
      type: "range",
      key: "scale",
      label: "歩幅の倍率",
      min: 0.5,
      max: 1.6,
      step: 0.05,
      value: 1,
      hint: "1 を超えると、表面を踏み越えて内側に入ってしまうことがあります。",
    },
    {
      type: "range",
      key: "epsilon",
      label: "当たりとみなす距離 ε",
      min: 0.005,
      max: 0.2,
      step: 0.005,
      value: 0.02,
    },
    { type: "toggle", key: "auto", label: "1 歩ずつ再生", value: true },
    {
      type: "toggle",
      key: "heat",
      label: "画面全体の反復回数を色で表示",
      value: false,
      hint: "物体の縁や、床を浅い角度で見る遠方ほど反復が増えます。",
    },
  ],
  legend: [
    { color: palette.cyan, label: "安全に進める円（半径 = 距離）" },
    { color: palette.amber, label: "光線" },
    { color: palette.coral, label: "当たった点" },
  ],
  hint: "黄色の目標点をドラッグして、光線の向きを変えてください。",
  setup(context) {
    const { scene, params } = context;
    const world = raymarchWorld(context, {
      stepView: true,
      functions: /* glsl */ `
        ${sceneGlsl}
        float map(vec3 p) { return max(shapes(p), p.z + 0.006); }
        vec4 surface(vec3 p, vec3 n) {
          if (p.z > -0.01) return vec4(0.16, 0.2, 0.26, 0.8);
          return vec4(0.72, 0.76, 0.84, 0.45);
        }
      `,
    });

    const sectionUniforms = { uTime: { value: 0 } };
    const section = new Mesh(
      new PlaneGeometry(7.6, 3.4),
      new ShaderMaterial({
        uniforms: sectionUniforms,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vWorld;
          ${sceneGlsl}
          void main() {
            vec3 p = vec3(vWorld.xy, 0.0);
            float d = min(shapes(p), p.y);
            float bands = 0.5 + 0.5 * cos(6.2831853 * d / 0.25);
            vec3 color = d > 0.0 ? vec3(0.95, 0.62, 0.28) : vec3(0.45, 0.72, 1.0);
            float w = fwidth(d);
            float line = 1.0 - smoothstep(0.0, 1.5 * w, abs(d));
            float alpha = d > 0.0 ? 0.12 + 0.12 * bands : 0.85;
            alpha = max(alpha, line);
            vec2 edge = abs(vWorld.xy - vec2(0.2, 1.6)) - vec2(3.7, 1.6);
            alpha *= 1.0 - smoothstep(-0.5, 0.0, max(edge.x, edge.y));
            gl_FragColor = vec4(pow(mix(color * (d > 0.0 ? 0.7 : 0.6), vec3(1.0), line), vec3(2.2)), alpha);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    section.position.set(0.2, 1.6, 0.004);
    scene.add(section);

    const eye = new Mesh(
      new SphereGeometry(0.13, 32, 24),
      standard(palette.ink, { emissive: 0.3, roughness: 0.3 })
    );
    eye.position.copy(EYE);
    scene.add(eye);
    const eyeLabel = context.label("視点", { tone: "muted" });
    eyeLabel.position.copy(EYE).add(new Vector3(0, 0.3, 0));
    scene.add(eyeLabel);

    const aim = handle(palette.amber, 0.09);
    aim.position.set(1, 1.02, 0);
    scene.add(aim);
    context.draggable(aim, {
      normal: [0, 0, 1],
      clamp: (position) =>
        position.set(
          Math.max(EYE.x + 0.8, Math.min(3.6, position.x)),
          Math.max(0.05, Math.min(3, position.y)),
          0
        ),
    });

    const ray = polyline([], palette.amber, { width: 2.5 });
    const guide = polyline([], palette.amber, {
      width: 1.5,
      dashed: true,
      opacity: 0.5,
    });
    const rings = segments([], palette.cyan, { width: 1.8 });
    const dots = new InstancedMesh(
      new SphereGeometry(0.035, 12, 8),
      standard(palette.cyan, { emissive: 0.9 }),
      MAX_STEPS
    );
    dots.count = 0;
    const hit = marker(palette.coral, 0.07);
    scene.add(ray, guide, rings, dots, hit);

    const direction = new Vector3();
    const matrix = new Matrix4();
    let steps: Step[] = [];
    let hitPoint: Vector3 | null = null;
    let reveal = 0;
    let signature = "";

    const trace = () => {
      direction.subVectors(aim.position, EYE).normalize();
      const scale = Number(params["scale"]);
      const epsilon = Number(params["epsilon"]);
      steps = [];
      hitPoint = null;
      let t = 0;
      for (let index = 0; index < MAX_STEPS; index++) {
        const point = EYE.clone().addScaledVector(direction, t);
        const distance = sceneDistance(point.x, point.y, point.z);
        steps.push({ point, radius: distance });
        if (Math.abs(distance) < epsilon || distance < 0) {
          hitPoint = point;
          break;
        }
        t += distance * scale;
        if (t > 12) {
          break;
        }
      }
    };

    const draw = (visible: number) => {
      const ringPoints: Vector3[] = [];
      const shown = steps.slice(0, visible);
      for (const [index, step] of shown.entries()) {
        const radius = Math.abs(step.radius);
        for (let k = 0; k < RING_SEGMENTS; k++) {
          const a0 = (k / RING_SEGMENTS) * TAU;
          const a1 = ((k + 1) / RING_SEGMENTS) * TAU;
          ringPoints.push(
            new Vector3(
              step.point.x + Math.cos(a0) * radius,
              step.point.y + Math.sin(a0) * radius,
              0.01
            ),
            new Vector3(
              step.point.x + Math.cos(a1) * radius,
              step.point.y + Math.sin(a1) * radius,
              0.01
            )
          );
        }
        matrix.makeTranslation(step.point.x, step.point.y, 0.01);
        dots.setMatrixAt(index, matrix);
      }
      rings.setPoints(ringPoints);
      dots.count = shown.length;
      dots.instanceMatrix.needsUpdate = true;
      const last = shown.at(-1);
      ray.setPoints(last ? [EYE, last.point] : [EYE, EYE]);
      guide.setPoints([EYE, EYE.clone().addScaledVector(direction, 12)]);
      const finished = visible >= steps.length;
      hit.visible = finished && hitPoint !== null;
      if (hitPoint) {
        hit.position.copy(hitPoint);
      }
    };

    return {
      update({ dt }) {
        const heat = params["heat"] === true;
        const stepView = world.uniforms["uStepView"];
        if (stepView) {
          stepView.value = heat ? 1 : 0;
        }
        section.visible = !heat;
        const key = [
          aim.position.x.toFixed(3),
          aim.position.y.toFixed(3),
          params["scale"],
          params["epsilon"],
        ].join(",");
        if (key !== signature) {
          signature = key;
          trace();
          reveal = params["auto"] === true ? 0 : steps.length;
        }
        if (params["auto"] === true) {
          reveal += dt / 0.45;
          if (reveal > steps.length + 4) {
            reveal = 0;
          }
        } else {
          reveal = steps.length;
        }
        const visible = Math.min(steps.length, Math.floor(reveal) + 1);
        draw(visible);
        const current = steps[visible - 1];
        context.readout("反復", `${visible} / ${steps.length} 回`);
        context.readout(
          "現在の距離",
          current ? `${current.radius.toFixed(3)} m` : "―"
        );
        context.readout(
          "結果",
          hitPoint
            ? (steps.at(-1)?.radius ?? 0) < 0
              ? "表面を踏み越えた"
              : "表面に到達"
            : "何にも当たらない"
        );
        context.caption(
          heat
            ? "明るいほど反復回数が多い。物体の縁をかすめる光線や、床を浅い角度で見る遠方では、距離が小さいまま進まず反復が増える。"
            : "各地点の距離は「その半径の円の中には何もない」ことを保証する。だから距離の分だけ前進しても何にもぶつからない。表面に近づくほど歩幅は縮む。"
        );
      },
    };
  },
};
