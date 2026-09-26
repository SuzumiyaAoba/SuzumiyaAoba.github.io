import {
  BoxGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  SphereGeometry,
  Vector3,
} from "three";
import { atmosphereSky, sunlightColor } from "../../atmosphere";
import { palette, standard } from "../../kit";
import type { DemoModule } from "../../types";

const DEGREE = Math.PI / 180;

export const demo: DemoModule = {
  alt: "空気の分子による光の散乱（レイリー散乱）で空の色を計算するデモ。波長の短い青い光ほど強く散乱されるので、昼の空は青い。太陽が低くなると、光は長い距離の大気を通るうちに青が散らされて失われ、残った赤や橙が夕焼けになる。地上の白い建物も、届く日の光の色に合わせて染まる。",
  camera: { position: [0, 1.3, 6], target: [0, 2.2, -4], fov: 55 },
  studio: false,
  controls: [
    {
      type: "range",
      key: "elevation",
      label: "太陽の高さ",
      min: -4,
      max: 70,
      step: 0.5,
      value: 8,
      format: (value) => `${value}°`,
    },
    { type: "toggle", key: "cycle", label: "一日を再生", value: false },
    {
      type: "range",
      key: "air",
      label: "空気の量（倍率）",
      min: 0,
      max: 4,
      step: 0.05,
      value: 1,
    },
    {
      type: "toggle",
      key: "flat",
      label: "波長による違いをなくす",
      value: false,
      hint: "全色を同じだけ散乱させると、空は青くならず白っぽくなります。",
    },
    {
      type: "select",
      key: "view",
      label: "視点",
      value: "ground",
      options: [
        { value: "ground", label: "地上" },
        { value: "space", label: "宇宙" },
      ],
    },
  ],
  legend: [{ color: palette.sky, label: "青は赤の約 5.7 倍散乱される" }],
  setup(context) {
    const { scene, params } = context;
    const sky = atmosphereSky(context);
    sky.uniforms.uMieScale.value = 0.35;
    const sunLight = new DirectionalLight("#ffffff", 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -8;
    sunLight.shadow.camera.right = 8;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -8;
    const skyLight = new HemisphereLight("#88aaff", "#202018", 0.6);
    scene.add(sunLight, skyLight);

    const ground = new Mesh(
      new CircleGeometry(40, 64),
      standard("#3c4a3a", { roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    const white = standard("#f2f0ea", { roughness: 0.6 });
    const house = new Mesh(new BoxGeometry(1.4, 1, 1.2), white);
    house.position.set(-1.2, 0.5, -0.6);
    const roof = new Mesh(
      new ConeGeometry(1.1, 0.7, 4),
      standard("#b9b2a6", { roughness: 0.7 })
    );
    roof.position.set(-1.2, 1.35, -0.6);
    roof.rotation.y = Math.PI / 4;
    const statue = new Mesh(new SphereGeometry(0.55, 64, 32), white);
    statue.position.set(1.2, 0.55, 0);
    const tower = new Mesh(new BoxGeometry(0.5, 2.4, 0.5), white);
    tower.position.set(2.6, 1.2, -2);
    const groundObjects = [ground, house, roof, statue, tower];
    for (const mesh of groundObjects) {
      mesh.castShadow = true;
      scene.add(mesh);
    }
    const sun = new Vector3();
    const color = new Color();
    let dayTime = 0;

    return {
      update({ dt }) {
        let elevation = Number(params["elevation"]);
        if (params["cycle"] === true) {
          dayTime += dt * 0.08;
          elevation = -4 + (Math.sin(dayTime) * 0.5 + 0.5) * 74;
        }
        const azimuth = 62 * DEGREE;
        sun.set(
          Math.sin(azimuth) * Math.cos(elevation * DEGREE),
          Math.sin(elevation * DEGREE),
          -Math.cos(azimuth) * Math.cos(elevation * DEGREE)
        );
        const air = Number(params["air"]);
        const flat = params["flat"] === true;
        const space = params["view"] === "space";
        // 宇宙からは、昼と夜の境目が見えるよう横から照らす
        sky.uniforms.uSun.value.copy(
          space ? new Vector3(0.85, 0.25, 0.45).normalize() : sun
        );
        sky.uniforms.uRayleighScale.value = air;
        sky.uniforms.uFlat.value = flat ? 1 : 0;
        sky.uniforms.uSpace.value = space ? 1 : 0;
        sky.uniforms.uExposure.value = space ? 0.7 : 1;
        for (const mesh of groundObjects) {
          mesh.visible = !space;
        }
        sunlightColor(sun, air, 0.35, color, flat);
        sunLight.color.copy(color);
        sunLight.intensity = elevation > -1 ? 3.2 : 0;
        sunLight.position.copy(sun).multiplyScalar(12);
        skyLight.intensity =
          0.35 + 0.5 * Math.max(0, Math.sin(elevation * DEGREE)) ** 0.5;
        context.readout("太陽の高さ", `${elevation.toFixed(1)}°`);
        context.readout(
          "地上に届く日光（R/G/B）",
          [color.r, color.g, color.b]
            .map((value) => `${Math.round(value * 100)}%`)
            .join(" / ")
        );
        context.caption(
          space
            ? "宇宙から見ると、大気が薄い青い層として地球を包んでいるのが分かる。昼と夜の境目では、長い距離を通った光が赤く染まる。"
            : elevation < 12
              ? "太陽が低いと、光は大気の中を長く通る。その間に青い光は横へ散らされて失われ、目や建物に届くのは赤や橙の光になる（夕焼け）。"
              : "空気の分子は、波長の短い青い光ほど強く散乱する（波長の 4 乗に反比例）。空のどこを見ても、散乱された青い光が目に入るので空は青い。"
        );
      },
    };
  },
};
