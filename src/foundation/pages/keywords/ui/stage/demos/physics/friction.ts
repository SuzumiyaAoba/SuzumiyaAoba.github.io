import { BoxGeometry, Mesh, SphereGeometry, Vector3 } from "three";
import { arrow, palette, standard } from "../../kit";
import type { DemoModule } from "../../types";

const GRAVITY = 9.81;
const RAMP_LENGTH = 4.2;
const RAMP_TOP = new Vector3(-5.4, 0, 0);
const FLOOR_FRICTION = 0.5;
const BOX = 0.4;
const BALL_RADIUS = 0.25;
const DROP_HEIGHT = 3.2;
const STOPPER_X = 1;

type Combine = "average" | "minimum" | "multiply" | "maximum";

const toCombine = (value: unknown): Combine =>
  value === "minimum" || value === "maximum" || value === "multiply"
    ? value
    : "average";

function combine(mode: Combine, a: number, b: number) {
  if (mode === "minimum") {
    return Math.min(a, b);
  }
  if (mode === "maximum") {
    return Math.max(a, b);
  }
  if (mode === "multiply") {
    return a * b;
  }
  return (a + b) / 2;
}

const BOXES = [
  { label: "氷", friction: 0.02, color: "#bfe6ff", z: -0.8 },
  { label: "木", friction: 0.45, color: "#c8955c", z: 0 },
  { label: "ゴム", friction: 1.1, color: "#4a4f5a", z: 0.8 },
] as const;

const BALLS = [
  { label: "粘土", restitution: 0.1, color: "#d9825b", x: 2 },
  { label: "テニスボール", restitution: 0.7, color: "#d7f25c", x: 3.2 },
  { label: "スーパーボール", restitution: 0.95, color: "#ff5fa2", x: 4.4 },
] as const;

export const demo: DemoModule = {
  alt: "摩擦係数と反発係数の違いを比べるデモ。左の坂では、氷・木・ゴムの箱が同じ坂に置かれ、摩擦の小さい氷はすぐ滑り出して遠くまで進み、ゴムは坂を急にしても止まったまま動かない。右では、粘土・テニスボール・スーパーボールを同じ高さから落とし、反発係数によって跳ね返る高さが変わる。2 つの物体の係数をどう組み合わせるかも切り替えられる。",
  camera: { position: [-0.4, 3.4, 10], target: [-0.4, 1.3, 0] },
  controls: [
    { type: "button", key: "reset", label: "もう一度" },
    {
      type: "range",
      key: "angle",
      label: "坂の角度",
      min: 0,
      max: 55,
      step: 1,
      value: 28,
      format: (value) => `${value}°`,
    },
    {
      type: "range",
      key: "floor",
      label: "床の反発係数",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.9,
    },
    {
      type: "select",
      key: "combine",
      label: "係数の組み合わせ方",
      value: "average",
      options: [
        { value: "average", label: "平均" },
        { value: "minimum", label: "小さい方" },
        { value: "multiply", label: "掛け算" },
        { value: "maximum", label: "大きい方" },
      ],
      hint: "物理エンジンでは、ぶつかった 2 つの物体の係数をこのように 1 つにまとめます。",
    },
  ],
  legend: [
    { color: palette.coral, label: "摩擦力（動きに逆らう）" },
    { color: palette.sky, label: "重力の坂に沿った成分" },
  ],
  setup(context) {
    const { scene, params } = context;
    const ramp = new Mesh(
      new BoxGeometry(RAMP_LENGTH, 0.14, 2.4),
      standard("#6b6f7a", { roughness: 0.6 })
    );
    ramp.receiveShadow = true;
    ramp.castShadow = true;
    scene.add(ramp);
    const stopper = new Mesh(
      new BoxGeometry(0.2, 0.5, 2.4),
      standard("#8a5a44")
    );
    stopper.position.set(STOPPER_X + 0.1, 0.25, 0);
    stopper.castShadow = true;
    scene.add(stopper);
    const support = new Mesh(new BoxGeometry(0.2, 1, 2.4), standard("#4a4f5a"));
    support.castShadow = true;
    scene.add(support);

    const boxes = BOXES.map((spec) => {
      const mesh = new Mesh(
        new BoxGeometry(BOX, BOX, BOX),
        standard(spec.color, { roughness: spec.label === "氷" ? 0.05 : 0.8 })
      );
      mesh.castShadow = true;
      const label = context.label(spec.label, { size: "sm" });
      const frictionArrow = arrow(palette.coral, {
        radius: 0.02,
        headLength: 0.12,
      });
      const gravityArrow = arrow(palette.sky, {
        radius: 0.02,
        headLength: 0.12,
      });
      scene.add(mesh, label, frictionArrow, gravityArrow);
      return { ...spec, mesh, label, frictionArrow, gravityArrow, s: 0, v: 0 };
    });
    const balls = BALLS.map((spec) => {
      const mesh = new Mesh(
        new SphereGeometry(BALL_RADIUS, 32, 20),
        standard(spec.color, { roughness: 0.4 })
      );
      mesh.castShadow = true;
      const label = context.label(spec.label, { size: "sm" });
      const marker = new Mesh(
        new BoxGeometry(0.5, 0.02, 0.02),
        standard(spec.color, { emissive: 0.8 })
      );
      scene.add(mesh, label, marker);
      return {
        ...spec,
        mesh,
        label,
        marker,
        y: DROP_HEIGHT,
        vy: 0,
        apex: DROP_HEIGHT,
        rising: false,
      };
    });

    let angleUsed = -1;
    let restTime = 0;
    const reset = () => {
      for (const box of boxes) {
        box.s = 0.3;
        box.v = 0;
      }
      for (const ball of balls) {
        ball.y = DROP_HEIGHT;
        ball.vy = 0;
        ball.apex = DROP_HEIGHT;
      }
    };
    reset();

    const along = new Vector3();
    const normal = new Vector3();
    const point = new Vector3();
    return {
      action(key) {
        if (key === "reset") {
          reset();
        }
      },
      update({ dt }) {
        const angle = (Number(params["angle"]) * Math.PI) / 180;
        const mode = toCombine(params["combine"]);
        if (Math.abs(angle - angleUsed) > 1e-6) {
          angleUsed = angle;
          reset();
        }
        // 坂：上端から右下へ
        along.set(Math.cos(angle), -Math.sin(angle), 0);
        normal.set(Math.sin(angle), Math.cos(angle), 0);
        const rampHeight = RAMP_LENGTH * Math.sin(angle);
        const rampBottom = RAMP_TOP.clone()
          .setY(rampHeight)
          .addScaledVector(along, RAMP_LENGTH);
        ramp.position
          .copy(RAMP_TOP)
          .setY(rampHeight)
          .addScaledVector(along, RAMP_LENGTH / 2)
          .addScaledVector(normal, -0.07);
        ramp.rotation.z = -angle;
        support.scale.y = Math.max(0.01, rampHeight);
        support.position.set(RAMP_TOP.x + 0.1, rampHeight / 2, 0);

        const substeps = 8;
        const h = dt / substeps;
        const steps = dt > 0 ? substeps : 0;
        for (const box of boxes) {
          const mu = combine(mode, box.friction, FLOOR_FRICTION);
          const staticMu = mu;
          const kineticMu = mu * 0.8;
          for (let s = 0; s < steps; s++) {
            const onRamp = box.s < RAMP_LENGTH;
            const slope = onRamp ? angle : 0;
            const drive = GRAVITY * Math.sin(slope);
            const maxFriction = GRAVITY * Math.cos(slope);
            if (Math.abs(box.v) < 1e-3) {
              // 静止摩擦：坂を下る力が「静止摩擦係数 × 垂直抗力」以下なら動かない
              if (drive > staticMu * maxFriction) {
                box.v += (drive - kineticMu * maxFriction) * h;
              } else {
                box.v = 0;
              }
            } else {
              // 動摩擦：動いている向きと逆に、一定の大きさで働く
              box.v += (drive - kineticMu * maxFriction) * h;
              if (box.v < 0) {
                box.v = 0;
              }
            }
            box.s += box.v * h;
            // 右端の車止めでぶつかって止まる
            const limit = RAMP_LENGTH + (STOPPER_X - BOX / 2 - rampBottom.x);
            if (box.s > limit) {
              box.s = limit;
              box.v = 0;
            }
          }
          if (box.s < RAMP_LENGTH) {
            point
              .copy(RAMP_TOP)
              .setY(rampHeight)
              .addScaledVector(along, box.s)
              .addScaledVector(normal, BOX / 2);
            box.mesh.rotation.z = -angle;
          } else {
            point
              .copy(rampBottom)
              .setY(BOX / 2)
              .add(new Vector3(box.s - RAMP_LENGTH, 0, 0));
            box.mesh.rotation.z = 0;
          }
          point.z = box.z;
          box.mesh.position.copy(point);
          box.label.position.copy(point).add(new Vector3(0, 0.45, 0));
          const onRamp = box.s < RAMP_LENGTH;
          const direction = onRamp ? along : new Vector3(1, 0, 0);
          const gravityPart = onRamp ? Math.sin(angle) : 0;
          const moving = box.v > 1e-3;
          const frictionSize = moving
            ? kineticMu * (onRamp ? Math.cos(angle) : 1)
            : Math.min(gravityPart, staticMu * Math.cos(angle));
          box.gravityArrow.set(
            point.clone().add(new Vector3(0, 0, 0.26)),
            direction.clone().multiplyScalar(gravityPart * 0.8)
          );
          box.frictionArrow.set(
            point.clone().add(new Vector3(0, 0, 0.26)),
            direction.clone().multiplyScalar(-frictionSize * 0.8)
          );
        }

        const floorRestitution = Number(params["floor"]);
        // 全部のボールが止まってしばらくしたら、もう一度落とす
        if (
          balls.every((ball) => ball.vy === 0 && ball.y <= BALL_RADIUS + 1e-3)
        ) {
          restTime += dt;
          if (restTime > 1.2) {
            restTime = 0;
            for (const ball of balls) {
              ball.y = DROP_HEIGHT;
              ball.apex = DROP_HEIGHT;
            }
          }
        }
        for (const ball of balls) {
          const e = combine(mode, ball.restitution, floorRestitution);
          for (let s = 0; s < steps; s++) {
            ball.vy -= GRAVITY * h;
            ball.y += ball.vy * h;
            if (ball.y < BALL_RADIUS) {
              ball.y = BALL_RADIUS;
              // 反発係数：ぶつかる前の速さに対する、跳ね返った後の速さの比
              ball.vy = Math.abs(ball.vy) < 0.3 ? 0 : -ball.vy * e;
              ball.rising = true;
              ball.apex = BALL_RADIUS;
            }
            if (ball.rising && ball.vy <= 0) {
              ball.rising = false;
            }
            if (ball.rising) {
              ball.apex = Math.max(ball.apex, ball.y);
            }
          }
          ball.mesh.position.set(ball.x, ball.y, 0);
          ball.label.position.set(ball.x, ball.y + 0.5, 0);
          ball.marker.position.set(ball.x, ball.apex, -0.3);
        }
        const [, woods] = boxes;
        if (woods) {
          context.readout(
            "木と床の摩擦係数",
            combine(mode, woods.friction, FLOOR_FRICTION).toFixed(2)
          );
        }
        context.readout(
          "滑り出す角度の目安（木）",
          `${((Math.atan(combine(mode, 0.45, FLOOR_FRICTION)) * 180) / Math.PI).toFixed(0)}°`
        );
        context.caption(
          "箱は、坂を下る力（青）が静止摩擦の上限を超えたときだけ滑り出し、滑っている間は動摩擦（赤）でブレーキがかかる。ボールは、ぶつかる直前の速さに反発係数を掛けた速さで跳ね返るので、跳ね上がる高さは反発係数の 2 乗に比例する。"
        );
      },
    };
  },
};
