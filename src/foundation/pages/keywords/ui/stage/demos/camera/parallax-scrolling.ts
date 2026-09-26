import {
  CircleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  Vector2,
} from "three";
import { fbm2, palette, TAU } from "../../kit";
import { courseView, Player, playerView } from "../../platformer";
import type { DemoModule } from "../../types";

/** 背景 1 枚の横幅。この幅でくり返し並べる。 */
const TILE = 40;
const CAMERA_DISTANCE = 16;
const CAMERA_HEIGHT = 3;
const SKY_DEPTH = 1500;
const GROUND: { x: number; y: number; w: number; h: number }[] = [
  { x: -20, y: -3, w: 100_000, h: 3 },
];

type LayerSpec = {
  name: string;
  factor: number;
  color: string;
  base: number;
  amplitude: number;
  roughness: number;
  kind: "hills" | "forest" | "ground" | "grass";
};

/** 奥から手前へ。factor はカメラに対して動く割合（1 でプレイヤーと同じ）。 */
const LAYERS: readonly LayerSpec[] = [
  {
    name: "遠くの山",
    factor: 0.08,
    color: "#8fb0c9",
    base: 1.5,
    amplitude: 5,
    roughness: 0.6,
    kind: "hills",
  },
  {
    name: "丘",
    factor: 0.25,
    color: "#5f8aa6",
    base: 0.5,
    amplitude: 3,
    roughness: 1.2,
    kind: "hills",
  },
  {
    name: "森",
    factor: 0.55,
    color: "#35607a",
    base: 0.6,
    amplitude: 1.5,
    roughness: 2.5,
    kind: "forest",
  },
  {
    name: "地面の小石",
    factor: 1,
    color: "#4a3a2e",
    base: 0,
    amplitude: 0.25,
    roughness: 6,
    kind: "ground",
  },
  {
    name: "手前の草",
    factor: 1.5,
    color: "#1b2a22",
    base: -1.5,
    amplitude: 1.2,
    roughness: 5,
    kind: "grass",
  },
];

/** 横幅 TILE でつながる（左右の端の高さがそろう）ノイズ。 */
function periodicNoise(x: number, seed: number, roughness: number) {
  const angle = (x / TILE) * TAU;
  const radius = roughness * 1.3;
  return fbm2(
    Math.cos(angle) * radius + seed * 7.1,
    Math.sin(angle) * radius + seed * 3.3,
    4
  );
}

/** 1 枚分のシルエット（下は画面の外まで塗る）。 */
function silhouette(spec: LayerSpec, seed: number) {
  const shape = new Shape();
  const bottom = -12;
  shape.moveTo(0, bottom);
  const steps = 240;
  for (let index = 0; index <= steps; index++) {
    const x = (index / steps) * TILE;
    let y =
      spec.base + periodicNoise(x, seed, spec.roughness) * spec.amplitude * 2;
    if (spec.kind === "forest") {
      // とがった木の並び：のこぎり波に高さのばらつきを掛ける
      const saw = 1 - Math.abs(((x * 1.4) % 1) - 0.5) * 2;
      y += saw * (1.6 + periodicNoise(x * 3, seed + 1, 3) * 1.4);
    } else if (spec.kind === "grass") {
      const tuft = Math.max(0, Math.sin(x * 9)) ** 6;
      y =
        spec.base +
        tuft * (0.6 + periodicNoise(x, seed, 2) * 1.5) +
        Math.max(0, periodicNoise(x, seed + 2, 1)) * 1.5;
    } else if (spec.kind === "ground") {
      const stone =
        Math.max(0, Math.sin(x * 2.3 + periodicNoise(x, seed, 2) * 4)) ** 12;
      y = -0.02 + stone * 0.18;
    }
    shape.lineTo(x, y);
  }
  shape.lineTo(TILE, bottom);
  shape.closePath();
  return new ShapeGeometry(shape);
}

export const demo: DemoModule = {
  alt: "奥の背景ほどゆっくり、手前ほど速く動かして奥行きを感じさせるパララックス背景（視差スクロール）のデモ。プレイヤーが右へ走り、カメラがそれを追う。遠くの山はほとんど動かず、丘、森、地面、手前の草の順に速く流れる。すべての層を同じ速さで動かすと、背景が一枚の絵のように平たく見える。層ごとに動く割合を決める 2D の方法と、本当に奥へ置いて遠近法で見る 3D の方法を比べられる。",
  camera: {
    position: [0, CAMERA_HEIGHT, CAMERA_DISTANCE],
    target: [0, CAMERA_HEIGHT, 0],
    orbit: false,
    fov: 40,
  },
  studio: { floor: false, fog: false, background: "#cfe3ef" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "奥行きの出し方",
      value: "factor",
      options: [
        { value: "none", label: "視差なし（全部同じ速さ）" },
        { value: "factor", label: "層ごとに動く割合を決める（2D）" },
        { value: "depth", label: "本当に奥へ置く（3D）" },
      ],
    },
    {
      type: "range",
      key: "strength",
      label: "視差の強さ",
      min: 0,
      max: 1.5,
      step: 0.05,
      value: 1,
      hint: "0 で全部の層が同じ速さ、1 で表の割合どおり。",
    },
    {
      type: "range",
      key: "speed",
      label: "走る速さ",
      min: 0,
      max: 1.5,
      step: 0.05,
      value: 1,
    },
  ],
  legend: LAYERS.map((layer) => ({
    color: layer.color,
    label: `${layer.name}（動く割合 ${layer.factor}）`,
  })),
  setup(context) {
    const { scene, params, camera } = context;
    camera.far = 2000;
    camera.updateProjectionMatrix();

    // 空と太陽はカメラに張り付ける（動く割合 0）
    const sky = new Group();
    const sun = new Mesh(
      new CircleGeometry(1.4, 48),
      new MeshBasicMaterial({ color: "#fff4cf" })
    );
    sun.position.set(5.5, 4, 0);
    const haze = new Mesh(
      new PlaneGeometry(400, 3),
      new MeshBasicMaterial({
        color: "#e6f0f5",
        transparent: true,
        opacity: 0.6,
      })
    );
    haze.position.set(0, -0.5, 0);
    const backdrop = new Mesh(
      new PlaneGeometry(400, 60),
      new MeshBasicMaterial({ color: "#bcd7e8" })
    );
    backdrop.position.set(0, 10, -0.1);
    sky.add(backdrop, sun, haze);
    scene.add(sky);

    const layers = LAYERS.map((spec, index) => {
      const group = new Group();
      const geometry = silhouette(spec, index + 1);
      const material = new MeshBasicMaterial({ color: spec.color });
      for (const copy of [-1, 0, 1]) {
        const mesh = new Mesh(geometry, material);
        mesh.position.x = copy * TILE;
        group.add(mesh);
      }
      scene.add(group);
      return {
        ...spec,
        group,
        z: -0.4 * (LAYERS.length - index) + (spec.factor > 1 ? 3 : 0),
      };
    });

    courseView(GROUND, scene);
    const player = new Player(GROUND, new Vector2(0, 0));
    const avatar = playerView(palette.amber);
    scene.add(avatar);

    const bars = document.createElement("canvas");
    bars.width = 440;
    bars.height = 190;
    bars.style.width = "220px";
    bars.style.height = "95px";
    const figure = document.createElement("figure");
    figure.className = "keyword-stage-graph";
    const caption = document.createElement("figcaption");
    caption.textContent = "画面の上を流れる速さ";
    figure.append(caption, bars);
    context.hud(figure);

    let cameraX = 0;
    let jumpTimer = 1;
    return {
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        const h = Math.min(dt, 1 / 30);
        const run = Number(params["speed"]);
        jumpTimer -= h;
        const jumpPressed = jumpTimer <= 0 && player.onGround;
        if (jumpPressed) {
          jumpTimer = 1.4 + ((player.time * 7.3) % 1);
        }
        player.update(h, { move: run, jumpPressed, jumpHeld: true });
        avatar.update(player);
        cameraX += (player.position.x + 3 - cameraX) * (1 - Math.exp(-4 * h));
        camera.position.set(cameraX, CAMERA_HEIGHT, CAMERA_DISTANCE);
        camera.lookAt(cameraX, CAMERA_HEIGHT, 0);
        // 空は一番奥の層よりさらに奥に置き、画面上の大きさが変わらないよう拡大する
        sky.position.set(cameraX, CAMERA_HEIGHT, -SKY_DEPTH);
        sky.scale.setScalar(
          (CAMERA_DISTANCE + SKY_DEPTH) / CAMERA_DISTANCE / 3
        );

        const mode = String(params["mode"]);
        const strength = Number(params["strength"]);
        const context2d = bars.getContext("2d");
        context2d?.clearRect(0, 0, bars.width, bars.height);
        for (const [index, layer] of layers.entries()) {
          // 強さ 0 なら全部 1、強さ 1 なら表どおりの割合
          const factor =
            mode === "none" ? 1 : 1 + (layer.factor - 1) * strength;
          if (mode === "depth" && factor > 0.01) {
            // 動く割合が factor に見える奥行きに置き、同じ大きさに見えるよう拡大する
            const scale = 1 / factor;
            const depth = CAMERA_DISTANCE * (scale - 1);
            const span = TILE * scale;
            layer.group.scale.set(scale, scale, 1);
            layer.group.position.set(
              span * Math.floor(cameraX / span),
              CAMERA_HEIGHT - CAMERA_HEIGHT * scale,
              -depth
            );
          } else {
            // 2D の方法：どの層も同じ奥行きのまま、カメラに対して factor の割合だけ動かす
            const scrolled = cameraX * factor;
            layer.group.scale.set(1, 1, 1);
            layer.group.position.set(
              cameraX - (scrolled - TILE * Math.floor(scrolled / TILE)),
              0,
              layer.z
            );
          }
          if (context2d) {
            const y = 14 + index * 34;
            const speed = factor * run * 6.5;
            context2d.fillStyle = layer.color;
            context2d.fillRect(
              150,
              y,
              Math.max(2, (speed / (1.6 * 6.5)) * 270),
              22
            );
            context2d.fillStyle = "#e8eef6";
            context2d.font = "20px sans-serif";
            context2d.fillText(layer.name, 4, y + 18);
          }
        }
        context.readout("プレイヤーの速さ", `${(run * 6.5).toFixed(1)} m/s`);
        let text =
          "遠くの山ほどゆっくり、手前の草ほど速く流れる。人の目は、動く速さの違いから奥行きを感じるので、平らな絵を重ねただけでも奥行きがあるように見える。";
        if (mode === "none") {
          text =
            "すべての層が同じ速さで流れるので、背景が一枚の平たい絵のように見え、遠くの山までプレイヤーのすぐ後ろにあるように感じる。";
        } else if (mode === "depth") {
          text =
            "層を本当に奥へ置き、遠いほど大きくしてある。カメラは遠近法で映すので、割合を計算しなくても、遠い層ほど自然にゆっくり動く。3D のエンジンで横スクロールを作るときの方法。";
        }
        context.caption(text);
      },
    };
  },
};
