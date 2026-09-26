import {
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { marker, palette, polyline } from "../../kit";
import { glslSdf, raymarchWorld } from "../../raymarch";
import { gradient, sdBox, sdSphere, sdTorus } from "../../sdf";
import type { DemoModule } from "../../types";
import { handle } from "../../widgets";

const BOX_ANGLE = 0.6;
const cosBox = Math.cos(BOX_ANGLE);
const sinBox = Math.sin(BOX_ANGLE);

const sphereX = (time: number) => 0.85 + Math.sin(time * 0.7) * 0.35;

/** GLSL と同じ形を CPU でも評価する（探査点の距離表示用）。 */
function field(time: number) {
  return (x: number, y: number, z: number) => {
    const bx = x + 0.9;
    const by = y - 0.62;
    const rx = cosBox * bx - sinBox * z;
    const rz = sinBox * bx + cosBox * z;
    const box = sdBox(rx, by, rz, 0.44, 0.44, 0.44) - 0.12;
    const sphere = sdSphere(x - sphereX(time), y - 0.75, z - 0.2, 0.62);
    const torus = sdTorus(x - 0.1, y - 0.22, z - 1.35, 0.55, 0.18);
    return Math.min(box, sphere, torus);
  };
}

const sceneGlsl = /* glsl */ `
  ${glslSdf}
  float sceneShapes(vec3 p, out float id) {
    vec3 q = p - vec3(-0.9, 0.62, 0.0);
    q.xz = rot2(-${BOX_ANGLE.toFixed(2)}) * q.xz;
    float box = sdRoundBox(q, vec3(0.56), 0.12);
    float sphere = sdSphere(p - vec3(0.85 + sin(uTime * 0.7) * 0.35, 0.75, 0.2), 0.62);
    float torus = sdTorus(p - vec3(0.1, 0.22, 1.35), vec2(0.55, 0.18));
    float d = min(box, min(sphere, torus));
    id = d == box ? 0.0 : d == sphere ? 1.0 : 2.0;
    return d;
  }
`;

export const demo: DemoModule = {
  alt: "角の丸い箱・球・トーラスを符号付き距離場で表したデモ。水平な断面に、各点から最も近い表面までの距離を色の縞で描いている。外側はオレンジ、内側は青で、白い線が表面（距離 0）。探査点を動かすと、その点の距離を半径とする球が、どこかの表面にちょうど接する。",
  camera: { position: [3.6, 4.4, 5.6], target: [0, 0.5, 0.3] },
  studio: { floor: false },
  controls: [
    {
      type: "range",
      key: "height",
      label: "断面の高さ",
      min: 0.05,
      max: 1.4,
      step: 0.01,
      value: 0.55,
    },
    {
      type: "toggle",
      key: "cut",
      label: "断面より上を切り取る",
      value: true,
    },
    { type: "toggle", key: "bands", label: "等距離線を表示", value: true },
    { type: "toggle", key: "move", label: "球を動かす", value: true },
    { type: "toggle", key: "probe", label: "探査点を表示", value: true },
  ],
  legend: [
    { color: palette.amber, label: "外側（距離 > 0）" },
    { color: palette.sky, label: "内側（距離 < 0）" },
    { color: palette.lime, label: "探査点と最寄りの表面" },
  ],
  hint: "緑の探査点を断面の上でドラッグしてください。距離を半径とする球は、必ずどれかの形にちょうど接します。",
  setup(context) {
    const { scene, params } = context;
    const uniforms = { uTime: { value: 0 }, uCut: { value: 0.55 } };
    raymarchWorld(context, {
      uniforms,
      functions: /* glsl */ `
        ${sceneGlsl}
        float map(vec3 p) { float id; return max(sceneShapes(p, id), p.y - uCut); }
        vec4 surface(vec3 p, vec3 n) {
          float id;
          sceneShapes(p, id);
          if (p.y > uCut - 0.002) return vec4(0.2, 0.25, 0.32, 0.8);
          if (id < 0.5) return vec4(0.78, 0.8, 0.86, 0.5);
          if (id < 1.5) return vec4(0.95, 0.55, 0.35, 0.3);
          return vec4(0.45, 0.8, 0.75, 0.4);
        }
      `,
    });

    const sliceUniforms = {
      uTime: uniforms.uTime,
      uBands: { value: 1 },
      uProbe: { value: new Vector3() },
      uRadius: { value: 0 },
      uShowProbe: { value: 1 },
    };
    const slice = new Mesh(
      new PlaneGeometry(6, 5),
      new ShaderMaterial({
        uniforms: sliceUniforms,
        transparent: true,
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
          uniform float uTime;
          uniform float uBands;
          uniform vec3 uProbe;
          uniform float uRadius;
          uniform float uShowProbe;
          varying vec3 vWorld;
          ${sceneGlsl}
          void main() {
            float id;
            float d = sceneShapes(vWorld, id);
            vec3 color = d > 0.0 ? vec3(0.95, 0.62, 0.28) : vec3(0.45, 0.72, 1.0);
            color *= 0.35 + 0.65 * (1.0 - exp(-4.0 * abs(d)));
            color *= mix(1.0, 0.72 + 0.28 * cos(6.2831853 * d / 0.2), uBands);
            float w = fwidth(d);
            color = mix(color, vec3(1.0), 1.0 - smoothstep(0.0, 1.5 * w, abs(d)));
            float ring = abs(length(vWorld.xz - uProbe.xz) - uRadius);
            float rw = fwidth(ring);
            color = mix(color, vec3(0.65, 0.88, 0.32), (1.0 - smoothstep(rw, 2.5 * rw, ring)) * uShowProbe);
            vec2 edge = abs(vWorld.xz - vec2(0.0, 0.3)) - vec2(2.9, 2.4);
            float fade = 1.0 - smoothstep(-0.4, 0.1, max(edge.x, edge.y));
            gl_FragColor = vec4(pow(color, vec3(2.2)), 0.93 * fade);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    slice.rotation.x = -Math.PI / 2;
    slice.position.set(0, 0.55, 0.3);
    scene.add(slice);

    const probe = handle(palette.lime, 0.08);
    probe.position.set(-1.7, 0.55, 1.5);
    scene.add(probe);
    const nearest = marker(palette.lime, 0.05);
    const link = polyline([], palette.lime, { width: 2, dashed: true });
    const bubble = new Mesh(
      new SphereGeometry(1, 48, 32),
      new MeshStandardMaterial({
        color: palette.lime,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        roughness: 0.3,
      })
    );
    scene.add(nearest, link, bubble);
    const readoutLabel = context.label("", { color: palette.lime });
    scene.add(readoutLabel);
    context.draggable(probe, {
      clamp: (position) =>
        position.set(
          Math.max(-2.8, Math.min(2.8, position.x)),
          Number(params["height"]),
          Math.max(-2, Math.min(2.6, position.z))
        ),
    });

    let time = 0;
    const normal = new Vector3();
    const target = new Vector3();

    return {
      update({ dt }) {
        if (params["move"] === true) {
          time += dt;
        }
        uniforms.uTime.value = time;
        const height = Number(params["height"]);
        slice.position.y = height;
        uniforms.uCut.value = params["cut"] === true ? height - 0.004 : 99;
        probe.position.y = height;
        sliceUniforms.uBands.value = params["bands"] === true ? 1 : 0;
        const showProbe = params["probe"] === true;
        sliceUniforms.uShowProbe.value = showProbe ? 1 : 0;
        const sdf = field(time);
        const distance = sdf(probe.position.x, height, probe.position.z);
        gradient(sdf, probe.position, normal);
        target.copy(probe.position).addScaledVector(normal, -distance);
        sliceUniforms.uProbe.value.copy(probe.position);
        sliceUniforms.uRadius.value = Math.abs(distance);
        bubble.position.copy(probe.position);
        bubble.scale.setScalar(Math.max(0.001, Math.abs(distance)));
        nearest.position.copy(target);
        link.setPoints([probe.position, target]);
        readoutLabel.position.copy(probe.position).add(new Vector3(0, 0.28, 0));
        readoutLabel.setText(
          `d = ${distance >= 0 ? "+" : ""}${distance.toFixed(2)}`
        );
        for (const item of [probe, nearest, link, bubble, readoutLabel]) {
          item.visible = showProbe;
        }
        context.readout("探査点の距離", `${distance.toFixed(3)} m`);
        context.readout("内外", distance >= 0 ? "外側" : "内側");
        context.caption(
          "SDF は空間の各点に「最も近い表面までの距離」を持たせ、内側を負にしたもの。距離 0 の等値線（白）が形そのもので、距離を半径とする球の中には何もない。"
        );
      },
    };
  },
};
