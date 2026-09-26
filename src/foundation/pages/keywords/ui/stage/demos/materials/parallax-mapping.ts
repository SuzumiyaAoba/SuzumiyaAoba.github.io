import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { glslHash, glslPerlin } from "../../glsl";
import { palette, standard } from "../../kit";
import type { DemoModule } from "../../types";

const modes = { flat: 0, normal: 1, offset: 2, occlusion: 3 } as const;

export const demo: DemoModule = {
  alt: "平らな板に貼ったレンガの壁。法線マップだけでは陰影はつくが斜めから見ると平面のまま。パララックスマッピングでは視線の角度に応じて参照位置をずらし、視差遮蔽マッピングでは高さを段階的にたどることで、レンガが手前に飛び出し目地が奥にへこんで見える。",
  camera: { position: [3.6, 1.6, 4.4], target: [0, 1.5, 0] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "凹凸の表現",
      value: "occlusion",
      options: [
        { value: "flat", label: "なし" },
        { value: "normal", label: "法線マップのみ" },
        { value: "offset", label: "パララックス" },
        { value: "occlusion", label: "視差遮蔽（POM）" },
      ],
    },
    {
      type: "range",
      key: "depth",
      label: "凹凸の深さ",
      min: 0,
      max: 0.15,
      step: 0.005,
      value: 0.07,
    },
    { type: "toggle", key: "light", label: "光源を動かす", value: true },
  ],
  legend: [{ color: palette.amber, label: "点光源" }],
  hint: "視点を横へ回して、壁を斜めから見たときの違いを比べてください。",
  setup(context) {
    const { scene, params } = context;
    const lightPosition = new Vector3(0, 2, 1.5);
    const uniforms = {
      uMode: { value: 3 },
      uDepth: { value: 0.07 },
      uLight: { value: lightPosition },
    };
    const wall = new Mesh(
      new PlaneGeometry(4, 3),
      new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vWorld;
          void main() {
            vUv = uv;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          ${glslHash}
          ${glslPerlin}
          uniform float uMode;
          uniform float uDepth;
          uniform vec3 uLight;
          varying vec2 vUv;
          varying vec3 vWorld;
          vec2 brickCoord(vec2 uv) {
            vec2 p = uv * vec2(4.0, 6.0);
            p.x += mod(floor(p.y), 2.0) * 0.5;
            return p;
          }
          // 0 = 目地の底、1 = レンガの表面
          float heightAt(vec2 uv) {
            vec2 p = brickCoord(uv);
            vec2 f = fract(p);
            float edge = min(min(f.x, 1.0 - f.x) * 3.0, min(f.y, 1.0 - f.y) * 2.0);
            float brick = smoothstep(0.03, 0.14, edge);
            float rough = perlin2(uv * 40.0) * 0.08 + perlin2(uv * 11.0) * 0.08;
            return clamp(brick * (0.9 + rough), 0.0, 1.0);
          }
          vec3 albedoAt(vec2 uv) {
            vec2 p = brickCoord(uv);
            float tone = hash12(floor(p));
            vec3 brick = mix(vec3(0.55, 0.22, 0.14), vec3(0.72, 0.36, 0.22), tone);
            brick *= 0.85 + 0.25 * (perlin2(uv * 30.0) + 0.5);
            vec3 mortar = vec3(0.55, 0.52, 0.48);
            return mix(mortar, brick, smoothstep(0.35, 0.6, heightAt(uv)));
          }
          void main() {
            // 板は xy 平面に置いているので、接空間 = (x, y, z) そのもの
            vec3 viewTS = normalize(cameraPosition - vWorld);
            vec2 uv = vUv;
            float scale = uDepth / 4.0;
            if (uMode > 1.5 && uMode < 2.5) {
              float h = heightAt(uv);
              uv -= viewTS.xy / max(viewTS.z, 0.2) * (1.0 - h) * scale;
            } else if (uMode > 2.5) {
              float layers = mix(48.0, 12.0, abs(viewTS.z));
              vec2 shift = viewTS.xy / max(viewTS.z, 0.1) * scale;
              vec2 delta = shift / layers;
              float layerDepth = 0.0;
              float depth = 1.0 - heightAt(uv);
              vec2 previousUv = uv;
              float previousGap = 0.0;
              for (int i = 0; i < 48; i++) {
                if (layerDepth >= depth || float(i) >= layers) break;
                previousUv = uv;
                previousGap = depth - layerDepth;
                uv -= delta;
                depth = 1.0 - heightAt(uv);
                layerDepth += 1.0 / layers;
              }
              float after = depth - layerDepth;
              float weight = after / (after - previousGap + 1e-5);
              uv = mix(uv, previousUv, weight);
            }
            vec3 normal = vec3(0.0, 0.0, 1.0);
            if (uMode > 0.5) {
              float e = 0.0015;
              float hx = heightAt(uv + vec2(e, 0.0)) - heightAt(uv - vec2(e, 0.0));
              float hy = heightAt(uv + vec2(0.0, e)) - heightAt(uv - vec2(0.0, e));
              normal = normalize(vec3(-hx, -hy, 8.0 * e / max(uDepth, 0.005)));
            }
            vec3 toLight = uLight - vWorld;
            float distance = length(toLight);
            vec3 l = toLight / distance;
            vec3 h = normalize(l + viewTS);
            float diffuse = max(dot(normal, l), 0.0);
            float specular = pow(max(dot(normal, h), 0.0), 32.0) * 0.25;
            float attenuation = 3.5 / (1.0 + distance * distance * 0.5);
            vec3 albedo = pow(albedoAt(uv), vec3(2.2));
            vec3 color = albedo * (0.12 + diffuse * attenuation * vec3(1.0, 0.85, 0.65)) + specular * attenuation;
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    wall.position.set(0, 1.5, 0);
    scene.add(wall);
    const bulb = new Mesh(
      new SphereGeometry(0.07, 16, 12),
      standard(palette.amber, { emissive: 2 })
    );
    scene.add(bulb);
    let clock = 0;

    return {
      update({ dt }) {
        if (params["light"] === true) {
          clock += dt;
        }
        lightPosition.set(
          Math.sin(clock * 0.7) * 1.7,
          1.5 + Math.cos(clock * 0.9) * 0.9,
          0.9
        );
        bulb.position.copy(lightPosition);
        const mode = String(params["mode"]);
        uniforms.uMode.value =
          mode === "flat"
            ? modes.flat
            : mode === "normal"
              ? modes.normal
              : mode === "offset"
                ? modes.offset
                : modes.occlusion;
        uniforms.uDepth.value = Number(params["depth"]);
        context.readout("ポリゴン", "板 1 枚（三角形 2 個）");
        context.caption(
          mode === "flat"
            ? "凹凸の情報なし。ただの平らな絵。"
            : mode === "normal"
              ? "法線マップだけ：光の当たり方は凹凸らしくなるが、斜めから見ても輪郭や奥行きは平面のまま。"
              : mode === "offset"
                ? "パララックス：視線の角度と高さに応じて参照する UV をずらす。1 回の計算で奥行き感が出るが、急な角度では崩れやすい。"
                : "視差遮蔽：視線に沿って高さマップを少しずつたどり、表面に当たった位置の色を使う。レンガが目地を隠す遮蔽まで表現できる。"
        );
      },
    };
  },
};
