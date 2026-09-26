import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { arrow, glowSprite, palette } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const LOBE_CENTER = new Vector3(-2.2, 1.3, 0);
const BALL_CENTER = new Vector3(1.9, 1.3, 0);
const BALL_RADIUS = 1.1;

/** ヘニエイ・グリーンシュタイン位相関数。cosTheta は散乱角の余弦。 */
const henyeyGreenstein = (cosTheta: number, g: number) =>
  (1 - g * g) / (4 * Math.PI * (1 + g * g - 2 * g * cosTheta) ** 1.5);

export const demo: DemoModule = {
  alt: "霧や雲の粒子に当たった光が、どの方向へ散らばるかの偏りを表すヘニエイ・グリーンシュタイン位相関数のデモ。左の立体は、左から来た光が散乱される方向ごとの強さ。g が正なら前方（光の進む向き）へ、負なら後方へ多く散らばる。右の霧の球は、光源を背にして見ると g が大きいほど明るく輝く。",
  camera: { position: [0, 1.8, 7], target: [0, 1.2, 0] },
  studio: { background: "#070a12" },
  bloom: { strength: 0.6, radius: 0.5, threshold: 0.7 },
  controls: [
    {
      type: "range",
      key: "g",
      label: "偏り g",
      min: -0.9,
      max: 0.95,
      step: 0.01,
      value: 0.6,
      hint: "0 で全方向に均等（等方散乱）。雲や霧は 0.7〜0.9 程度の強い前方散乱です。",
    },
    { type: "toggle", key: "orbit", label: "右の光源を回す", value: true },
  ],
  legend: [
    { color: palette.amber, label: "入ってくる光" },
    { color: palette.sky, label: "散乱の強さ（方向ごと）" },
  ],
  setup(context) {
    const { scene, params } = context;
    // 位相関数の立体（全方向）
    const geometry = new SphereGeometry(1, 96, 48);
    const position = geometry.getAttribute("position");
    const directions = Array.from({ length: position.count }, (_, index) =>
      new Vector3(
        position.getX(index),
        position.getY(index),
        position.getZ(index)
      ).normalize()
    );
    const colors = new Float32Array(position.count * 3);
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    const lobe = new Mesh(
      geometry,
      new MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        side: DoubleSide,
      })
    );
    lobe.position.copy(LOBE_CENTER);
    const incoming = arrow(palette.amber, { radius: 0.035, emissive: 1 });
    incoming.set(
      LOBE_CENTER.clone().add(new Vector3(-2, 0, 0)),
      new Vector3(1.75, 0, 0)
    );
    const label = context.label("散乱の分布", { size: "md" });
    label.position.copy(LOBE_CENTER).add(new Vector3(0, 1.6, 0));
    scene.add(lobe, incoming, label);
    const low = new Color("#1a3a8f");
    const high = new Color("#9fe3ff");
    const tint = new Color();
    const forward = new Vector3(1, 0, 0);
    const updateLobe = (g: number) => {
      const peak = Math.max(henyeyGreenstein(1, g), henyeyGreenstein(-1, g));
      for (const [index, direction] of directions.entries()) {
        const value = henyeyGreenstein(direction.dot(forward), g) / peak;
        const radius = 1.3 * Math.cbrt(value);
        position.setXYZ(
          index,
          direction.x * radius,
          direction.y * radius,
          direction.z * radius
        );
        tint.copy(low).lerp(high, Math.sqrt(value));
        colors[index * 3] = tint.r;
        colors[index * 3 + 1] = tint.g;
        colors[index * 3 + 2] = tint.b;
      }
      position.needsUpdate = true;
      const color = geometry.getAttribute("color");
      color.needsUpdate = true;
    };

    // 霧の球（中を光が散乱する）
    const uniforms = {
      uG: { value: 0.6 },
      uLight: { value: new Vector3() },
      uCenter: { value: BALL_CENTER },
    };
    const ball = new Mesh(
      new SphereGeometry(BALL_RADIUS, 64, 32),
      new ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uG;
          uniform vec3 uLight;
          uniform vec3 uCenter;
          varying vec3 vWorld;
          const float R = ${BALL_RADIUS.toFixed(2)};
          const float SIGMA = 1.1;
          vec2 sphereHit(vec3 ro, vec3 rd) {
            vec3 oc = ro - uCenter;
            float b = dot(oc, rd);
            float c = dot(oc, oc) - R * R;
            float h = sqrt(max(b * b - c, 0.0));
            return vec2(-b - h, -b + h);
          }
          float phase(float cosTheta) {
            float g2 = uG * uG;
            return (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * uG * cosTheta, 1.5));
          }
          void main() {
            vec3 rd = normalize(vWorld - cameraPosition);
            vec2 hit = sphereHit(cameraPosition, rd);
            float t = max(hit.x, 0.0);
            float stepSize = (hit.y - t) / 40.0;
            float transmittance = 1.0;
            vec3 light = vec3(0.0);
            for (int i = 0; i < 40; i++) {
              vec3 p = cameraPosition + rd * (t + stepSize * (float(i) + 0.5));
              vec3 toLight = uLight - p;
              float distance = length(toLight);
              vec3 l = toLight / distance;
              // 光源から p までに通る霧の長さ（球との交差）で光を弱める
              vec2 lightHit = sphereHit(p, l);
              float inside = max(lightHit.y, 0.0);
              float reach = exp(-SIGMA * inside) * 14.0 / (distance * distance);
              // 散乱角：光の進む向き（-l）と、目へ向かう向き（-rd）のなす角
              float cosTheta = dot(l, rd);
              light += transmittance * SIGMA * stepSize * reach * phase(cosTheta) * vec3(1.0, 0.85, 0.65);
              transmittance *= exp(-SIGMA * stepSize);
            }
            light += vec3(0.02, 0.03, 0.05) * (1.0 - transmittance);
            float alpha = 1.0 - transmittance;
            gl_FragColor = vec4(light / max(alpha, 1e-3), alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    ball.position.copy(BALL_CENTER);
    scene.add(ball);
    const bulb = new Sprite(
      new SpriteMaterial({
        map: glowSprite(),
        color: new Color("#ffcf8a").multiplyScalar(3),
        blending: AdditiveBlending,
        depthWrite: false,
      })
    );
    bulb.scale.setScalar(0.5);
    scene.add(bulb);

    const graph = hudGraph(context, {
      title: "散乱の強さ（横軸：散乱角 0°〜180°、最大を 1 に正規化）",
      xLabel: "180°",
    });
    let drawnG = Number.NaN;
    let angle = 0;

    return {
      update({ dt }) {
        const g = Number(params["g"]);
        if (g !== drawnG) {
          drawnG = g;
          updateLobe(g);
          const peak = Math.max(
            henyeyGreenstein(1, g),
            henyeyGreenstein(-1, g)
          );
          graph.setSeries([
            {
              fn: (t) => henyeyGreenstein(Math.cos(t * Math.PI), g) / peak,
              color: palette.sky,
              label: `g = ${g.toFixed(2)}`,
            },
          ]);
        }
        if (params["orbit"] === true) {
          angle += dt * 0.5;
        }
        // 光源は球の周りを回り、奥（カメラの反対側）に来ると逆光になる
        uniforms.uLight.value.set(
          BALL_CENTER.x + Math.sin(angle) * 2.1,
          BALL_CENTER.y + 0.3,
          BALL_CENTER.z - Math.cos(angle) * 2.1
        );
        uniforms.uG.value = g;
        bulb.position.copy(uniforms.uLight.value);
        const backlit = Math.cos(angle) > 0.5;
        context.readout(
          "右の光源",
          backlit ? "霧の向こう側（逆光）" : "手前・横"
        );
        context.caption(
          g > 0.3
            ? "前方散乱（g > 0）が強いと、光の進む向きにばかり散らばる。光源を背にした霧や雲の縁が輝き、光源の手前から見ると暗く見える。"
            : g < -0.3
              ? "後方散乱（g < 0）では、光が来た方向へ跳ね返りやすい。光源の側から見ると明るい。"
              : "g が 0 に近いと、全方向に均等に散らばる（等方散乱）。どこから見ても同じ明るさになる。"
        );
      },
    };
  },
};
