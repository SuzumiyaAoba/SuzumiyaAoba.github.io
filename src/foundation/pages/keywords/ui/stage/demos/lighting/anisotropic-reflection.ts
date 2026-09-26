import {
  CircleGeometry,
  CylinderGeometry,
  DataTexture,
  LinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  PointLight,
  RGBAFormat,
  SphereGeometry,
  TorusGeometry,
} from "three";
import { marker, palette, perlin2, standard } from "../../kit";
import type { DemoModule } from "../../types";

const SIZE = 256;

/** 異方性の向き（接空間の RG）と強さ（B）を書いたテクスチャ。 */
function directionMap(mode: string) {
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = (x + 0.5) / SIZE - 0.5;
      const v = (y + 0.5) / SIZE - 0.5;
      const length = Math.hypot(u, v) || 1;
      let dx = 1;
      let dy = 0;
      if (mode === "circular") {
        dx = -v / length;
        dy = u / length;
      } else if (mode === "radial") {
        dx = u / length;
        dy = v / length;
      }
      const index = (y * SIZE + x) * 4;
      data[index] = (dx * 0.5 + 0.5) * 255;
      data[index + 1] = (dy * 0.5 + 0.5) * 255;
      data[index + 2] = 255;
      data[index + 3] = 255;
    }
  }
  const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** ヘアラインの細かな筋（色のわずかなむら）。 */
function brushedColor(mode: string) {
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = (x + 0.5) / SIZE - 0.5;
      const v = (y + 0.5) / SIZE - 0.5;
      const along =
        mode === "circular"
          ? Math.hypot(u, v) * 400
          : mode === "radial"
            ? Math.atan2(v, u) * 60
            : v * 400;
      const streak =
        perlin2(along, mode === "linear" ? u * 3 : 0.5) * 0.5 + 0.5;
      const value = 120 + streak * 60;
      const index = (y * SIZE + x) * 4;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value * 1.03;
      data[index + 3] = 255;
    }
  }
  const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export const demo: DemoModule = {
  alt: "ヘアライン加工の金属のように、細かな筋が一方向にそろった表面では、ハイライトが筋と直角の向きに長く伸びる異方性反射のデモ。円盤は筋を円周方向にそろえた鍋底や時計の文字盤、手前の棒は筋が長さ方向にそろった金属棒。等方性（普通の金属）の球と比べると違いがよく分かる。",
  camera: { position: [0, 3.6, 5.2], target: [0, 0.7, 0] },
  bloom: { strength: 0.35, radius: 0.3, threshold: 0.95 },
  controls: [
    {
      type: "range",
      key: "anisotropy",
      label: "異方性の強さ",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.85,
      hint: "0 にすると普通の（等方性の）金属になります。",
    },
    {
      type: "select",
      key: "pattern",
      label: "円盤の筋の向き",
      value: "circular",
      options: [
        { value: "circular", label: "円周方向（鍋底）" },
        { value: "radial", label: "放射方向" },
        { value: "linear", label: "一方向" },
      ],
    },
    {
      type: "range",
      key: "roughness",
      label: "粗さ",
      min: 0.1,
      max: 0.8,
      step: 0.01,
      value: 0.35,
    },
    { type: "toggle", key: "orbit", label: "光を動かす", value: true },
  ],
  legend: [{ color: palette.amber, label: "点光源" }],
  setup(context) {
    const { scene, params } = context;
    scene.environmentIntensity = 0.12;
    const maps = new Map<
      string,
      { direction: DataTexture; color: DataTexture }
    >();
    const mapsFor = (pattern: string) => {
      let entry = maps.get(pattern);
      if (!entry) {
        entry = {
          direction: context.track(directionMap(pattern)),
          color: context.track(brushedColor(pattern)),
        };
        maps.set(pattern, entry);
      }
      return entry;
    };
    const initial = mapsFor("circular");
    const discMaterial = new MeshPhysicalMaterial({
      color: "#e4e6ea",
      metalness: 1,
      roughness: 0.35,
      anisotropy: 0.85,
      anisotropyMap: initial.direction,
      map: initial.color,
    });
    const disc = new Mesh(new CircleGeometry(1.25, 128), discMaterial);
    disc.rotation.x = -Math.PI / 2 + 0.35;
    disc.position.set(-0.9, 0.95, -0.2);
    const rim = new Mesh(
      new TorusGeometry(1.27, 0.05, 16, 128),
      standard("#3a4150", { metalness: 0.8, roughness: 0.3 })
    );
    rim.rotation.copy(disc.rotation);
    rim.position.copy(disc.position);
    scene.add(disc, rim);

    const rodMaterial = new MeshPhysicalMaterial({
      color: "#b89a62",
      metalness: 1,
      roughness: 0.35,
      anisotropy: 0.85,
      anisotropyRotation: Math.PI / 2,
    });
    const rod = new Mesh(
      new CylinderGeometry(0.22, 0.22, 2.6, 96, 1),
      rodMaterial
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0.3, 0.25, 1.25);
    rod.castShadow = true;
    const isotropic = new Mesh(
      new SphereGeometry(0.55, 96, 64),
      new MeshPhysicalMaterial({
        color: "#e4e6ea",
        metalness: 1,
        roughness: 0.35,
      })
    );
    isotropic.position.set(1.9, 0.55, -0.1);
    isotropic.castShadow = true;
    scene.add(rod, isotropic);
    const labels = [
      { text: "異方性：円盤", at: [-2.75, 1.1, -0.2] },
      { text: "異方性：棒", at: [0.3, 0.75, 1.25] },
      { text: "等方性（比較）", at: [1.9, 1.35, -0.1] },
    ] as const;
    for (const { text, at } of labels) {
      const label = context.label(text, { size: "md" });
      label.position.set(at[0], at[1], at[2]);
      scene.add(label);
    }

    const lights = [0, Math.PI].map((phase) => {
      const light = new PointLight("#fff1dc", 2.2, 8, 1.6);
      const bulb = marker(palette.amber, 0.05);
      scene.add(light, bulb);
      return { light, bulb, phase };
    });
    let angle = 0;
    let pattern = "circular";

    return {
      update({ dt }) {
        if (params["orbit"] === true) {
          angle += dt * 0.6;
        }
        const strength = Number(params["anisotropy"]);
        const roughness = Number(params["roughness"]);
        for (const material of [discMaterial, rodMaterial]) {
          material.anisotropy = strength;
          material.roughness = roughness;
        }
        const isotropicMaterial = isotropic.material;
        isotropicMaterial.roughness = roughness;
        const next = String(params["pattern"]);
        if (next !== pattern) {
          pattern = next;
          const entry = mapsFor(pattern);
          discMaterial.anisotropyMap = entry.direction;
          discMaterial.map = entry.color;
          discMaterial.needsUpdate = true;
        }
        for (const { light, bulb, phase } of lights) {
          light.position.set(
            Math.cos(angle + phase) * 2.4,
            2.2,
            Math.sin(angle + phase) * 1.6 + 0.4
          );
          bulb.position.copy(light.position);
        }
        context.readout("異方性", strength.toFixed(2));
        context.caption(
          strength < 0.05
            ? "異方性が 0 だと、ハイライトは丸く広がる普通の金属になる。"
            : "筋に沿った方向では表面が滑らか、筋と直角な方向では粗い。そのためハイライトは筋と直角の向きに細長く伸びる。円周方向の筋なら、光の点が放射状の帯になる。"
        );
      },
    };
  },
};
