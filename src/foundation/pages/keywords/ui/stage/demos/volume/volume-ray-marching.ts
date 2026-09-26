import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { glslSimplex } from "../../glsl";
import { glowSprite, palette, pointCloud } from "../../kit";
import type { DemoModule } from "../../types";

const BOX = new Vector3(4.4, 2.2, 3);
const CENTER = new Vector3(0, 1.9, 0);
const PROBE_SAMPLES = 24;

export const demo: DemoModule = {
  alt: "雲のような密度の場を、視線に沿って少しずつ進みながら光を積み重ねて描くボリュームレイマーチングのデモ。各地点で密度を調べ、その地点から太陽の方向へも短く進んで、途中の雲にさえぎられる光（自己影）を求める。歩数を減らすと縞模様が出るが、開始位置を画素ごとにずらすと縞は細かなノイズに変わる。",
  camera: { position: [0.5, 1.9, 6.2], target: [0, 1.8, 0] },
  studio: { background: "#1d2b44" },
  controls: [
    {
      type: "range",
      key: "steps",
      label: "視線方向の歩数",
      min: 6,
      max: 96,
      step: 1,
      value: 48,
    },
    {
      type: "toggle",
      key: "jitter",
      label: "開始位置を画素ごとにずらす",
      value: true,
      hint: "歩数が少ないときの縞模様（バンディング）を細かいノイズに変えます。",
    },
    {
      type: "toggle",
      key: "shadow",
      label: "太陽方向の自己影",
      value: true,
    },
    {
      type: "range",
      key: "density",
      label: "雲の濃さ",
      min: 0.2,
      max: 3,
      step: 0.05,
      value: 1.2,
    },
    {
      type: "toggle",
      key: "probe",
      label: "1 本の視線の標本点を表示",
      value: true,
    },
  ],
  legend: [
    { color: palette.amber, label: "太陽" },
    { color: palette.cyan, label: "視線上の標本点" },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uSteps: { value: 48 },
      uJitter: { value: 1 },
      uShadow: { value: 1 },
      uDensity: { value: 1.2 },
      uSun: { value: new Vector3(0.6, 0.6, -0.5).normalize() },
      uHalf: { value: BOX.clone().multiplyScalar(0.5) },
    };
    const cloud = new Mesh(
      new BoxGeometry(BOX.x, BOX.y, BOX.z),
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
          ${glslSimplex}
          uniform float uTime;
          uniform float uSteps;
          uniform float uJitter;
          uniform float uShadow;
          uniform float uDensity;
          uniform vec3 uSun;
          uniform vec3 uHalf;
          varying vec3 vWorld;
          const vec3 CENTER = vec3(${CENTER.x.toFixed(2)}, ${CENTER.y.toFixed(2)}, ${CENTER.z.toFixed(2)});
          float density(vec3 p) {
            vec3 q = (p - CENTER) / uHalf;
            float shape = 1.0 - length(q * vec3(0.9, 1.2, 1.0));
            vec3 w = p * 0.9 + vec3(uTime * 0.12, 0.0, uTime * 0.05);
            float n = fbm3(w, 5) * 0.9 + 0.2;
            return max(shape * 1.6 + n - 0.45, 0.0) * uDensity * 2.2;
          }
          vec2 boxHit(vec3 ro, vec3 rd) {
            vec3 inv = 1.0 / rd;
            vec3 t0 = (CENTER - uHalf - ro) * inv;
            vec3 t1 = (CENTER + uHalf - ro) * inv;
            vec3 lo = min(t0, t1);
            vec3 hi = max(t0, t1);
            return vec2(max(max(lo.x, lo.y), lo.z), min(min(hi.x, hi.y), hi.z));
          }
          float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main() {
            vec3 ro = cameraPosition;
            vec3 rd = normalize(vWorld - cameraPosition);
            vec2 hit = boxHit(ro, rd);
            float t = max(hit.x, 0.0);
            float tEnd = hit.y;
            float stepSize = (tEnd - t) / uSteps;
            t += stepSize * (uJitter > 0.5 ? hash(gl_FragCoord.xy + fract(uTime) * 91.0) : 0.5);
            float transmittance = 1.0;
            vec3 light = vec3(0.0);
            float cosTheta = dot(rd, uSun);
            float g = 0.35;
            float phase = (1.0 - g * g) / (4.0 * 3.14159 * pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5));
            for (int i = 0; i < 96; i++) {
              if (float(i) >= uSteps || transmittance < 0.01) break;
              vec3 p = ro + rd * t;
              float d = density(p);
              if (d > 0.001) {
                // 太陽の方向へ短く進み、途中の雲の量から届く光を求める
                float shadowDepth = 0.0;
                if (uShadow > 0.5) {
                  for (int j = 1; j <= 6; j++) {
                    shadowDepth += density(p + uSun * float(j) * 0.22) * 0.22;
                  }
                }
                vec3 sunLight = vec3(1.0, 0.92, 0.8) * 11.0 * exp(-shadowDepth * 1.6) * phase;
                vec3 ambient = mix(vec3(0.15, 0.2, 0.32), vec3(0.45, 0.55, 0.7), clamp((p.y - CENTER.y) / uHalf.y * 0.5 + 0.5, 0.0, 1.0)) * 0.35;
                float stepTransmittance = exp(-d * stepSize);
                // この区間で散乱されて視線に入る光（区間内で積分した形）
                light += transmittance * (sunLight + ambient) * (1.0 - stepTransmittance);
                transmittance *= stepTransmittance;
              }
              t += stepSize;
            }
            float alpha = 1.0 - transmittance;
            if (alpha < 0.003) discard;
            gl_FragColor = vec4(light / max(alpha, 1e-3), alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    cloud.position.copy(CENTER);
    scene.add(cloud);
    const frame = new LineSegments(
      new EdgesGeometry(new BoxGeometry(BOX.x, BOX.y, BOX.z)),
      new LineBasicMaterial({
        color: palette.muted,
        transparent: true,
        opacity: 0.35,
      })
    );
    frame.position.copy(CENTER);
    scene.add(frame);

    const sun = new Sprite(
      new SpriteMaterial({
        map: glowSprite(),
        color: new Color("#ffd28a").multiplyScalar(3),
        blending: AdditiveBlending,
        depthWrite: false,
      })
    );
    sun.scale.setScalar(1.1);
    scene.add(sun);

    const samples = pointCloud(PROBE_SAMPLES, { size: 7, color: palette.cyan });
    samples.renderOrder = 5;
    scene.add(samples);
    let angle = 0.7;
    let time = 0;

    return {
      update({ dt }) {
        time += dt;
        angle += dt * 0.15;
        uniforms.uTime.value = time;
        uniforms.uSteps.value = Number(params["steps"]);
        uniforms.uJitter.value = params["jitter"] === true ? 1 : 0;
        uniforms.uShadow.value = params["shadow"] === true ? 1 : 0;
        uniforms.uDensity.value = Number(params["density"]);
        uniforms.uSun.value
          .set(Math.cos(angle) * 0.9, 0.3, Math.sin(angle) * 0.6 - 0.5)
          .normalize();
        sun.position.copy(CENTER).addScaledVector(uniforms.uSun.value, 6.5);
        // 雲を横切る 1 本の視線（左から右）の標本点。歩数を減らすと間隔が広がる
        const steps = Math.min(PROBE_SAMPLES, Number(params["steps"]));
        for (let index = 0; index < PROBE_SAMPLES; index++) {
          const x = CENTER.x - BOX.x / 2 + ((index + 0.5) / steps) * BOX.x;
          samples.positions.set([x, CENTER.y - 0.35, 0.4], index * 3);
          samples.sizes[index] = index < steps ? 1 : 0;
        }
        samples.commit();
        samples.visible = params["probe"] === true;
        context.readout(
          "1 画素の密度評価",
          `約 ${Number(params["steps"]) * (params["shadow"] === true ? 7 : 1)} 回`
        );
        context.caption(
          "視線を一定の歩幅で進み、各地点の密度から「その区間で散乱されて目に届く光」と「後ろの光がさえぎられる割合」を積み重ねる。太陽の方向にも少し進んで、雲自身の影を求めている。"
        );
      },
    };
  },
};
