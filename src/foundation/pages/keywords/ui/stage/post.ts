import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DepthTexture,
  Group,
  HalfFloatType,
  Mesh,
  MeshNormalMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  Vector2,
  WebGLRenderTarget,
} from "three";
import type { Camera, Object3D, ShaderMaterial, WebGLRenderer } from "three";
import { standard } from "./kit";
import type { DemoContext } from "./types";

/** 全画面の四角形に描くときの頂点シェーダー。 */
export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** 全画面パス：マテリアルを 1 枚の四角形に描く。 */
export function fullscreenPass(context: DemoContext, material: ShaderMaterial) {
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  scene.add(mesh);
  context.track(mesh.geometry);
  context.track(material);
  return {
    material,
    render(renderer: WebGLRenderer, target: WebGLRenderTarget | null) {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    },
  };
}

/** 画面サイズに追従するレンダーターゲット（scale で縮小解像度にできる）。 */
export function screenTarget(
  context: DemoContext,
  options: { scale?: number; depth?: boolean; float?: boolean } = {}
) {
  const target = context.track(
    new WebGLRenderTarget(
      1,
      1,
      options.float === false ? {} : { type: HalfFloatType }
    )
  );
  if (options.depth) {
    target.depthTexture = new DepthTexture(1, 1);
  }
  const size = new Vector2();
  const scale = options.scale ?? 1;
  context.onResize(() => {
    context.renderer.getDrawingBufferSize(size);
    target.setSize(
      Math.max(1, Math.floor(size.x * scale)),
      Math.max(1, Math.floor(size.y * scale))
    );
  });
  return target;
}

const normalMaterial = new MeshNormalMaterial();
const clearColor = new Color();

/** ビュー空間の法線を描く（SSAO、輪郭検出、SSR 用）。 */
export function renderNormals(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  target: WebGLRenderTarget
) {
  const { background } = scene;
  renderer.getClearColor(clearColor);
  const clearAlpha = renderer.getClearAlpha();
  scene.background = null;
  scene.overrideMaterial = normalMaterial;
  renderer.setRenderTarget(target);
  renderer.setClearColor("#8080ff", 1);
  renderer.clear();
  renderer.render(scene, camera);
  scene.overrideMaterial = null;
  scene.background = background;
  renderer.setClearColor(clearColor, clearAlpha);
}

const neon = (color: string, strength: number) =>
  new MeshStandardMaterial({
    color: "#111111",
    emissive: new Color(color),
    emissiveIntensity: strength,
    roughness: 0.4,
  });

/**
 * ポストプロセスの効果を見せるための夜の広場。
 * 光る看板（ブルーム用）、金属の像、並んだ柱（奥行き）、回るドローン（動き）を含む。
 */
export function showcaseScene(context: DemoContext) {
  const { scene } = context;
  const root = new Group();
  scene.add(root);
  const floor = new Mesh(
    new PlaneGeometry(40, 40),
    standard("#26272b", { roughness: 0.62, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  const neonMaterials = [
    neon("#3fd6ff", 4),
    neon("#ff4fa8", 4),
    neon("#ffb347", 3.5),
  ];
  const concrete = standard("#6b7280", { roughness: 0.85 });
  // 柱の列（奥行き）
  for (let row = 0; row < 2; row++) {
    for (let index = 0; index < 6; index++) {
      const z = -2 - index * 3.2;
      const x = row === 0 ? -3.4 : 3.4;
      const pillar = new Mesh(new BoxGeometry(0.6, 4.2, 0.6), concrete);
      pillar.position.set(x, 2.1, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      const strip = new Mesh(
        new BoxGeometry(0.08, 3.4, 0.08),
        neonMaterials[(index + row) % 2] ?? concrete
      );
      strip.position.set(x + (row === 0 ? 0.34 : -0.34), 2.1, z);
      root.add(pillar, strip);
    }
  }
  // 奥の看板
  const sign = new Mesh(
    new BoxGeometry(4.2, 0.9, 0.2),
    neonMaterials[2] ?? concrete
  );
  sign.position.set(0, 4.6, -18);
  const ring = new Mesh(
    new TorusGeometry(1.1, 0.07, 16, 96),
    neonMaterials[0] ?? concrete
  );
  ring.position.set(0, 2.2, -12);
  root.add(sign, ring);
  // 中央の像
  const pedestal = new Mesh(
    new CylinderGeometry(0.9, 1, 0.5, 48),
    standard("#2b303b", { roughness: 0.5 })
  );
  pedestal.position.set(0, 0.25, -1.5);
  const statue = new Mesh(
    new TorusKnotGeometry(0.55, 0.18, 200, 32),
    standard("#e8b86a", { metalness: 1, roughness: 0.22 })
  );
  statue.position.set(0, 1.45, -1.5);
  statue.castShadow = true;
  // 手前の小物
  const spheres = [
    { color: "#f2efe8", x: -1.8, z: 0.8, r: 0.45 },
    { color: "#d6453a", x: 1.9, z: 0.4, r: 0.55 },
    { color: "#4a7fd6", x: 1.1, z: 1.8, r: 0.3 },
  ].map(({ color, x, z, r }) => {
    const mesh = new Mesh(
      new SphereGeometry(r, 48, 32),
      standard(color, { roughness: 0.35 })
    );
    mesh.position.set(x, r, z);
    mesh.castShadow = true;
    return mesh;
  });
  const crate = new Mesh(
    new BoxGeometry(0.9, 0.9, 0.9),
    standard("#8a6a45", { roughness: 0.8 })
  );
  crate.position.set(-2.4, 0.45, -1.6);
  crate.rotation.y = 0.4;
  crate.castShadow = true;
  root.add(pedestal, statue, crate, ...spheres);
  // 回るドローン（動きのある物体）
  const drone = new Group();
  const body = new Mesh(
    new SphereGeometry(0.22, 32, 16),
    standard("#d9dde5", { metalness: 0.6, roughness: 0.3 })
  );
  const halo = new Mesh(
    new TorusGeometry(0.34, 0.035, 12, 48),
    neonMaterials[1] ?? concrete
  );
  halo.rotation.x = Math.PI / 2;
  drone.add(body, halo);
  root.add(drone);
  const lamp = new PointLight("#ffd29a", 12, 12, 1.6);
  lamp.position.set(0, 3.5, 1);
  root.add(lamp);
  const update = (time: number, speed = 1) => {
    statue.rotation.y = time * 0.4;
    const angle = time * 1.6 * speed;
    drone.position.set(
      Math.cos(angle) * 2.6,
      1.6 + Math.sin(angle * 2) * 0.3,
      -1.5 + Math.sin(angle) * 2.2
    );
  };
  return { root, update, drone, statue, neonMaterials, floor } satisfies {
    root: Object3D;
    update: (time: number, speed?: number) => void;
    drone: Object3D;
    statue: Object3D;
    neonMaterials: MeshStandardMaterial[];
    floor: Mesh;
  };
}
