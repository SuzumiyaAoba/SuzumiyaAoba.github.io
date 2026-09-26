import {
  DataTexture,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  RGBAFormat,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";
import {
  arrow,
  clamp,
  hash2,
  marker,
  palette,
  perlin2,
  smoothstep,
  TAU,
} from "../../kit";
import type { DemoModule } from "../../types";

const SIZE = 256;
const ROWS = 6;
const COLUMNS = 3;

/** レンガの高さ（0〜1）。u, v は 0〜1 で繰り返す。 */
function brickHeight(u: number, v: number) {
  const row = Math.floor(v * ROWS);
  const shifted = u * COLUMNS + (row % 2) * 0.5;
  const fx = shifted - Math.floor(shifted);
  const fy = v * ROWS - row;
  const edge =
    Math.min(fx / COLUMNS, (1 - fx) / COLUMNS, fy / ROWS, (1 - fy) / ROWS) *
    ROWS;
  const bevel = smoothstep(0.03, 0.14, edge);
  const id = hash2(Math.floor(shifted), row);
  const rough =
    perlin2(u * 40, v * 40) * 0.06 + perlin2(u * 11 + id * 7, v * 11) * 0.08;
  return clamp(bevel * (0.85 + id * 0.15) + rough * bevel);
}

function buildMaps() {
  const normal = new Uint8Array(SIZE * SIZE * 4);
  const albedo = new Uint8Array(SIZE * SIZE * 4);
  const heights = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      heights[y * SIZE + x] = brickHeight(x / SIZE, y / SIZE);
    }
  }
  const at = (x: number, y: number) =>
    heights[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)] ?? 0;
  const strength = 7;
  const n = new Vector3();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const index = (y * SIZE + x) * 4;
      // 高さの傾きから、接空間の法線（z が表面の外向き）を作って RGB に詰める
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      n.set(-dx, -dy, 1).normalize();
      normal[index] = (n.x * 0.5 + 0.5) * 255;
      normal[index + 1] = (n.y * 0.5 + 0.5) * 255;
      normal[index + 2] = (n.z * 0.5 + 0.5) * 255;
      normal[index + 3] = 255;
      const h = at(x, y);
      const row = Math.floor((y / SIZE) * ROWS);
      const id = hash2(Math.floor((x / SIZE) * COLUMNS + (row % 2) * 0.5), row);
      const mortar = h < 0.3;
      albedo[index] = mortar ? 120 : 150 + id * 50;
      albedo[index + 1] = mortar ? 115 : 72 + id * 25;
      albedo[index + 2] = mortar ? 108 : 55 + id * 15;
      albedo[index + 3] = 255;
    }
  }
  const make = (data: Uint8Array) => {
    const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  };
  const albedoTexture = make(albedo);
  albedoTexture.colorSpace = SRGBColorSpace;
  return { normal: make(normal), albedo: albedoTexture };
}

const PANEL = 1.8;
const BALL_RADIUS = 0.55;

/** SphereGeometry と同じ式で、角度 (φ, θ) の球面上の点を返す。 */
const spherePoint = (phi: number, theta: number) =>
  new Vector3(
    -BALL_RADIUS * Math.cos(phi) * Math.sin(theta),
    BALL_RADIUS * Math.cos(theta),
    BALL_RADIUS * Math.sin(phi) * Math.sin(theta)
  );

export const demo: DemoModule = {
  alt: "同じレンガの凹凸を、ただの平面、法線マップを貼った平面、実際に頂点を凹凸させた高ポリゴンの面で並べて比べるデモ。低い角度から動く光を当てると、法線マップは頂点をまったく増やさずに、実際の凹凸に近い陰影を作ることが分かる。手前の球には、法線マップの向きを決める接空間の 3 軸（接線・従法線・法線）を表示している。",
  camera: { position: [0, 1.6, 6.4], target: [0, 1.2, 0] },
  controls: [
    {
      type: "range",
      key: "strength",
      label: "法線マップの強さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 1,
    },
    { type: "toggle", key: "orbit", label: "光を動かす", value: true },
    {
      type: "toggle",
      key: "tbn",
      label: "接空間の 3 軸（TBN）を表示",
      value: true,
    },
    {
      type: "toggle",
      key: "sidelight",
      label: "真横から光を当てる",
      value: false,
      hint: "法線マップは陰影だけなので、輪郭（シルエット）や自分の影は変わりません。",
    },
  ],
  legend: [
    { color: palette.coral, label: "T：接線（テクスチャの u 方向）" },
    { color: palette.lime, label: "B：従法線（v 方向）" },
    { color: palette.sky, label: "N：法線" },
  ],
  setup(context) {
    const { scene, params } = context;
    const maps = buildMaps();
    context.track(maps.normal);
    context.track(maps.albedo);
    const flat = new MeshStandardMaterial({
      map: maps.albedo,
      roughness: 0.85,
    });
    const mapped = new MeshStandardMaterial({
      map: maps.albedo,
      normalMap: maps.normal,
      roughness: 0.85,
    });
    const flatPanel = new Mesh(new PlaneGeometry(PANEL, PANEL), flat);
    const mappedPanel = new Mesh(new PlaneGeometry(PANEL, PANEL), mapped);
    // 実際に頂点を動かした高ポリゴンの面
    const segments = 200;
    const detailed = new PlaneGeometry(PANEL, PANEL, segments, segments);
    const position = detailed.getAttribute("position");
    const uv = detailed.getAttribute("uv");
    for (let index = 0; index < position.count; index++) {
      position.setZ(
        index,
        brickHeight(uv.getX(index) % 1, uv.getY(index) % 1) * 0.045
      );
    }
    detailed.computeVertexNormals();
    const realPanel = new Mesh(detailed, flat);
    const panels = [
      { mesh: flatPanel, title: "平面のみ", triangles: 2 },
      { mesh: mappedPanel, title: "平面 + 法線マップ", triangles: 2 },
      {
        mesh: realPanel,
        title: "実際の凹凸",
        triangles: segments * segments * 2,
      },
    ];
    for (const [index, panel] of panels.entries()) {
      panel.mesh.position.set((index - 1) * 2.1, 1.35, -0.6);
      panel.mesh.castShadow = true;
      panel.mesh.receiveShadow = true;
      const label = context.label(
        `${panel.title}（${panel.triangles.toLocaleString()} 三角形）`,
        {
          size: "md",
        }
      );
      label.position.set((index - 1) * 2.1, 2.5, -0.6);
      scene.add(panel.mesh, label);
    }

    const ball = new Mesh(new SphereGeometry(0.55, 96, 64), mapped);
    ball.position.set(0, 0.6, 1.1);
    ball.castShadow = true;
    scene.add(ball);

    // 球の上の数点に TBN を表示する
    const frames = [
      [0.1, 0.45],
      [0.3, 0.3],
      [0.55, 0.6],
      [0.8, 0.4],
    ].map(([u = 0, v = 0]) => {
      const phi = u * TAU;
      const theta = (1 - v) * Math.PI;
      const origin = spherePoint(phi, theta);
      const tangent = spherePoint(phi + 1e-3, theta)
        .sub(origin)
        .normalize();
      const bitangent = spherePoint(phi, theta - 1e-3)
        .sub(origin)
        .normalize();
      const normal = origin.clone().normalize();
      const at = origin.clone().add(ball.position);
      const t = arrow(palette.coral, {
        radius: 0.012,
        headLength: 0.07,
        emissive: 0.8,
      });
      const b = arrow(palette.lime, {
        radius: 0.012,
        headLength: 0.07,
        emissive: 0.8,
      });
      const n = arrow(palette.sky, {
        radius: 0.012,
        headLength: 0.07,
        emissive: 0.8,
      });
      t.set(at, tangent.multiplyScalar(0.28));
      b.set(at, bitangent.multiplyScalar(0.28));
      n.set(at, normal.multiplyScalar(0.28));
      const dot = marker("#ffffff", 0.02);
      dot.position.copy(at);
      scene.add(t, b, n, dot);
      return [t, b, n, dot];
    });

    const light = new PointLight("#ffe2b8", 6, 7, 1.6);
    light.castShadow = true;
    const bulb = marker("#ffe2b8", 0.05);
    scene.add(light, bulb);
    let angle = 0;
    const scale = new Vector2();

    return {
      update({ dt }) {
        if (params["orbit"] === true) {
          angle += dt * 0.7;
        }
        const strength = Number(params["strength"]);
        scale.set(strength, strength);
        mapped.normalScale.copy(scale);
        if (params["sidelight"] === true) {
          light.position.set(3.4, 1.35, -0.35);
        } else {
          light.position.set(
            Math.cos(angle) * 3,
            1.35 + Math.sin(angle * 1.3) * 0.9,
            0.05
          );
        }
        bulb.position.copy(light.position);
        for (const frame of frames) {
          for (const item of frame) {
            item.visible = params["tbn"] === true;
          }
        }
        context.readout("法線マップの強さ", strength.toFixed(2));
        context.caption(
          params["sidelight"] === true
            ? "真横から見ると、法線マップの面はあくまで平らなまま。陰影は変わっても、輪郭や凹凸が落とす影は再現できない。"
            : "法線マップは、画素ごとに「表面がどちらを向いているか」を画像で与える。頂点は 2 つの三角形のままなのに、光の動きに合わせて凹凸の陰影が変わる。"
        );
      },
    };
  },
};
