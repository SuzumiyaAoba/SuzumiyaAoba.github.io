import {
  DataTexture,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Quaternion,
  DodecahedronGeometry,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  Vector3,
} from "three";
import { glslHash, glslPerlin } from "../../glsl";
import { palette, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

const WIDTH = 10;
const DEPTH = 5;
const MAP_W = 128;
const MAP_H = 64;
const rocks = [
  { x: -2.2, z: 0.4, r: 0.55 },
  { x: 0.8, z: -0.9, r: 0.45 },
  { x: 2.6, z: 0.9, r: 0.6 },
] as const;

/** 円柱まわりのポテンシャル流の重ね合わせで、川の流れの向きを求める。 */
function flowAt(x: number, z: number) {
  let vx = 1;
  let vz = 0;
  for (const rock of rocks) {
    const dx = x - rock.x;
    const dz = z - rock.z;
    const r2 = Math.max(dx * dx + dz * dz, rock.r * rock.r);
    const a2 = rock.r * rock.r * 1.4;
    vx -= (a2 * (dx * dx - dz * dz)) / (r2 * r2);
    vz -= (a2 * 2 * dx * dz) / (r2 * r2);
  }
  // 岸に近いほど遅い
  const bank = 1 - (Math.abs(z) / (DEPTH / 2)) ** 4;
  return [vx * bank, vz * bank] as const;
}

export const demo: DemoModule = {
  alt: "岩の点在する川のデモ。各地点の流れの向きを書き込んだフローマップに沿って水面の模様を運ぶと、模様が岩を回り込み、岩の後ろで渦を巻くように流れる。ただの一方向のスクロールでは、模様が岩を突き抜けてまっすぐ流れる。",
  camera: { position: [0, 6.2, 6], target: [0, 0, 0.3] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "模様の動かし方",
      value: "flow",
      options: [
        { value: "flow", label: "フローマップ" },
        { value: "scroll", label: "一方向の UV スクロール" },
      ],
    },
    {
      type: "range",
      key: "speed",
      label: "流れの速さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 0.8,
    },
    { type: "toggle", key: "debug", label: "フローマップを表示", value: false },
  ],
  legend: [{ color: palette.amber, label: "流れの向き（表示時）" }],
  setup(context) {
    const { scene, params } = context;
    const data = new Uint8Array(MAP_W * MAP_H * 4);
    const arrowPoints: Vector3[] = [];
    for (let j = 0; j < MAP_H; j++) {
      for (let i = 0; i < MAP_W; i++) {
        const x = ((i + 0.5) / MAP_W - 0.5) * WIDTH;
        const z = ((j + 0.5) / MAP_H - 0.5) * DEPTH;
        const [vx, vz] = flowAt(x, z);
        const index = (j * MAP_W + i) * 4;
        data[index] = Math.round(
          (Math.max(-1, Math.min(1, vx * 0.5)) * 0.5 + 0.5) * 255
        );
        data[index + 1] = Math.round(
          (Math.max(-1, Math.min(1, vz * 0.5)) * 0.5 + 0.5) * 255
        );
        data[index + 2] = 128;
        data[index + 3] = 255;
        if (i % 8 === 4 && j % 8 === 4) {
          const start = new Vector3(x, 0.08, z);
          arrowPoints.push(
            start,
            start.clone().add(new Vector3(vx, 0, vz).multiplyScalar(0.28))
          );
        }
      }
    }
    const flowMap = new DataTexture(data, MAP_W, MAP_H, RGBAFormat);
    flowMap.magFilter = LinearFilter;
    flowMap.minFilter = LinearFilter;
    flowMap.needsUpdate = true;
    context.track(flowMap);

    const uniforms = {
      uTime: { value: 0 },
      uFlow: { value: flowMap },
      uMode: { value: 0 },
      uDebug: { value: 0 },
    };
    const water = new Mesh(
      new PlaneGeometry(WIDTH, DEPTH),
      new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          ${glslHash}
          ${glslPerlin}
          uniform float uTime;
          uniform sampler2D uFlow;
          uniform float uMode;
          uniform float uDebug;
          varying vec2 vUv;
          vec3 waterPattern(vec2 uv) {
            vec2 p = uv * vec2(${WIDTH.toFixed(1)}, ${DEPTH.toFixed(1)}) * 1.8;
            float n = perlinFbm(p, 4, 2.0, 0.5) * 0.5 + 0.5;
            float lines = abs(perlin2(p * 1.3 + n * 1.5));
            float ripple = 1.0 - smoothstep(0.0, 0.06, lines);
            vec3 deep = vec3(0.06, 0.26, 0.38);
            vec3 shallow = vec3(0.13, 0.45, 0.56);
            return mix(mix(deep, shallow, n), vec3(0.8, 0.93, 0.98), ripple * 0.55);
          }
          void main() {
            // フローマップは下向き v（=+z）なので、UV の y を反転して参照する
            vec2 mapUv = vec2(vUv.x, 1.0 - vUv.y);
            vec2 flow = texture2D(uFlow, mapUv).rg * 2.0 - 1.0;
            if (uDebug > 0.5) {
              gl_FragColor = vec4(pow(vec3(flow * 0.5 + 0.5, 0.5), vec3(2.2)), 1.0);
              #include <colorspace_fragment>
              return;
            }
            vec2 dir = uMode < 0.5 ? vec2(flow.x, -flow.y) : vec2(1.0, 0.0);
            vec2 scale = vec2(1.0 / ${WIDTH.toFixed(1)}, 1.0 / ${DEPTH.toFixed(1)}) * 0.45;
            // 2 つの位相をずらして補間し、模様が伸びきる前に入れ替える
            float phase0 = fract(uTime);
            float phase1 = fract(uTime + 0.5);
            vec3 a = waterPattern(vUv - dir * scale * phase0);
            vec3 b = waterPattern(vUv - dir * scale * phase1 + 0.37);
            float weight = abs(phase0 - 0.5) * 2.0;
            vec3 color = mix(a, b, weight);
            float speed = length(flow);
            color = mix(color, vec3(0.9, 0.97, 1.0), smoothstep(1.2, 1.9, speed) * 0.35);
            gl_FragColor = vec4(pow(color, vec3(2.2)), 1.0);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.02;
    scene.add(water);
    for (const rock of rocks) {
      const mesh = new Mesh(
        new DodecahedronGeometry(rock.r, 1),
        standard("#6b645b", { roughness: 0.9 })
      );
      mesh.material.flatShading = true;
      mesh.position.set(rock.x, rock.r * 0.4, rock.z);
      mesh.scale.set(1, 0.8, 1);
      mesh.castShadow = true;
      scene.add(mesh);
    }
    for (const side of [-1, 1]) {
      const bank = new Mesh(
        new PlaneGeometry(WIDTH, 1.4),
        standard("#3d4a33", { roughness: 1 })
      );
      bank.rotation.x = -Math.PI / 2;
      bank.position.set(0, 0.01, side * (DEPTH / 2 + 0.7));
      scene.add(bank);
    }
    const arrows = segments(arrowPoints, palette.amber, { width: 1.5 });
    scene.add(arrows);
    // 同じ流れ場で運ばれる落ち葉（流れの向きが静止画でも分かるように）
    const LEAVES = 70;
    const leaves = new InstancedMesh(
      new PlaneGeometry(0.16, 0.1),
      standard("#d9973a", { roughness: 0.8 }),
      LEAVES
    );
    leaves.material.side = DoubleSide;
    scene.add(leaves);
    const leafPositions = Array.from(
      { length: LEAVES },
      (_, index) =>
        new Vector3(
          -WIDTH / 2 + (index / LEAVES) * WIDTH,
          0.05,
          (((index * 0.618) % 1) - 0.5) * DEPTH * 0.85
        )
    );
    const leafMatrix = new Matrix4();
    const leafRotation = new Quaternion();
    const leafUp = new Vector3(0, 1, 0);

    return {
      update({ dt }) {
        const speed = Number(params["speed"]);
        uniforms.uTime.value += dt * speed;
        const useFlow = params["mode"] === "flow";
        for (const [index, leaf] of leafPositions.entries()) {
          const [vx, vz] = useFlow ? flowAt(leaf.x, leaf.z) : [1, 0];
          leaf.x += vx * dt * speed * 0.9;
          leaf.z += vz * dt * speed * 0.9;
          if (leaf.x > WIDTH / 2 || Math.abs(leaf.z) > DEPTH / 2) {
            leaf.set(
              -WIDTH / 2,
              0.05,
              (((index * 0.618 + uniforms.uTime.value * 0.37) % 1) - 0.5) *
                DEPTH *
                0.85
            );
          }
          leafRotation.setFromAxisAngle(leafUp, Math.atan2(-vz, vx) + index);
          leafMatrix.compose(
            leaf,
            leafRotation.multiply(
              new Quaternion().setFromAxisAngle(
                new Vector3(1, 0, 0),
                -Math.PI / 2
              )
            ),
            new Vector3(1, 1, 1)
          );
          leaves.setMatrixAt(index, leafMatrix);
        }
        leaves.instanceMatrix.needsUpdate = true;
        uniforms.uMode.value = params["mode"] === "flow" ? 0 : 1;
        const debug = params["debug"] === true;
        uniforms.uDebug.value = debug ? 1 : 0;
        arrows.visible = debug;
        context.readout(
          "フローマップ",
          `${MAP_W} × ${MAP_H} 画素（RG = 流れの向き）`
        );
        context.caption(
          params["mode"] === "flow"
            ? "フローマップの向きに沿って UV をずらす。ずらし続けると模様が伸びるので、半周期ずらした 2 枚を交互にフェードさせて入れ替える。"
            : "一方向の UV スクロールでは、流れの向きがどこでも同じ。模様が岩を突き抜けて流れていく。"
        );
      },
    };
  },
};
