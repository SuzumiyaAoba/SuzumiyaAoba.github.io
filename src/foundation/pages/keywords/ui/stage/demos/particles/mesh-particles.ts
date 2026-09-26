import {
  CanvasTexture,
  Color,
  DodecahedronGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { palette, perlin2, rng, standard } from "../../kit";
import { particleSystem } from "../../particles";
import type { DemoModule } from "../../types";

const MAX = 360;
const GRAVITY = 9.8;
const ROCK_Y = 0.9;

let rockTexture: CanvasTexture | undefined;
const rockSprite = () => {
  if (rockTexture) {
    return rockTexture;
  }
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size - 0.5;
        const v = y / size - 0.5;
        const d = Math.hypot(u, v) * 2 + perlin2(x * 0.2, y * 0.2) * 0.25;
        const shade = 110 + (0.5 - v) * 90 + perlin2(x * 0.5, y * 0.5) * 40;
        const index = (y * size + x) * 4;
        image.data[index] = shade;
        image.data[index + 1] = shade * 0.92;
        image.data[index + 2] = shade * 0.85;
        image.data[index + 3] = d < 0.85 ? 255 : 0;
      }
    }
    context.putImageData(image, 0, 0);
  }
  rockTexture = new CanvasTexture(canvas);
  rockTexture.colorSpace = SRGBColorSpace;
  return rockTexture;
};

export const demo: DemoModule = {
  alt: "岩が砕けて破片が飛び散るデモ。破片を立体のメッシュとして描くと、回転しながら光を受けて影を落とし、床で跳ねて転がる。板ポリゴン（ビルボード）に切り替えると、破片が平らな絵に見え、影も回転の立体感もなくなる。",
  camera: { position: [4.6, 3.2, 6], target: [0, 0.8, 0] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "破片の描き方",
      value: "mesh",
      options: [
        { value: "mesh", label: "メッシュ（立体）" },
        { value: "sprite", label: "板（ビルボード）" },
      ],
    },
    {
      type: "range",
      key: "count",
      label: "破片の数",
      min: 30,
      max: MAX,
      step: 10,
      value: 180,
    },
    { type: "toggle", key: "repeat", label: "自動で繰り返す", value: true },
    { type: "button", key: "shatter", label: "砕く" },
  ],
  legend: [{ color: palette.amber, label: "破片" }],
  setup(context) {
    const { scene, params } = context;
    const random = rng(17);
    const boulder = new Mesh(
      new IcosahedronGeometry(0.85, 1),
      standard("#8a8174", { roughness: 0.9, metalness: 0 })
    );
    boulder.material.flatShading = true;
    boulder.position.y = ROCK_Y;
    boulder.castShadow = true;
    scene.add(boulder);

    const chunks = new InstancedMesh(
      new DodecahedronGeometry(0.1, 0),
      standard("#ffffff", { roughness: 0.85 }),
      MAX
    );
    chunks.material.flatShading = true;
    chunks.castShadow = true;
    chunks.receiveShadow = true;
    scene.add(chunks);
    const sprites = particleSystem({
      capacity: MAX,
      texture: rockSprite(),
      additive: false,
      mode: "billboard",
    });
    scene.add(sprites);

    const positions = Array.from({ length: MAX }, () => new Vector3());
    const velocities = Array.from({ length: MAX }, () => new Vector3());
    const spins = Array.from({ length: MAX }, () => new Vector3());
    const rotations = Array.from({ length: MAX }, () => new Quaternion());
    const scales = new Float32Array(MAX);
    const tint = new Color();
    for (let index = 0; index < MAX; index++) {
      const shade = 0.28 + random() * 0.25;
      chunks.setColorAt(index, tint.setRGB(shade * 1.05, shade, shade * 0.9));
    }
    const matrix = new Matrix4();
    const scale = new Vector3();
    const spinStep = new Quaternion();
    let timer = 0;
    let broken = false;
    let brokenFor = 0;

    const shatter = () => {
      broken = true;
      brokenFor = 0;
      for (let index = 0; index < MAX; index++) {
        const direction = new Vector3(
          random() - 0.5,
          random() * 0.9 + 0.1,
          random() - 0.5
        ).normalize();
        positions[index]
          ?.copy(direction)
          .multiplyScalar(0.5 * random())
          .add(new Vector3(0, ROCK_Y, 0));
        velocities[index]?.copy(direction).multiplyScalar(2 + random() * 3.5);
        spins[index]
          ?.set(random() - 0.5, random() - 0.5, random() - 0.5)
          .multiplyScalar(18);
        rotations[index]
          ?.set(random(), random(), random(), random())
          .normalize();
        scales[index] = 0.45 + random() * 1.1;
      }
    };

    return {
      action(key) {
        if (key === "shatter") {
          shatter();
        }
      },
      update({ dt }) {
        timer += dt;
        if (!broken && timer > 1.2) {
          shatter();
        }
        if (broken) {
          brokenFor += dt;
          if (params["repeat"] === true && brokenFor > 4.5) {
            broken = false;
            timer = 0;
          }
        }
        boulder.visible = !broken;
        const count = Number(params["count"]);
        const meshMode = params["mode"] === "mesh";
        for (let index = 0; index < count; index++) {
          const position = positions[index];
          const velocity = velocities[index];
          const spin = spins[index];
          const rotation = rotations[index];
          if (!(position && velocity && spin && rotation)) {
            continue;
          }
          const size = (scales[index] ?? 1) * 0.1;
          if (broken && dt > 0) {
            velocity.y -= GRAVITY * dt;
            position.addScaledVector(velocity, dt);
            if (position.y < size && velocity.y < 0) {
              position.y = size;
              velocity.y *= -0.35;
              velocity.x *= 0.7;
              velocity.z *= 0.7;
              spin.multiplyScalar(0.6);
            }
            const angle = spin.length() * dt;
            if (angle > 1e-5) {
              spinStep.setFromAxisAngle(spin.clone().normalize(), angle);
              rotation.premultiply(spinStep);
            }
          }
          matrix.compose(
            broken ? position : new Vector3(0, -50, 0),
            rotation,
            scale.setScalar(scales[index] ?? 1)
          );
          chunks.setMatrixAt(index, matrix);
          sprites.positions.set(
            broken ? [position.x, position.y, position.z] : [0, -50, 0],
            index * 3
          );
          sprites.sizes[index] = size * 2.1;
          sprites.colors.set([1, 1, 1, 1], index * 4);
        }
        chunks.count = count;
        chunks.instanceMatrix.needsUpdate = true;
        chunks.visible = meshMode;
        sprites.visible = !meshMode;
        sprites.setCount(count);
        sprites.commit();
        context.readout("破片", `${count} 個`);
        context.readout("1 個あたりの三角形", meshMode ? "36 個" : "2 個");
        context.caption(
          meshMode
            ? "破片の一つ一つが厚みのある形なので、回転すると面ごとに明るさが変わり、床に影を落とす。インスタンシングでまとめて描けば数百個でも軽い。"
            : "板ポリゴンは常に正面を向くため回転しても形が変わらず、光の当たり方も影もない。遠くの細かな破片なら十分だが、近くでは平らさが目立つ。"
        );
      },
    };
  },
};
