import {
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  ShaderMaterial,
  SphereGeometry,
  Vector4,
  WireframeGeometry,
  LineSegments,
  LineBasicMaterial,
} from "three";
import { palette, rng, standard } from "../../kit";
import { raymarchWorld } from "../../raymarch";
import type { DemoModule } from "../../types";

const BLOBS = 7;
const LAMP_RADIUS = 0.62;
const BOTTOM = 0.62;
const TOP = 2.9;

const fieldGlsl = /* glsl */ `
  uniform vec4 uBlobs[${BLOBS}];
  uniform float uThreshold;
  uniform float uCount;
  // Wyvill 型の影響関数 (1 - r²/R²)³ を足し合わせる
  float field(vec3 p, out float bound) {
    float f = 0.0;
    bound = 1e5;
    for (int i = 0; i < ${BLOBS}; i++) {
      if (float(i) >= uCount) break;
      vec3 d = p - uBlobs[i].xyz;
      float r2 = dot(d, d) / (uBlobs[i].w * uBlobs[i].w);
      bound = min(bound, sqrt(dot(d, d)) - uBlobs[i].w);
      if (r2 < 1.0) {
        float x = 1.0 - r2;
        f += x * x * x;
      }
    }
    return f;
  }
`;

type Blob = {
  position: [number, number, number];
  velocity: [number, number, number];
  heat: number;
  radius: number;
};

export const demo: DemoModule = {
  alt: "溶岩ランプの中で、温められた蝋の塊が浮き上がり、冷えて沈むメタボールのデモ。各塊は周囲に影響の場を持ち、場の合計がしきい値を超える範囲を表面として描くので、近づいた塊は自然に融合し、離れるとちぎれて分かれる。",
  camera: { position: [0, 2, 6.4], target: [0, 1.7, 0] },
  studio: { floor: false, background: "#07090f" },
  bloom: { strength: 0.9, radius: 0.6, threshold: 0.55 },
  controls: [
    {
      type: "range",
      key: "threshold",
      label: "しきい値（等値面の値）",
      min: 0.1,
      max: 0.8,
      step: 0.01,
      value: 0.25,
      hint: "下げると塊が膨らんでつながりやすく、上げると痩せて離れやすくなります。",
    },
    {
      type: "range",
      key: "count",
      label: "塊の数",
      min: 1,
      max: BLOBS,
      step: 1,
      value: 6,
    },
    {
      type: "toggle",
      key: "section",
      label: "場の値を断面で表示",
      value: false,
    },
    {
      type: "toggle",
      key: "centers",
      label: "塊の中心と影響範囲を表示",
      value: false,
    },
    {
      type: "range",
      key: "speed",
      label: "速さ",
      min: 0,
      max: 3,
      step: 0.1,
      value: 1,
    },
  ],
  legend: [
    { color: palette.amber, label: "場の合計 = しきい値 の等値面" },
    { color: palette.sky, label: "影響範囲（中心から半径 R）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(5);
    const blobs: Blob[] = Array.from({ length: BLOBS }, (_, index) => ({
      position: [
        (random() - 0.5) * 0.5,
        BOTTOM + 0.3 + (index / BLOBS) * (TOP - BOTTOM - 0.6),
        (random() - 0.5) * 0.5,
      ],
      velocity: [0, 0, 0],
      heat: random(),
      radius: 0.36 + random() * 0.16,
    }));
    const blobUniform = Array.from({ length: BLOBS }, () => new Vector4());
    const uniforms = {
      uThreshold: { value: 0.25 },
      uCount: { value: 6 },
      uCut: { value: 0 },
    };
    raymarchWorld(context, {
      uniforms: { uCut: uniforms.uCut },
      rawUniforms: {
        uBlobs: { value: blobUniform },
        uThreshold: uniforms.uThreshold,
        uCount: uniforms.uCount,
      },
      steps: 160,
      shadowOffset: 0.08,
      emission: true,
      functions: /* glsl */ `
        ${fieldGlsl}
        float map(vec3 p) {
          float bound;
          float f = field(p, bound);
          float d = f < 1e-4 ? max(bound, 0.02) : (uThreshold - f) * 0.3;
          return uCut > 0.5 ? max(d, p.z + 0.006) : d;
        }
        vec4 surface(vec3 p, vec3 n) {
          return vec4(1.0, 0.42, 0.2, 0.35);
        }
        vec3 emission(vec3 p, vec3 n) {
          float heat = smoothstep(${TOP.toFixed(1)}, ${BOTTOM.toFixed(1)}, p.y);
          return mix(vec3(0.35, 0.05, 0.02), vec3(0.95, 0.35, 0.08), heat) * 0.8;
        }
      `,
    });

    // ランプの器
    const glass = new Mesh(
      new CylinderGeometry(
        LAMP_RADIUS + 0.06,
        LAMP_RADIUS + 0.2,
        TOP - BOTTOM + 0.5,
        64,
        1,
        true
      ),
      new MeshStandardMaterial({
        color: "#6a8bb8",
        transparent: true,
        opacity: 0.16,
        roughness: 0.05,
        metalness: 0.2,
        side: DoubleSide,
        depthWrite: false,
      })
    );
    glass.position.y = (TOP + BOTTOM) / 2;
    const metal = standard("#384255", { metalness: 0.8, roughness: 0.3 });
    const base = new Mesh(
      new CylinderGeometry(LAMP_RADIUS + 0.2, 0.7, 0.62, 48),
      metal
    );
    base.position.y = 0.31;
    const cap = new Mesh(
      new CylinderGeometry(0.28, LAMP_RADIUS + 0.06, 0.4, 48),
      metal
    );
    cap.position.y = TOP + 0.45;
    base.castShadow = true;
    cap.castShadow = true;
    const glow = new PointLight("#ff7a3a", 3, 5, 1.5);
    glow.position.set(0, 0.9, 0);
    scene.add(glass, base, cap, glow);

    // 場の断面（z = 0）
    const section = new Mesh(
      new PlaneGeometry(2 * LAMP_RADIUS + 0.2, TOP - BOTTOM + 0.2),
      new ShaderMaterial({
        uniforms: {
          uBlobs: { value: blobUniform },
          uThreshold: uniforms.uThreshold,
          uCount: uniforms.uCount,
        },
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
          ${fieldGlsl}
          varying vec3 vWorld;
          void main() {
            float bound;
            float f = field(vec3(vWorld.xy, 0.0), bound);
            vec3 cold = vec3(0.1, 0.2, 0.45);
            vec3 hot = vec3(1.0, 0.75, 0.3);
            vec3 color = mix(cold, hot, clamp(f / (uThreshold * 2.0), 0.0, 1.0));
            float bands = 0.5 + 0.5 * cos(6.2831853 * f / 0.1);
            float w = fwidth(f);
            float iso = 1.0 - smoothstep(0.0, 1.5 * w, abs(f - uThreshold));
            color = mix(color * (0.75 + 0.25 * bands), vec3(1.0, 0.85, 0.4), iso);
            gl_FragColor = vec4(pow(color, vec3(2.2)), max(0.8 * step(0.002, f) + 0.25, iso));
            #include <colorspace_fragment>
          }
        `,
      })
    );
    section.position.set(0, (TOP + BOTTOM) / 2, 0.004);
    scene.add(section);

    const centers = new InstancedMesh(
      new SphereGeometry(0.04, 12, 8),
      standard(palette.sky, { emissive: 1 }),
      BLOBS
    );
    centers.material.depthTest = false;
    centers.renderOrder = 10;
    const influenceMaterial = new LineBasicMaterial({
      color: palette.sky,
      transparent: true,
      opacity: 0.25,
      depthTest: false,
    });
    const influenceGeometry = new WireframeGeometry(
      new SphereGeometry(1, 12, 8)
    );
    const influences = blobs.map(() => {
      const line = new LineSegments(influenceGeometry, influenceMaterial);
      line.renderOrder = 9;
      scene.add(line);
      return line;
    });
    scene.add(centers);
    const matrix = new Matrix4();
    let time = 0;

    const step = (dt: number) => {
      for (const blob of blobs) {
        const [x, y, z] = blob.position;
        // 底で温まり、上で冷える。温度で浮力が決まる
        const target = y < BOTTOM + 0.35 ? 1 : y > TOP - 0.45 ? 0 : blob.heat;
        blob.heat += (target - blob.heat) * dt * 0.8;
        const buoyancy = (blob.heat - 0.5) * 0.9;
        blob.velocity[1] += buoyancy * dt;
        blob.velocity[0] += Math.sin(time * 0.7 + blob.radius * 40) * 0.25 * dt;
        blob.velocity[2] += Math.cos(time * 0.6 + blob.radius * 27) * 0.25 * dt;
        for (let axis = 0; axis < 3; axis++) {
          blob.velocity[axis] = (blob.velocity[axis] ?? 0) * (1 - dt * 0.9);
        }
        let nx = x + blob.velocity[0] * dt;
        let ny = y + blob.velocity[1] * dt;
        let nz = z + blob.velocity[2] * dt;
        const limit = LAMP_RADIUS - blob.radius * 0.45;
        const radial = Math.hypot(nx, nz);
        if (radial > limit) {
          nx *= limit / radial;
          nz *= limit / radial;
        }
        if (ny < BOTTOM + 0.12 || ny > TOP - 0.12) {
          ny = Math.min(TOP - 0.12, Math.max(BOTTOM + 0.12, ny));
          blob.velocity[1] *= -0.2;
        }
        blob.position = [nx, ny, nz];
      }
    };

    return {
      update({ dt }) {
        const speed = Number(params["speed"]);
        time += dt * speed;
        const substeps = 2;
        for (let index = 0; index < substeps; index++) {
          step((dt * speed) / substeps);
        }
        const count = Number(params["count"]);
        uniforms.uThreshold.value = Number(params["threshold"]);
        uniforms.uCount.value = count;
        const showSection = params["section"] === true;
        uniforms.uCut.value = showSection ? 1 : 0;
        section.visible = showSection;
        const showCenters = params["centers"] === true;
        centers.visible = showCenters;
        for (const [index, blob] of blobs.entries()) {
          const [x, y, z] = blob.position;
          blobUniform[index]?.set(x, y, z, blob.radius);
          matrix.makeTranslation(x, y, z);
          centers.setMatrixAt(index, matrix);
          const influence = influences[index];
          if (influence) {
            influence.position.set(x, y, z);
            influence.scale.setScalar(blob.radius);
            influence.visible = showCenters && index < count;
          }
        }
        centers.count = count;
        centers.instanceMatrix.needsUpdate = true;
        glow.intensity = 2.6 + Math.sin(time * 3) * 0.3;
        context.readout("塊の数", `${count} 個`);
        context.readout("しきい値", uniforms.uThreshold.value.toFixed(2));
        context.caption(
          showSection
            ? "断面の色は場の合計値。黄色の線（合計 = しきい値）が表面になる。近い塊どうしは場が足し合わされ、間の値がしきい値を超えると橋がかかる。"
            : "各塊は中心から離れるほど弱まる影響を周りに広げる。場の合計がしきい値を超える範囲を表面にするので、近づくと融合し、離れるとちぎれる。"
        );
      },
      dispose() {
        influenceGeometry.dispose();
        influenceMaterial.dispose();
      },
    };
  },
};
