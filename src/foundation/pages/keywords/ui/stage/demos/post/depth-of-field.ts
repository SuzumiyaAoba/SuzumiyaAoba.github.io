import { ShaderMaterial, Vector2, Vector3 } from "three";
import { marker, palette } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

const SAMPLES = 64;

export const demo: DemoModule = {
  alt: "ピントの合った距離から外れるほど像をぼかす被写界深度のデモ。深度から画素ごとのぼけの大きさ（錯乱円）を求め、その大きさの円の範囲を読んで平均する。ネオンのような明るい点は、丸いボケ（ボケ味）になって広がる。床をクリックすると、その距離にピントが合う。",
  camera: { position: [0, 1.6, 6.5], target: [0, 1.6, -4] },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "range",
      key: "focus",
      label: "ピントの距離",
      min: 2,
      max: 25,
      step: 0.1,
      value: 8,
      format: (value) => `${value.toFixed(1)} m`,
    },
    {
      type: "range",
      key: "aperture",
      label: "ぼけの強さ（絞りの開き）",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.55,
    },
    {
      type: "toggle",
      key: "follow",
      label: "ドローンを追いかけてピント合わせ",
      value: false,
    },
    {
      type: "toggle",
      key: "coc",
      label: "ぼけの大きさを色で表示",
      value: false,
    },
  ],
  legend: [
    { color: palette.sky, label: "手前のぼけ" },
    { color: palette.amber, label: "奥のぼけ" },
  ],
  hint: "床をクリックすると、その場所の距離にピントを合わせます。",
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    const sceneTarget = screenTarget(context, { depth: true });
    const uniforms = {
      uScene: { value: sceneTarget.texture },
      uDepth: { value: sceneTarget.depthTexture },
      uFocus: { value: 8 },
      uAperture: { value: 0.55 },
      uNear: { value: camera.near },
      uFar: { value: camera.far },
      uResolution: { value: new Vector2(1, 1) },
      uShowCoc: { value: 0 },
    };
    const pass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uScene;
          uniform sampler2D uDepth;
          uniform float uFocus;
          uniform float uAperture;
          uniform float uNear;
          uniform float uFar;
          uniform vec2 uResolution;
          uniform float uShowCoc;
          varying vec2 vUv;
          const float MAX_RADIUS = 22.0; // 画素
          float viewDistance(vec2 uv) {
            float depth = texture2D(uDepth, uv).r;
            return (uNear * uFar) / (uFar - depth * (uFar - uNear));
          }
          // 錯乱円の大きさ（符号付き：負 = 手前、正 = 奥）。-1〜1 を最大半径に写す
          float coc(vec2 uv) {
            float d = viewDistance(uv);
            float c = (d - uFocus) / d * uAperture * 4.0;
            return clamp(c, -1.0, 1.0);
          }
          void main() {
            float centerCoc = coc(vUv);
            if (uShowCoc > 0.5) {
              vec3 base = texture2D(uScene, vUv).rgb * 0.15;
              vec3 tint = centerCoc < 0.0 ? vec3(0.35, 0.66, 1.0) : vec3(0.97, 0.71, 0.3);
              gl_FragColor = vec4(base + tint * abs(centerCoc), 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
              return;
            }
            vec3 sum = vec3(0.0);
            float total = 0.0;
            // 黄金角で円盤状に並べた標本点を読み、その点のぼけがこの画素まで届くなら加える
            for (int i = 0; i < ${SAMPLES}; i++) {
              float fi = float(i) + 0.5;
              float radius = sqrt(fi / ${SAMPLES.toFixed(1)});
              float angle = fi * 2.39996;
              vec2 offset = vec2(cos(angle), sin(angle)) * radius * MAX_RADIUS;
              vec2 uv = vUv + offset / uResolution;
              float sampleCoc = coc(uv);
              float reach = abs(sampleCoc) * MAX_RADIUS;
              // 手前のぼけは奥へはみ出せるが、奥のぼけは手前のくっきりした物の上には広がらない
              float size = sampleCoc < centerCoc ? reach : min(reach, abs(centerCoc) * MAX_RADIUS);
              float weight = smoothstep(radius * MAX_RADIUS - 1.5, radius * MAX_RADIUS + 1.5, size + 0.5);
              sum += texture2D(uScene, uv).rgb * weight;
              total += weight;
            }
            vec3 color = total > 0.0 ? sum / total : texture2D(uScene, vUv).rgb;
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    const size = new Vector2();
    context.onResize(() => {
      renderer.getDrawingBufferSize(size);
      uniforms.uResolution.value.copy(size);
    });
    context.setRender(() => {
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);
      pass.render(renderer, null);
    });

    const focusMark = marker(palette.lime, 0.06);
    focusMark.visible = false;
    scene.add(focusMark);
    const toPoint = new Vector3();
    const forward = new Vector3();
    context.onPick((point) => {
      camera.getWorldDirection(forward);
      toPoint.subVectors(point, camera.position);
      const distance = toPoint.dot(forward);
      context.setParam("focus", Math.min(25, Math.max(2, distance)));
      context.setParam("follow", false);
      focusMark.position.copy(point);
      focusMark.visible = true;
    });

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        showcase.update(time, 0.6);
        if (params["follow"] === true) {
          camera.getWorldDirection(forward);
          toPoint.subVectors(showcase.drone.position, camera.position);
          const distance = toPoint.dot(forward);
          uniforms.uFocus.value +=
            (distance - uniforms.uFocus.value) * Math.min(1, dt * 4);
        } else {
          uniforms.uFocus.value = Number(params["focus"]);
        }
        uniforms.uAperture.value = Number(params["aperture"]);
        uniforms.uShowCoc.value = params["coc"] === true ? 1 : 0;
        context.readout(
          "ピントの距離",
          `${uniforms.uFocus.value.toFixed(1)} m`
        );
        context.caption(
          params["coc"] === true
            ? "青はピントより手前、橙は奥で、色が濃いほど大きくぼける。ピントの距離から離れるほどぼけが大きくなる。"
            : "各画素のぼけの大きさだけ周囲を円盤状に読んで平均する。明るい点は丸いボケになって広がり、ピントの合った物に視線が集まる。"
        );
      },
    };
  },
};
