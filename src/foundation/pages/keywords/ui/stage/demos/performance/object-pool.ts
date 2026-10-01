import {
  Color,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  SphereGeometry,
  Vector3,
} from "three";
import { diagramPanel, svg } from "../../arena";
import { palette, standard } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const MAX_DRAW = 2000;
const LIFE = 2.6;
/** 弾 1 個を作るときに確保されるメモリの見積もり（バイト）。 */
const BYTES_PER_BULLET = 160;
/** この量のごみが溜まると、ガベージコレクションが走る（模式的な値）。 */
const GC_THRESHOLD = 300_000;
const SLOT_COLUMNS = 40;

type Bullet = {
  position: Vector3;
  velocity: Vector3;
  age: number;
  active: boolean;
};

export const demo: DemoModule = {
  alt: "弾のように、たくさん作ってはすぐ消える物体を、オブジェクトプールで使い回すデモ。弾幕の砲台が 1 秒に何百発も弾を撃つ。撃つたびに新しい弾を作り、消えたら捨てる方法では、捨てた弾がごみとしてメモリに溜まり、一定量を超えるとガベージコレクション（ごみの回収）が走って、ゲームが一瞬止まることがある（右下のグラフは模式的な見積もり）。プールでは、最初に決まった数の弾を作っておき、消えた弾を「空き」に戻して次の発射に使い回すので、ごみが出ない。右上の図は、プールの枠の使われ方。",
  camera: { position: [0, 11, 7], target: [0, 0, 0.3], fov: 45, orbit: false },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "弾の用意の仕方",
      value: "pool",
      options: [
        { value: "new", label: "撃つたびに作って捨てる" },
        { value: "pool", label: "オブジェクトプールで使い回す" },
      ],
    },
    {
      type: "range",
      key: "rate",
      label: "1 秒に撃つ弾の数",
      min: 50,
      max: 700,
      step: 50,
      value: 400,
    },
    {
      type: "range",
      key: "pool",
      label: "プールの大きさ",
      min: 200,
      max: 1600,
      step: 100,
      value: 1200,
    },
  ],
  legend: [
    { color: palette.amber, label: "弾" },
    { color: palette.lime, label: "使っている枠" },
    { color: "#2b3748", label: "空いている枠" },
    { color: palette.coral, label: "ガベージコレクション（止まる）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const turret = new Mesh(
      new CylinderGeometry(0.35, 0.5, 0.6, 16),
      standard(palette.sky, { emissive: 0.3 })
    );
    turret.position.y = 0.3;
    scene.add(turret);
    const bulletsMesh = new InstancedMesh(
      new SphereGeometry(0.07, 8, 6),
      standard(palette.amber, { emissive: 0.8 }),
      MAX_DRAW
    );
    bulletsMesh.frustumCulled = false;
    scene.add(bulletsMesh);
    const matrix = new Matrix4();

    // プールの枠の図
    const { root } = diagramPanel(context, {
      title: "プールの枠（1 マス = 弾 1 個）",
      width: 320,
      height: 132,
      rem: 15,
    });
    const rects: SVGRectElement[] = [];
    const rebuildSlots = (size: number) => {
      root.replaceChildren();
      rects.length = 0;
      const rows = Math.ceil(size / SLOT_COLUMNS);
      const cell = Math.min(8, 130 / rows);
      for (let i = 0; i < size; i++) {
        const rect = svg("rect", {
          x: (i % SLOT_COLUMNS) * 8,
          y: Math.floor(i / SLOT_COLUMNS) * cell,
          width: 7,
          height: Math.max(1, cell - 1),
          fill: "#2b3748",
        });
        root.append(rect);
        rects.push(rect);
      }
    };
    const graph = historyGraph(context, {
      title: "回収を待つごみ（MB、模式的）",
      min: 0,
      max: 0.35,
      series: [{ color: palette.coral }],
    });

    let mode = "";
    let poolSize = 0;
    let pool: Bullet[] = [];
    let free: number[] = [];
    let live: Bullet[] = [];
    let garbage = 0;
    let collections = 0;
    let dropped = 0;
    let allocations = 0;
    let budget = 0;
    let angle = 0;
    let gcFlash = 0;

    const reset = () => {
      poolSize = Number(params["pool"]);
      pool = Array.from({ length: poolSize }, () => ({
        position: new Vector3(),
        velocity: new Vector3(),
        age: 0,
        active: false,
      }));
      free = Array.from({ length: poolSize }, (_, i) => poolSize - 1 - i);
      live = [];
      garbage = 0;
      dropped = 0;
      allocations = 0;
      rebuildSlots(poolSize);
    };

    return {
      update({ dt }) {
        const nextMode = String(params["mode"]);
        if (nextMode !== mode || Number(params["pool"]) !== poolSize) {
          mode = nextMode;
          reset();
        }
        const usePool = mode === "pool";
        budget += dt * Number(params["rate"]);
        while (budget >= 1) {
          budget -= 1;
          angle += 0.37;
          const direction = new Vector3(Math.cos(angle), 0, Math.sin(angle));
          const speed = 3 + Math.sin(angle * 0.13) * 0.8;
          if (usePool) {
            // 空いている枠を 1 つ取り出して使い回す（新しく作らない）
            const slot = free.pop();
            const bullet = slot === undefined ? undefined : pool[slot];
            if (bullet) {
              bullet.position.set(0, 0.5, 0);
              bullet.velocity.copy(direction).multiplyScalar(speed);
              bullet.age = 0;
              bullet.active = true;
            } else {
              dropped++;
            }
          } else {
            // 毎回新しい弾を作る（位置と速度のベクトルも含めてメモリを確保する）
            live.push({
              position: new Vector3(0, 0.5, 0),
              velocity: direction.multiplyScalar(speed),
              age: 0,
              active: true,
            });
            allocations++;
          }
        }
        let drawn = 0;
        if (usePool) {
          for (const [i, bullet] of pool.entries()) {
            if (!bullet.active) {
              continue;
            }
            bullet.age += dt;
            if (bullet.age > LIFE) {
              // 消えた弾は捨てずに空きへ戻す
              bullet.active = false;
              free.push(i);
              continue;
            }
            bullet.position.addScaledVector(bullet.velocity, dt);
            if (drawn < MAX_DRAW) {
              matrix.makeTranslation(
                bullet.position.x,
                bullet.position.y,
                bullet.position.z
              );
              bulletsMesh.setMatrixAt(drawn++, matrix);
            }
          }
          for (const [i, rect] of rects.entries()) {
            rect.setAttribute(
              "fill",
              pool[i]?.active === true ? palette.lime : "#2b3748"
            );
          }
        } else {
          const survivors: Bullet[] = [];
          for (const bullet of live) {
            bullet.age += dt;
            if (bullet.age > LIFE) {
              // 捨てた弾はごみになる
              garbage += BYTES_PER_BULLET;
              continue;
            }
            bullet.position.addScaledVector(bullet.velocity, dt);
            survivors.push(bullet);
            if (drawn < MAX_DRAW) {
              matrix.makeTranslation(
                bullet.position.x,
                bullet.position.y,
                bullet.position.z
              );
              bulletsMesh.setMatrixAt(drawn++, matrix);
            }
          }
          live = survivors;
          if (garbage > GC_THRESHOLD) {
            garbage = 0;
            collections++;
            gcFlash = 0.25;
          }
        }
        bulletsMesh.count = drawn;
        bulletsMesh.instanceMatrix.needsUpdate = true;
        gcFlash = Math.max(0, gcFlash - dt);
        turret.material.color.copy(
          new Color(gcFlash > 0 ? palette.coral : palette.sky)
        );
        graph.push([garbage / 1_000_000]);
        const active = usePool ? poolSize - free.length : live.length;
        context.readout("飛んでいる弾", `${active}`);
        context.readout(
          usePool ? "プールの空き" : "作った弾の累計",
          usePool ? `${free.length} / ${poolSize}` : `${allocations}`
        );
        context.readout(
          usePool ? "枠が足りずに撃てなかった弾" : "ガベージコレクションの回数",
          usePool ? `${dropped}` : `${collections}`
        );
        context.caption(
          usePool
            ? dropped > 0
              ? "プールの枠が足りず、撃てなかった弾がある。プールの大きさは、同時に存在する最大数（撃つ速さ × 寿命）より少し多めにする。足りないときに枠を増やす作りにすると、そのときだけメモリを確保する。"
              : "最初に決まった数の弾を作っておき、撃つときは空いている枠を取り出し、消えたら空きに戻す。新しくメモリを確保しないので、ごみが出ず、グラフは 0 のまま。枠の図で、弾が出入りする様子がわかる。"
            : "撃つたびに新しい弾（とその中身）を作り、消えたら捨てる。捨てた弾はごみとして溜まり（右下）、一定量を超えるとガベージコレクションが走る。そのあいだゲームが一瞬止まるので、激しい場面ほどカクつきの原因になる（砲台が赤く光る）。"
        );
      },
      dispose() {
        bulletsMesh.dispose();
      },
    };
  },
};
