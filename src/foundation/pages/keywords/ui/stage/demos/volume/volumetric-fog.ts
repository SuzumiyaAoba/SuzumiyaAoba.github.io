import {
  AmbientLight,
  BoxGeometry,
  CylinderGeometry,
  DepthTexture,
  HalfFloatType,
  Matrix4,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SpotLight,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three";
import type { Texture } from "three";
import { glslSimplex } from "../../glsl";
import { palette, standard } from "../../kit";
import type { DemoModule } from "../../types";

export const demo: DemoModule = {
  alt: "暗い広間に斜めに差し込むスポットライトを、空間を満たす霧が受け止めて光の筋として見せるボリューメトリックフォグのデモ。視線に沿って霧の中を進み、各地点に光が届くかをスポットライトの影（シャドウマップ）で調べるので、柱の影が光の筋を区切る。霧の濃さのむらを動かすと、光の中を漂う空気感が出る。",
  camera: { position: [6.5, 3, 9.5], target: [0, 1.8, -0.5] },
  controls: [
    {
      type: "range",
      key: "density",
      label: "霧の濃さ",
      min: 0,
      max: 0.5,
      step: 0.01,
      value: 0.16,
    },
    { type: "toggle", key: "shadow", label: "影で光をさえぎる", value: true },
    {
      type: "toggle",
      key: "noise",
      label: "濃さのむら（漂う霧）",
      value: true,
    },
    {
      type: "range",
      key: "steps",
      label: "視線方向の歩数",
      min: 8,
      max: 96,
      step: 1,
      value: 48,
    },
    { type: "toggle", key: "sweep", label: "光を動かす", value: true },
  ],
  legend: [{ color: palette.amber, label: "スポットライト" }],
  setup(context) {
    const { scene, params, renderer, camera } = context;
    const hidden = scene.children.filter(
      (child) =>
        (child.type === "HemisphereLight" ||
          child.type === "DirectionalLight") &&
        child.visible
    );
    for (const light of hidden) {
      light.visible = false;
    }
    const previousEnvironment = scene.environmentIntensity;
    scene.environmentIntensity = 0.05;
    const ambient = new AmbientLight("#3a4660", 0.25);
    scene.add(ambient);

    // 広間：床、奥の壁、柱の列、中央の像
    const stone = standard("#6d6a66", { roughness: 0.9 });
    const floor = new Mesh(
      new PlaneGeometry(16, 12),
      standard("#3d3b39", { roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    const wall = new Mesh(new BoxGeometry(16, 6, 0.4), stone);
    wall.position.set(0, 3, -4);
    wall.receiveShadow = true;
    scene.add(floor, wall);
    for (let index = 0; index < 6; index++) {
      const pillar = new Mesh(new CylinderGeometry(0.28, 0.32, 4.6, 24), stone);
      pillar.position.set(-5 + index * 2, 2.3, -1.2);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    }
    const statue = new Mesh(
      new SphereGeometry(0.6, 48, 32),
      standard("#b7a58a", { roughness: 0.5 })
    );
    statue.position.set(0.6, 0.6, 1);
    statue.castShadow = true;
    statue.receiveShadow = true;
    scene.add(statue);

    const spot = new SpotLight("#ffd9a8", 220, 30, 0.3, 0.3, 1.6);
    spot.position.set(-6, 7.5, -3.2);
    spot.target.position.set(1, 0, 1.5);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0005;
    spot.shadow.camera.near = 1;
    spot.shadow.camera.far = 30;
    scene.add(spot, spot.target);

    const sceneTarget = context.track(
      new WebGLRenderTarget(1, 1, {
        type: HalfFloatType,
        depthTexture: new DepthTexture(1, 1),
      })
    );
    const uniforms = {
      uScene: { value: sceneTarget.texture },
      uDepth: { value: sceneTarget.depthTexture as Texture | null },
      uShadowMap: { value: null as Texture | null },
      uShadowMatrix: { value: new Matrix4() },
      uUseShadow: { value: 1 },
      uProjectionInverse: { value: new Matrix4() },
      uCameraWorld: { value: new Matrix4() },
      uLightPosition: { value: new Vector3() },
      uLightDirection: { value: new Vector3() },
      uCone: { value: new Vector2() },
      uDensity: { value: 0.16 },
      uNoise: { value: 1 },
      uSteps: { value: 48 },
      uTime: { value: 0 },
    };
    const quadScene = new Scene();
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fogMaterial = context.track(
      new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          ${glslSimplex}
          uniform sampler2D uScene;
          uniform sampler2D uDepth;
          uniform sampler2DShadow uShadowMap;
          uniform mat4 uShadowMatrix;
          uniform float uUseShadow;
          uniform mat4 uProjectionInverse;
          uniform mat4 uCameraWorld;
          uniform vec3 uLightPosition;
          uniform vec3 uLightDirection;
          uniform vec2 uCone;
          uniform float uDensity;
          uniform float uNoise;
          uniform float uSteps;
          uniform float uTime;
          varying vec2 vUv;
          vec3 worldFromDepth(vec2 uv, float depth) {
            vec4 view = uProjectionInverse * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
            view /= view.w;
            return (uCameraWorld * view).xyz;
          }
          float fogDensity(vec3 p) {
            float d = uDensity * exp(-max(p.y, 0.0) * 0.12);
            if (uNoise > 0.5) {
              d *= clamp(0.55 + 0.9 * fbm3(p * 0.45 + vec3(uTime * 0.18, uTime * 0.05, 0.0), 3), 0.0, 2.0);
            }
            return d;
          }
          float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main() {
            vec3 sceneColor = texture2D(uScene, vUv).rgb;
            float depth = texture2D(uDepth, vUv).r;
            vec3 surface = worldFromDepth(vUv, depth);
            vec3 ro = cameraPosition;
            vec3 toSurface = surface - ro;
            float maxDistance = min(length(toSurface), 30.0);
            vec3 rd = toSurface / length(toSurface);
            float stepSize = maxDistance / uSteps;
            float t = stepSize * hash(gl_FragCoord.xy + fract(uTime * 7.0) * 37.0);
            float transmittance = 1.0;
            vec3 scattered = vec3(0.0);
            for (int i = 0; i < 96; i++) {
              if (float(i) >= uSteps) break;
              vec3 p = ro + rd * t;
              float density = fogDensity(p);
              vec3 toLight = uLightPosition - p;
              float distance = length(toLight);
              vec3 l = toLight / distance;
              float cone = smoothstep(uCone.x, uCone.y, dot(-l, uLightDirection));
              float visibility = 1.0;
              if (uUseShadow > 0.5 && cone > 0.0) {
                vec4 coord = uShadowMatrix * vec4(p, 1.0);
                coord.xyz /= coord.w;
                if (all(greaterThan(coord.xyz, vec3(0.0))) && all(lessThan(coord.xyz, vec3(1.0)))) {
                  visibility = texture(uShadowMap, vec3(coord.xy, coord.z - 0.001));
                }
              }
              float g = 0.45;
              float cosTheta = dot(rd, -l);
              float phase = (1.0 - g * g) / (4.0 * 3.14159 * pow(1.0 + g * g + 2.0 * g * cosTheta, 1.5));
              vec3 light = vec3(1.0, 0.85, 0.66) * 150.0 * cone * visibility * phase / (1.0 + distance * distance * 0.35);
              vec3 ambient = vec3(0.008, 0.01, 0.018);
              float stepTransmittance = exp(-density * stepSize);
              scattered += transmittance * (light + ambient) * (1.0 - stepTransmittance);
              transmittance *= stepTransmittance;
              t += stepSize;
            }
            vec3 color = sceneColor * transmittance + scattered;
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    const quad = new Mesh(new PlaneGeometry(2, 2), fogMaterial);
    context.track(quad.geometry);
    quadScene.add(quad);

    const size = new Vector2();
    context.onResize(() => {
      renderer.getDrawingBufferSize(size);
      sceneTarget.setSize(size.x, size.y);
    });
    context.setRender(() => {
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      uniforms.uShadowMap.value = spot.shadow.map?.depthTexture ?? null;
      uniforms.uShadowMatrix.value.copy(spot.shadow.matrix);
      uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
      uniforms.uCameraWorld.value.copy(camera.matrixWorld);
      renderer.render(quadScene, quadCamera);
    });

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        if (params["sweep"] === true) {
          spot.target.position.set(
            1 + Math.sin(time * 0.35) * 2.2,
            0,
            1.2 + Math.cos(time * 0.27) * 1.2
          );
        }
        spot.target.updateMatrixWorld();
        uniforms.uTime.value = time;
        uniforms.uDensity.value = Number(params["density"]);
        uniforms.uNoise.value = params["noise"] === true ? 1 : 0;
        uniforms.uUseShadow.value = params["shadow"] === true ? 1 : 0;
        uniforms.uSteps.value = Number(params["steps"]);
        uniforms.uLightPosition.value.copy(spot.position);
        uniforms.uLightDirection.value
          .subVectors(spot.target.position, spot.position)
          .normalize();
        uniforms.uCone.value.set(
          Math.cos(spot.angle),
          Math.cos(spot.angle * (1 - spot.penumbra))
        );
        context.readout("霧の濃さ", uniforms.uDensity.value.toFixed(2));
        context.caption(
          params["shadow"] === true
            ? "視線に沿って霧の中を進み、各地点で「スポットライトの光が届くか（円錐の内側か、影になっていないか）」を調べて、届く光を散乱として積み重ねる。柱の影で光の筋が区切られる。"
            : "影を使わないと、光の円錐全体が一様に光り、柱を突き抜けた不自然な光になる。"
        );
      },
      dispose() {
        for (const light of hidden) {
          light.visible = true;
        }
        scene.environmentIntensity = previousEnvironment;
      },
    };
  },
};
