import {
  BoxGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  SphereGeometry,
  Vector4,
  WireframeGeometry,
} from "three";
import { palette, rng } from "../../kit";
import { glslSdf, raymarchWorld } from "../../raymarch";
import type { DemoModule } from "../../types";

const HOLES = 24;
const WALL_CENTER = { x: 0, y: 1.2, z: 0 };
const WALL_HALF = { x: 2.3, y: 1.2, z: 0.22 };

const modes = {
  union: 0,
  subtract: 1,
  intersect: 2,
  tree: 3,
  wall: 4,
} as const;

type Mode = keyof typeof modes;

const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && Object.hasOwn(modes, value);

export const demo: DemoModule = {
  alt: "距離場の最小値・最大値で形を組み合わせる CSG のデモ。箱（A）と球（B）の和・差・交差を切り替えられ、削られた面は削った側の色で塗られる。「壊せる壁」では、クリックした場所の壁から球を差し引いて弾痕や穴を開ける。",
  camera: { position: [3.6, 2.8, 5.4], target: [0, 1.1, 0] },
  studio: { floor: false },
  bloom: { strength: 0.8, radius: 0.4, threshold: 0.8 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "組み合わせ方",
      value: "subtract",
      options: [
        { value: "union", label: "和 A ∪ B" },
        { value: "subtract", label: "差 A − B" },
        { value: "intersect", label: "交差 A ∩ B" },
        { value: "tree", label: "CSG 木（部品）" },
        { value: "wall", label: "壊せる壁" },
      ],
    },
    { type: "toggle", key: "move", label: "B を動かす", value: true },
    {
      type: "toggle",
      key: "ghost",
      label: "元の形（A と B）を線で表示",
      value: true,
    },
    { type: "toggle", key: "auto", label: "壁に自動で穴を開ける", value: true },
    { type: "button", key: "reset", label: "壁を元に戻す" },
  ],
  legend: [
    { color: palette.sky, label: "A（箱）の面" },
    { color: palette.coral, label: "B（球）が削った / 作った面" },
    { color: palette.lime, label: "円柱で削った面（CSG 木）" },
  ],
  hint: "「壊せる壁」では壁をクリックすると、その位置に穴が開きます。",
  setup(context) {
    const { scene, params } = context;
    const random = rng(11);
    const holes = Array.from(
      { length: HOLES },
      () => new Vector4(0, -99, 0, 0)
    );
    const holeAges = Array.from({ length: HOLES }, () => 99);
    let nextHole = 0;
    const uniforms = {
      uMode: { value: 1 },
      uOffset: { value: 0.55 },
      uSpin: { value: 0 },
    };
    raymarchWorld(context, {
      uniforms,
      rawUniforms: {
        uHoles: { value: holes },
        uHoleAges: { value: holeAges },
      },
      emission: true,
      stepScale: 0.9,
      functions: /* glsl */ `
        ${glslSdf}
        uniform vec4 uHoles[${HOLES}];
        uniform float uHoleAges[${HOLES}];
        // id: 0 = A, 1 = B, 2 = 円柱, 3 = 壁, 4 = 穴
        float scene(vec3 p, out float id) {
          if (uMode > 3.5) {
            vec3 q = p - vec3(${WALL_CENTER.x.toFixed(1)}, ${WALL_CENTER.y.toFixed(1)}, ${WALL_CENTER.z.toFixed(1)});
            float wall = sdBox(q, vec3(${WALL_HALF.x}, ${WALL_HALF.y}, ${WALL_HALF.z}));
            float cut = 1e5;
            for (int i = 0; i < ${HOLES}; i++) {
              cut = min(cut, sdSphere(p - uHoles[i].xyz, uHoles[i].w));
            }
            float d = max(wall, -cut);
            id = wall > -cut ? 3.0 : 4.0;
            return d;
          }
          vec3 c = p - vec3(0.0, 1.1, 0.0);
          c.xz = rot2(uSpin) * c.xz;
          float a = sdRoundBox(c, vec3(0.8), 0.05);
          float b = sdSphere(c - vec3(uOffset, 0.25, 0.3), 1.0);
          if (uMode < 0.5) {
            id = a < b ? 0.0 : 1.0;
            return min(a, b);
          }
          if (uMode < 1.5) {
            id = a > -b ? 0.0 : 1.0;
            return max(a, -b);
          }
          if (uMode < 2.5) {
            id = a > b ? 0.0 : 1.0;
            return max(a, b);
          }
          float body = max(a, sdSphere(c, 1.08));
          id = a > sdSphere(c, 1.08) ? 0.0 : 1.0;
          float cx = sdCappedCylinder(c.yxz, 1.2, 0.45);
          float cy = sdCappedCylinder(c, 1.2, 0.45);
          float cz = sdCappedCylinder(c.xzy, 1.2, 0.45);
          float cylinders = min(cx, min(cy, cz));
          if (-cylinders > body) id = 2.0;
          return max(body, -cylinders);
        }
        float map(vec3 p) { float id; return scene(p, id); }
        vec4 surface(vec3 p, vec3 n) {
          float id;
          scene(p, id);
          if (id < 0.5) return vec4(0.42, 0.66, 0.95, 0.35);
          if (id < 1.5) return vec4(0.96, 0.46, 0.42, 0.4);
          if (id < 2.5) return vec4(0.66, 0.88, 0.32, 0.4);
          if (id < 3.5) {
            vec2 brick = (p.xy + vec2(0.0, 0.0)) * vec2(2.4, 4.8);
            brick.x += mod(floor(brick.y), 2.0) * 0.5;
            vec2 f = fract(brick);
            float mortar = step(0.05, f.x) * step(0.08, f.y);
            float tone = fract(sin(dot(floor(brick), vec2(12.9898, 78.233))) * 43758.5);
            vec3 face = mix(vec3(0.55, 0.33, 0.26), vec3(0.72, 0.45, 0.34), tone);
            return vec4(mix(vec3(0.3, 0.29, 0.28), face, abs(n.z) > 0.9 ? mortar : 1.0), 0.85);
          }
          return vec4(0.62, 0.5, 0.44, 0.95);
        }
        vec3 emission(vec3 p, vec3 n) {
          if (uMode < 3.5) return vec3(0.0);
          float id;
          scene(p, id);
          if (id < 3.5) return vec3(0.0);
          vec3 glow = vec3(0.0);
          for (int i = 0; i < ${HOLES}; i++) {
            float near = 1.0 - smoothstep(0.0, 0.05, abs(sdSphere(p - uHoles[i].xyz, uHoles[i].w)));
            glow += vec3(1.0, 0.45, 0.12) * near * exp(-uHoleAges[i] * 1.6);
          }
          return glow;
        }
      `,
    });

    const ghostMaterial = new LineBasicMaterial({
      color: palette.muted,
      transparent: true,
      opacity: 0.3,
      depthTest: false,
    });
    const boxGhost = new LineSegments(
      new EdgesGeometry(new BoxGeometry(1.6, 1.6, 1.6)),
      ghostMaterial
    );
    const sphereGhost = new LineSegments(
      new WireframeGeometry(new SphereGeometry(1, 14, 8)),
      ghostMaterial
    );
    boxGhost.renderOrder = 5;
    sphereGhost.renderOrder = 5;
    scene.add(boxGhost, sphereGhost);
    const labelA = context.label("A", { color: palette.sky, size: "md" });
    const labelB = context.label("B", { color: palette.coral, size: "md" });
    scene.add(labelA, labelB);

    const addHole = (x: number, y: number, radius: number) => {
      const hole = holes[nextHole];
      if (hole) {
        hole.set(x, y, WALL_CENTER.z + WALL_HALF.z, radius);
        holeAges[nextHole] = 0;
      }
      nextHole = (nextHole + 1) % HOLES;
    };
    const resetWall = () => {
      for (const [index, hole] of holes.entries()) {
        hole.set(0, -99, 0, 0);
        holeAges[index] = 99;
      }
      nextHole = 0;
    };
    context.onPick(
      (point) => {
        if (params["mode"] !== "wall") {
          return;
        }
        const inside =
          Math.abs(point.x - WALL_CENTER.x) < WALL_HALF.x &&
          Math.abs(point.y - WALL_CENTER.y) < WALL_HALF.y;
        if (inside) {
          addHole(point.x, point.y, 0.28 + random() * 0.18);
        }
      },
      { normal: [0, 0, 1], origin: [0, 0, WALL_CENTER.z + WALL_HALF.z] }
    );

    let clock = 0;
    let autoTimer = 0;

    return {
      action(key) {
        if (key === "reset") {
          resetWall();
        }
      },
      update({ dt }) {
        const mode: Mode = isMode(params["mode"]) ? params["mode"] : "subtract";
        uniforms.uMode.value = modes[mode];
        if (params["move"] === true) {
          clock += dt;
        }
        const offset = 0.55 + Math.sin(clock * 0.8) * 0.45;
        uniforms.uOffset.value = mode === "tree" ? 0 : offset;
        uniforms.uSpin.value = mode === "tree" ? clock * 0.3 : 0;
        for (let index = 0; index < HOLES; index++) {
          holeAges[index] = (holeAges[index] ?? 99) + dt;
        }
        if (mode === "wall" && params["auto"] === true) {
          autoTimer += dt;
          if (autoTimer > 1.1) {
            autoTimer = 0;
            addHole(
              (random() - 0.5) * 3.8,
              0.4 + random() * 1.7,
              0.18 + random() * 0.3
            );
          }
        }
        const ghost =
          params["ghost"] === true && mode !== "wall" && mode !== "tree";
        boxGhost.visible = ghost;
        sphereGhost.visible = ghost;
        labelA.visible = ghost;
        labelB.visible = ghost;
        boxGhost.position.set(0, 1.1, 0);
        sphereGhost.position.set(offset, 1.35, 0.3);
        labelA.position.set(-0.95, 2.05, 0.8);
        labelB.position.set(offset + 0.5, 2.3, 0.3);
        const formula = {
          union: "min(dA, dB)",
          subtract: "max(dA, −dB)",
          intersect: "max(dA, dB)",
          tree: "max(max(箱, 球), −min(円柱×3))",
          wall: "max(壁, −min(穴₁, 穴₂, …))",
        } as const;
        context.readout("距離の式", formula[mode]);
        context.caption(
          mode === "union"
            ? "和は 2 つの距離の小さいほう。どちらかの内側なら内側になる。"
            : mode === "subtract"
              ? "差は B の符号を反転して最大値を取る。B の内側だった部分が削られ、削った面は B の形（赤）になる。"
              : mode === "intersect"
                ? "交差は大きいほう。両方の内側にある部分だけが残る。"
                : mode === "tree"
                  ? "箱と球の交差から 3 本の円柱を引く。min と max の組み合わせだけで、機械部品のような形が作れる。"
                  : "壁から球を引くだけで弾痕や破壊口になる。メッシュを作り直さずに、形を何度でも削れる。"
        );
      },
    };
  },
};
