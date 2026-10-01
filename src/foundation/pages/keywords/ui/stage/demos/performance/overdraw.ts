import {
  AdditiveBlending,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { palette, rng } from "../../kit";
import { smokePuff } from "../../particles";
import { fullscreenPass, fullscreenVertex, screenTarget } from "../../post";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const MAX = 900;
const LIFE = 5;

const billboardVertex = /* glsl */ `
  attribute vec4 iData; // xyz = 位置, w = 大きさ
  attribute float iAlpha;
  uniform float uShrink;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    vUv = 0.5 + (uv - 0.5) * uShrink;
    vAlpha = iAlpha;
    vec4 view = modelViewMatrix * vec4(iData.xyz, 1.0);
    view.xy += position.xy * iData.w * uShrink;
    gl_Position = projectionMatrix * view;
  }
`;

export const demo: DemoModule = {
  alt: "同じ画素を何度も塗り重ねるオーバードローのデモ。煙のような半透明の板を大量に重ねると、1 つの画素を何十回も塗ることになり、GPU の塗りつぶしの能力（フィルレート）を使い切ってしまう。表示を「重なりの回数」に切り替えると、画素ごとに何枚の板が塗られたかを色で表す（青 → 黄 → 赤ほど多い）。板を大きくするほど、また数を増やすほど、塗る回数が増える。板の透明な縁を削って小さくすると、見た目をあまり変えずに塗る回数を減らせる。",
  camera: { position: [0, 3, 9], target: [0, 2.5, 0], fov: 45 },
  controls: [
    {
      type: "select",
      key: "view",
      label: "表示",
      value: "heat",
      options: [
        { value: "normal", label: "ふつうの見た目" },
        { value: "heat", label: "重なりの回数（ヒートマップ）" },
      ],
    },
    {
      type: "range",
      key: "count",
      label: "板の数",
      min: 50,
      max: MAX,
      step: 50,
      value: 400,
    },
    {
      type: "range",
      key: "size",
      label: "板の大きさ",
      min: 0.5,
      max: 4,
      step: 0.1,
      value: 2.2,
    },
    {
      type: "toggle",
      key: "trim",
      label: "透明な縁を削った小さい板にする",
      value: false,
    },
  ],
  legend: [
    { color: palette.sky, label: "重なりが少ない" },
    { color: palette.amber, label: "20 回くらい" },
    { color: palette.coral, label: "60 回以上（白は 120 回以上）" },
  ],
  setup(context) {
    const { scene, params, renderer, camera } = context;
    const quad = new PlaneGeometry(1, 1);
    const geometry = new InstancedBufferGeometry();
    geometry.index = quad.index;
    geometry.setAttribute("position", quad.getAttribute("position"));
    geometry.setAttribute("uv", quad.getAttribute("uv"));
    const data = new Float32Array(MAX * 4);
    const alpha = new Float32Array(MAX);
    const dataAttribute = new InstancedBufferAttribute(data, 4);
    const alphaAttribute = new InstancedBufferAttribute(alpha, 1);
    geometry.setAttribute("iData", dataAttribute);
    geometry.setAttribute("iAlpha", alphaAttribute);
    context.track(geometry);
    const smoke = smokePuff();
    const normalMaterial = context.track(
      new ShaderMaterial({
        uniforms: { uMap: { value: smoke }, uShrink: { value: 1 } },
        vertexShader: billboardVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          varying vec2 vUv;
          varying float vAlpha;
          void main() {
            float a = texture2D(uMap, vUv).a * vAlpha;
            gl_FragColor = vec4(vec3(0.72, 0.76, 0.82), a * 0.5);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
      })
    );
    // 重なりの回数を数える：板が塗られた画素に 1 ずつ足す（透明な部分も GPU は塗っている）
    const heatMaterial = context.track(
      new ShaderMaterial({
        uniforms: { uShrink: { value: 1 } },
        vertexShader: billboardVertex,
        fragmentShader: /* glsl */ `
          void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
      })
    );
    const mesh = new Mesh(geometry, normalMaterial);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const heatTarget = screenTarget(context, { float: true });
    const heatPass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: { uHeat: { value: heatTarget.texture } },
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uHeat;
          varying vec2 vUv;
          vec3 ramp(float t) {
            vec3 a = vec3(0.01, 0.015, 0.03);
            vec3 b = vec3(0.24, 0.55, 1.0);
            vec3 c = vec3(0.97, 0.71, 0.3);
            vec3 d = vec3(0.96, 0.45, 0.44);
            vec3 e = vec3(1.0, 1.0, 1.0);
            if (t < 0.1) return mix(a, b, t / 0.1);
            if (t < 0.33) return mix(b, c, (t - 0.1) / 0.23);
            if (t < 1.0) return mix(c, d, (t - 0.33) / 0.67);
            return mix(d, e, clamp(t - 1.0, 0.0, 1.0));
          }
          void main() {
            float count = texture2D(uHeat, vUv).r;
            gl_FragColor = vec4(ramp(count / 60.0), 1.0);
            #include <colorspace_fragment>
          }
        `,
        depthWrite: false,
      })
    );
    const bufferSize = new Vector2();
    context.setRender(() => {
      if (params["view"] === "heat") {
        mesh.material = heatMaterial;
        renderer.getDrawingBufferSize(bufferSize);
        if (
          heatTarget.width !== bufferSize.x ||
          heatTarget.height !== bufferSize.y
        ) {
          heatTarget.setSize(bufferSize.x, bufferSize.y);
        }
        renderer.setRenderTarget(heatTarget);
        renderer.setClearColor(0, 1);
        renderer.clear();
        // 板だけを数える
        const hidden = scene.children.filter(
          (child) => child !== mesh && child.visible
        );
        for (const child of hidden) {
          child.visible = false;
        }
        renderer.render(scene, camera);
        for (const child of hidden) {
          child.visible = true;
        }
        heatPass.render(renderer, null);
        mesh.material = normalMaterial;
      } else {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }
    });

    const random = rng(5);
    const particles = Array.from({ length: MAX }, (_, i) => ({
      age: (i / MAX) * LIFE,
      position: new Vector3(),
      velocity: new Vector3(),
      seed: random(),
    }));
    const respawn = (p: (typeof particles)[number]) => {
      p.age = 0;
      p.position.set((random() - 0.5) * 0.6, 0.2, (random() - 0.5) * 0.6);
      p.velocity.set(
        (random() - 0.5) * 0.5,
        0.9 + random() * 0.5,
        (random() - 0.5) * 0.5
      );
    };
    for (const p of particles) {
      respawn(p);
      p.age = p.seed * LIFE;
      p.position.addScaledVector(p.velocity, p.age);
    }
    const graph = historyGraph(context, {
      title: "1 画素を塗る平均の回数（見積もり）",
      min: 0,
      max: 20,
      series: [{ color: palette.amber }],
    });
    const toCamera = new Vector3();

    return {
      update({ dt }) {
        const count = Number(params["count"]);
        const size = Number(params["size"]);
        const shrink = params["trim"] === true ? 0.62 : 1;
        normalMaterial.uniforms["uShrink"] = { value: shrink };
        heatMaterial.uniforms["uShrink"] = { value: shrink };
        let area = 0;
        const focal = 1 / Math.tan((camera.fov * Math.PI) / 360);
        for (let i = 0; i < count; i++) {
          const p = particles[i];
          if (!p) {
            continue;
          }
          p.age += dt;
          if (p.age > LIFE) {
            respawn(p);
          }
          p.position.addScaledVector(p.velocity, dt);
          const t = p.age / LIFE;
          const s = size * (0.4 + t * 1.2);
          data.set([p.position.x, p.position.y, p.position.z, s], i * 4);
          alpha[i] = Math.sin(Math.PI * t);
          // 画面の高さを 2 としたときの板の面積から、画面全体に対する割合を見積もる
          const distance = Math.max(
            0.5,
            toCamera.subVectors(p.position, camera.position).length()
          );
          const side = ((s * shrink) / distance) * focal;
          area += (side * side) / (2 * 2 * camera.aspect);
        }
        geometry.instanceCount = count;
        dataAttribute.needsUpdate = true;
        alphaAttribute.needsUpdate = true;
        graph.push([area]);
        context.readout("板の数", `${count}`);
        context.readout(
          "1 画素を塗る平均の回数（見積もり）",
          `${area.toFixed(1)} 回`
        );
        context.caption(
          params["view"] === "heat"
            ? "画素ごとに、何枚の板が塗られたかを色で表している。煙の中心では 1 つの画素を何十回も塗っている。板の透明な部分も、GPU は色を計算して塗っている（何も変わらなくても手間はかかる）ことに注意。"
            : "半透明の板を重ねると、ふんわりした煙になる。ただし重なった所では、同じ画素を板の枚数だけ塗り直している。「重なりの回数」に切り替えて、どこで塗る回数が多いかを見てみよう。"
        );
      },
      dispose() {
        quad.dispose();
      },
    };
  },
};
