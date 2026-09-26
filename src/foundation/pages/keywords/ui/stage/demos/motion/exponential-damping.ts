import { Mesh, RingGeometry, Vector3 } from "three";
import { marker, palette, rng, standard, trail } from "../../kit";
import type { DemoModule } from "../../types";

type Follower = {
  label: string;
  color: string;
  fps: number;
  exponential: boolean;
  position: Vector3;
  accumulator: number;
  mesh: ReturnType<typeof marker>;
  trail: ReturnType<typeof trail>;
};

const HEIGHT = 0.4;

export const demo: DemoModule = {
  alt: "床の上を跳び移る目標を 4 つの球が追いかけるデモ。毎フレーム一定の割合で近づく素朴な書き方では、20fps と 120fps で追従の速さが大きく変わる。経過時間から係数を決める指数減衰では、フレームレートに関係なく 2 つの球がぴったり重なる。",
  camera: { position: [0, 6.8, 6.4], target: [0, 0, 0.2] },
  controls: [
    {
      type: "range",
      key: "halfLife",
      label: "半減期（距離が半分になる時間）",
      min: 0.05,
      max: 1,
      step: 0.01,
      value: 0.25,
      format: (value) => `${value.toFixed(2)} 秒`,
    },
    { type: "toggle", key: "naive", label: "素朴な lerp を表示", value: true },
    { type: "toggle", key: "auto", label: "目標を自動で動かす", value: true },
  ],
  legend: [
    { color: palette.coral, label: "lerp(x, 目標, 定数) @20fps" },
    { color: palette.pink, label: "同じ式 @120fps" },
    { color: palette.cyan, label: "指数減衰 @20fps" },
    { color: palette.sky, label: "指数減衰 @120fps" },
  ],
  hint: "床をクリック（タップ）すると目標をその場所へ移せます。",
  setup(context) {
    const { scene, params } = context;
    const random = rng(3);
    const target = new Vector3(2, HEIGHT, 1);
    const goal = marker(palette.amber, 0.2);
    goal.material.emissiveIntensity = 1.6;
    const ring = new Mesh(
      new RingGeometry(0.42, 0.5, 48),
      standard(palette.amber, { emissive: 1 })
    );
    ring.rotation.x = -Math.PI / 2;
    scene.add(goal, ring);

    const followers: Follower[] = [
      { label: "20fps", color: palette.coral, fps: 20, exponential: false },
      { label: "120fps", color: palette.pink, fps: 120, exponential: false },
      { label: "20fps", color: palette.cyan, fps: 20, exponential: true },
      { label: "120fps", color: palette.sky, fps: 120, exponential: true },
    ].map((item) => {
      const mesh = marker(item.color, item.exponential ? 0.28 : 0.22);
      const line = trail(50, item.color, { width: 4 });
      scene.add(mesh, line);
      return {
        ...item,
        position: new Vector3(-3, HEIGHT, -1),
        accumulator: 0,
        mesh,
        trail: line,
      };
    });

    let timer = 0;
    const moveTarget = (point: Vector3) => {
      target.set(point.x, HEIGHT, point.z);
      timer = 0;
    };
    context.onPick((point) => {
      context.setParam("auto", false);
      moveTarget(point);
    });

    return {
      update({ dt }) {
        const halfLife = Number(params["halfLife"]);
        const lambda = Math.LN2 / halfLife;
        // 60fps のときに指数減衰と一致する「1 フレームあたりの割合」
        const naiveFactor = 1 - Math.exp(-lambda / 60);
        timer += dt;
        if (params["auto"] === true && timer > 2.2) {
          moveTarget(
            new Vector3((random() - 0.5) * 9, 0, (random() - 0.5) * 6)
          );
        }
        goal.position.copy(target);
        ring.position.set(target.x, 0.01, target.z);
        ring.scale.setScalar(1 + Math.sin(timer * 6) * 0.08);

        const showNaive = params["naive"] === true;
        for (const follower of followers) {
          const step = 1 / follower.fps;
          follower.accumulator += dt;
          while (follower.accumulator >= step) {
            follower.accumulator -= step;
            const factor = follower.exponential
              ? 1 - Math.exp(-lambda * step)
              : naiveFactor;
            follower.position.lerp(target, factor);
          }
          follower.mesh.position.copy(follower.position);
          follower.trail.push(follower.position);
          const visible = follower.exponential || showNaive;
          follower.mesh.visible = visible;
          follower.trail.visible = visible && follower.trail.visible;
          if (!visible) {
            follower.trail.reset();
          }
        }
        const [slow, fast, expSlow, expFast] = followers;
        if (slow && fast && expSlow && expFast) {
          context.readout(
            "lerp 20fps の残り距離",
            `${slow.position.distanceTo(target).toFixed(2)} m`
          );
          context.readout(
            "lerp 120fps の残り距離",
            `${fast.position.distanceTo(target).toFixed(2)} m`
          );
          context.readout(
            "指数減衰 20/120fps の差",
            `${expSlow.position.distanceTo(expFast.position).toFixed(3)} m`
          );
        }
        context.readout("1 フレームの割合（素朴な式）", naiveFactor.toFixed(3));
        context.caption(
          "毎フレーム同じ割合で近づけると、フレームが多い環境ほど速く追いつく。係数を 1 − e^(−λ·dt) にすれば、経過時間だけで追従が決まる。"
        );
      },
    };
  },
};
