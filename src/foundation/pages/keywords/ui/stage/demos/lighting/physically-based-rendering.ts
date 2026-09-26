import {
  CircleGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { cookTorrance, lobeMesh } from "../../brdf";
import { arrow, palette, standard } from "../../kit";
import type { DemoModule } from "../../types";

const ROUGHNESS = [0.05, 0.25, 0.5, 0.75, 1] as const;
const LOBE_CENTER = new Vector3(2.9, 0.02, 0);
const DEGREE = Math.PI / 180;

export const demo: DemoModule = {
  alt: "粗さと金属度を変えた球を同じ照明の下に並べた PBR のデモ。右側には、ある向きから光が当たったときに、表面がどの方向へどれだけ光を返すか（BRDF）を立体の形で表示している。粗いほど反射は広く弱く、滑らかなほど鏡のような向きに鋭く集まる。金属は拡散反射を持たず、反射に自分の色が付く。",
  camera: { position: [0.2, 3.2, 8.2], target: [0.2, 0.6, 0] },
  controls: [
    {
      type: "range",
      key: "roughness",
      label: "粗さ（右の BRDF）",
      min: 0.05,
      max: 1,
      step: 0.01,
      value: 0.35,
    },
    { type: "toggle", key: "metal", label: "金属", value: false },
    {
      type: "range",
      key: "incidence",
      label: "光の入射角",
      min: 0,
      max: 80,
      step: 1,
      value: 45,
      format: (value) => `${value}°`,
    },
    {
      type: "select",
      key: "part",
      label: "BRDF の成分",
      value: "both",
      options: [
        { value: "both", label: "合計" },
        { value: "diffuse", label: "拡散のみ" },
        { value: "specular", label: "鏡面のみ" },
      ],
    },
    {
      type: "toggle",
      key: "ibl",
      label: "周囲の映り込み（環境光）",
      value: true,
    },
  ],
  legend: [
    { color: palette.amber, label: "入射する光" },
    { color: palette.lime, label: "選んだ設定に対応する球" },
  ],
  setup(context) {
    const { scene, params } = context;
    const balls: { mesh: Mesh; roughness: number; metal: boolean }[] = [];
    const geometry = new SphereGeometry(0.4, 64, 32);
    for (const [row, metal] of [false, true].entries()) {
      for (const [column, roughness] of ROUGHNESS.entries()) {
        const mesh = new Mesh(
          geometry,
          new MeshStandardMaterial({
            color: metal ? "#e6b86a" : "#d4553a",
            roughness,
            metalness: metal ? 1 : 0,
          })
        );
        mesh.position.set(-4.3 + column * 1, 0.4, row === 0 ? 0.65 : -0.55);
        mesh.castShadow = true;
        scene.add(mesh);
        balls.push({ mesh, roughness, metal });
      }
    }
    for (const [column, roughness] of ROUGHNESS.entries()) {
      const label = context.label(`粗さ ${roughness}`, { tone: "muted" });
      label.position.set(-4.3 + column * 1, 1.15, -0.55);
      scene.add(label);
    }
    const rowLabels = [
      { text: "非金属", z: 0.65 },
      { text: "金属", z: -0.55 },
    ];
    for (const { text, z } of rowLabels) {
      const label = context.label(text, { size: "md" });
      label.position.set(-5.3, 0.4, z);
      scene.add(label);
    }
    const marker = new Mesh(
      new TorusGeometry(0.5, 0.025, 12, 64),
      standard(palette.lime, { emissive: 0.8 })
    );
    marker.rotation.x = Math.PI / 2;
    scene.add(marker);

    // BRDF の立体表示
    const patch = new Mesh(
      new CircleGeometry(1.5, 64),
      standard("#2a3342", { roughness: 0.8 })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.copy(LOBE_CENTER);
    const lobe = lobeMesh({ radius: 1.35 });
    lobe.position.copy(LOBE_CENTER).setY(0.03);
    const incoming = arrow(palette.amber, { radius: 0.03, emissive: 0.8 });
    const mirror = arrow(palette.sky, { radius: 0.015, emissive: 0.5 });
    const lobeLabel = context.label("BRDF：反射の分布", { size: "md" });
    lobeLabel.position.copy(LOBE_CENTER).add(new Vector3(0, 1.8, 0));
    scene.add(patch, lobe, incoming, mirror, lobeLabel);
    const normal = new Vector3(0, 1, 0);
    const light = new Vector3();
    const start = new Vector3();
    let signature = "";

    return {
      update() {
        const roughness = Number(params["roughness"]);
        const metal = params["metal"] === true;
        const incidence = Number(params["incidence"]) * DEGREE;
        const part = String(params["part"]);
        scene.environmentIntensity = params["ibl"] === true ? 0.9 : 0;
        light.set(-Math.sin(incidence), Math.cos(incidence), 0);
        const key = [roughness, metal, incidence, part].join(",");
        if (key !== signature) {
          signature = key;
          const peak = lobe.update(
            (view) =>
              cookTorrance(normal, light, view, {
                roughness,
                metalness: metal ? 1 : 0,
                albedo: 0.8,
                diffuse: part !== "specular",
                specular: part !== "diffuse",
              }) * light.y
          );
          context.readout("反射の最大値", peak.toFixed(2));
        }
        start.copy(LOBE_CENTER).addScaledVector(light, 1.9);
        incoming.set(start, light.clone().multiplyScalar(-1.85));
        mirror.set(
          LOBE_CENTER.clone().setY(0.03),
          new Vector3(
            Math.sin(incidence),
            Math.cos(incidence),
            0
          ).multiplyScalar(1.7)
        );
        // 選んだ設定に最も近い球に印を付ける
        let [nearest] = balls;
        for (const ball of balls) {
          if (
            ball.metal === metal &&
            (!nearest ||
              nearest.metal !== metal ||
              Math.abs(ball.roughness - roughness) <
                Math.abs(nearest.roughness - roughness))
          ) {
            nearest = ball;
          }
        }
        if (nearest) {
          marker.position.copy(nearest.mesh.position).setY(0.03);
        }
        context.readout("粗さ", roughness.toFixed(2));
        context.readout("金属度", metal ? "1（金属）" : "0（非金属）");
        context.caption(
          metal
            ? "金属は光を内部に通さないので拡散反射がなく、鏡面反射に金属自身の色が付く。粗いほど反射の山は低く広がる。"
            : "非金属は、表面で数 % を鏡面反射し、残りを内部で散らして色の付いた拡散反射として返す。どちらも入ってきた光より多くは返さない（エネルギー保存）。"
        );
      },
    };
  },
};
