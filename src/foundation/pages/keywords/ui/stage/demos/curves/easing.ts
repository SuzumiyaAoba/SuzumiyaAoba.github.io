import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  OctahedronGeometry,
  Vector3,
} from "three";
import { palette, polyline, standard } from "../../kit";
import { hudGraph } from "../../widgets";
import type { DemoModule } from "../../types";

const c1 = 1.70158;
const c3 = c1 + 1;
const bounceOut = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  }
  if (t < 2 / d1) {
    const x = t - 1.5 / d1;
    return n1 * x * x + 0.75;
  }
  if (t < 2.5 / d1) {
    const x = t - 2.25 / d1;
    return n1 * x * x + 0.9375;
  }
  const x = t - 2.625 / d1;
  return n1 * x * x + 0.984375;
};

/** easings.net と同じ定義。 */
const easings = {
  linear: (t: number) => t,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  outBack: (t: number) => 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2,
  outBounce: bounceOut,
  outElastic: (t: number) =>
    t === 0 || t === 1
      ? t
      : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  inBack: (t: number) => c3 * t ** 3 - c1 * t ** 2,
} as const;
type EasingKey = keyof typeof easings;
const isEasing = (value: unknown): value is EasingKey =>
  typeof value === "string" && Object.hasOwn(easings, value);

export const demo: DemoModule = {
  alt: "同じ時間で同じ距離を動くのに、イージングの種類によって手触りが変わるデモ。滑るブロック、拡大して現れるパネル、回転する宝石に同じイージングがかかり、半透明の影は線形のまま動く。",
  camera: { position: [0.4, 4.2, 8.6], target: [0, 1.2, 0] },
  controls: [
    {
      type: "select",
      key: "easing",
      label: "イージング",
      value: "outBack",
      options: [
        { value: "linear", label: "Linear" },
        { value: "inOutCubic", label: "InOut Cubic" },
        { value: "outBack", label: "Out Back" },
        { value: "inBack", label: "In Back" },
        { value: "outBounce", label: "Out Bounce" },
        { value: "outElastic", label: "Out Elastic" },
      ],
    },
    {
      type: "range",
      key: "duration",
      label: "所要時間",
      min: 0.3,
      max: 2.5,
      step: 0.05,
      value: 1,
      format: (value) => `${value.toFixed(2)} 秒`,
    },
    {
      type: "toggle",
      key: "ghost",
      label: "線形の動き（半透明）を重ねる",
      value: true,
    },
  ],
  legend: [
    { color: palette.cyan, label: "イージングあり" },
    { color: palette.muted, label: "線形（比較）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const rail = polyline(
      [new Vector3(-4, 0.02, 1.4), new Vector3(1.2, 0.02, 1.4)],
      palette.muted,
      {
        width: 1.5,
        dashed: true,
        dashSize: 0.15,
        gapSize: 0.1,
      }
    );
    scene.add(rail);
    const block = new Mesh(
      new BoxGeometry(0.7, 0.7, 0.7),
      standard(palette.cyan, { roughness: 0.35 })
    );
    const ghostBlock = new Mesh(
      new BoxGeometry(0.7, 0.7, 0.7),
      standard(palette.muted)
    );
    ghostBlock.material.transparent = true;
    ghostBlock.material.opacity = 0.25;
    block.castShadow = true;

    const panel = new Mesh(
      new BoxGeometry(2.2, 1.3, 0.08),
      standard("#1e2b3d", { roughness: 0.3, metalness: 0.2 })
    );
    const panelFace = new Mesh(
      new BoxGeometry(1.9, 0.18, 0.1),
      standard(palette.amber, { emissive: 0.6 })
    );
    panelFace.position.set(0, 0.35, 0.02);
    const button = new Mesh(
      new BoxGeometry(0.9, 0.28, 0.1),
      standard(palette.cyan, { emissive: 0.5 })
    );
    button.position.set(0, -0.3, 0.02);
    panel.add(panelFace, button);
    panel.position.set(3.2, 1.9, 0);
    panel.castShadow = true;

    const pedestal = new Mesh(
      new CylinderGeometry(0.5, 0.6, 0.3, 32),
      standard("#344155")
    );
    pedestal.position.set(-2.6, 0.15, -1);
    const gem = new Mesh(
      new OctahedronGeometry(0.45),
      standard(palette.violet, {
        roughness: 0.15,
        metalness: 0.2,
        emissive: 0.3,
      })
    );
    gem.castShadow = true;
    const ghostGem = new Mesh(
      new OctahedronGeometry(0.45),
      standard(palette.muted)
    );
    ghostGem.material.transparent = true;
    ghostGem.material.opacity = 0.2;
    ghostGem.material.wireframe = true;
    gem.position.set(-2.6, 1.1, -1);
    ghostGem.position.copy(gem.position);
    scene.add(block, ghostBlock, panel, pedestal, gem, ghostGem);

    const labels = [
      [context.label("位置", { tone: "muted" }), new Vector3(-4, 1.1, 1.4)],
      [context.label("拡大", { tone: "muted" }), new Vector3(3.2, 3, 0)],
      [context.label("回転", { tone: "muted" }), new Vector3(-2.6, 2, -1)],
    ] as const;
    for (const [label, position] of labels) {
      label.position.copy(position);
      scene.add(label);
    }

    const graph = hudGraph(context, {
      title: "",
      min: -0.4,
      max: 1.4,
      xLabel: "t",
    });
    let current: EasingKey | undefined;
    let clock = 0;

    return {
      update({ dt }) {
        const key = isEasing(params["easing"]) ? params["easing"] : "outBack";
        if (key !== current) {
          current = key;
          clock = 0;
          graph.setTitle(`${key} の値`);
          graph.setSeries([
            { fn: easings[key], color: palette.cyan, label: key },
            {
              fn: (t) => t,
              color: palette.muted,
              label: "linear",
              dashed: true,
            },
          ]);
        }
        const duration = Number(params["duration"]);
        clock += dt;
        const cycle = duration + 1.1;
        const local = clock % cycle;
        const t = Math.min(1, local / duration);
        const eased = easings[key](t);

        block.position.set(-4 + eased * 5.2, 0.35, 1.4);
        ghostBlock.position.set(-4 + t * 5.2, 0.35, 1.4);
        const scale = Math.max(0.001, eased);
        panel.scale.set(scale, scale, 1);
        gem.rotation.y = eased * Math.PI;
        ghostGem.rotation.y = t * Math.PI;
        const ghost = params["ghost"] === true;
        ghostBlock.visible = ghost;
        ghostGem.visible = ghost;
        graph.setMarker(t);

        context.readout("経過 t", t.toFixed(2));
        context.readout("イージング後", eased.toFixed(3));
        context.caption(
          key === "outBack"
            ? "Out Back：一度目標を少し行き過ぎてから戻る。UI のポップアップに勢いが出る。"
            : key === "inBack"
              ? "In Back：動き出す前に少し逆へ引く。溜めを作る『予備動作』の表現。"
              : key === "outBounce"
                ? "Out Bounce：着地して何度か跳ねる。落下したアイテムやコインに。"
                : key === "outElastic"
                  ? "Out Elastic：ばねのように振動しながら収まる。強調したい通知やアイコンに。"
                  : key === "inOutCubic"
                    ? "InOut Cubic：ゆっくり出てゆっくり止まる。カメラ移動や画面遷移の基本。"
                    : "Linear：等速。機械的で、始まりと終わりが唐突に感じられる。"
        );
      },
    };
  },
};
