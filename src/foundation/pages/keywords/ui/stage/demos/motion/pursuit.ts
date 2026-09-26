import { Group, Mesh, OctahedronGeometry, RingGeometry, Vector3 } from "three";
import { arrowheadGeometry, limit } from "../../agents";
import {
  marker,
  palette,
  pointCloud,
  polyline,
  standard,
  trail,
} from "../../kit";
import type { DemoModule } from "../../types";

const HEIGHT = 0.6;
const LAUNCHER = new Vector3(-4.5, HEIGHT, 2.8);
const HIT_RADIUS = 0.4;
const SPARKS = 120;

type Missile = {
  predict: boolean;
  position: Vector3;
  velocity: Vector3;
  flight: number;
  mesh: Mesh;
  line: ReturnType<typeof trail>;
  hits: number;
  totalTime: number;
};

const average = (missile: Missile) =>
  missile.hits > 0
    ? `${(missile.totalTime / missile.hits).toFixed(2)} 秒（${missile.hits} 回）`
    : "—";

export const demo: DemoModule = {
  alt: "蛇行しながら飛ぶ標的を 2 発のミサイルが追う。現在位置を追う赤いミサイルは標的の後ろを追いかけ回して遠回りし、未来位置を予測する水色のミサイルは標的の進路の先へ回り込んで早く命中する。",
  camera: { position: [0, 10, 7], target: [0, 0, 0.2] },
  bloom: { strength: 0.8, radius: 0.4, threshold: 0.8 },
  controls: [
    {
      type: "range",
      key: "targetSpeed",
      label: "標的の速さ",
      min: 1,
      max: 5,
      step: 0.1,
      value: 3,
    },
    {
      type: "range",
      key: "lead",
      label: "予測の強さ（先読み時間の倍率）",
      min: 0,
      max: 2,
      step: 0.05,
      value: 1,
      hint: "0 にすると水色のミサイルもただのシークになります。",
    },
    {
      type: "range",
      key: "turn",
      label: "ミサイルの旋回力",
      min: 3,
      max: 25,
      step: 0.5,
      value: 9,
    },
    { type: "toggle", key: "predicted", label: "予測地点を表示", value: true },
  ],
  legend: [
    { color: palette.coral, label: "現在位置を追う（シーク）" },
    { color: palette.cyan, label: "未来位置を追う（予測追跡）" },
    { color: palette.lime, label: "標的" },
  ],
  setup(context) {
    const { scene, params } = context;
    const targetGroup = new Group();
    const body = new Mesh(
      new OctahedronGeometry(0.28),
      standard(palette.lime, { emissive: 0.6, roughness: 0.3 })
    );
    targetGroup.add(body);
    const targetTrail = trail(80, palette.lime, { width: 2 });
    scene.add(targetGroup, targetTrail);
    const launcher = new Mesh(
      new RingGeometry(0.3, 0.45, 32),
      standard(palette.muted, { emissive: 0.4 })
    );
    launcher.rotation.x = -Math.PI / 2;
    launcher.position.set(LAUNCHER.x, 0.01, LAUNCHER.z);
    scene.add(launcher);
    const aimPoint = marker(palette.cyan, 0.08);
    const aimLine = polyline([], palette.cyan, {
      width: 1.2,
      dashed: true,
      dashSize: 0.1,
      gapSize: 0.08,
      opacity: 0.7,
    });
    scene.add(aimPoint, aimLine);

    const geometry = arrowheadGeometry(0.5, 0.12);
    const missiles: Missile[] = [false, true].map((predict) => {
      const color = predict ? palette.cyan : palette.coral;
      const mesh = new Mesh(geometry, standard(color, { emissive: 0.8 }));
      const line = trail(40, color, { width: 3 });
      scene.add(mesh, line);
      return {
        predict,
        position: LAUNCHER.clone(),
        velocity: new Vector3(0, 0, -3),
        flight: 0,
        mesh,
        line,
        hits: 0,
        totalTime: 0,
      };
    });

    const sparks = pointCloud(SPARKS, { size: 7, additive: true });
    scene.add(sparks);
    const sparkVelocity = Array.from({ length: SPARKS }, () => new Vector3());
    const sparkLife = new Float32Array(SPARKS);
    let sparkCursor = 0;
    const explode = (at: Vector3, color: string) => {
      const tint = new Vector3(
        ...(color === palette.cyan ? [0.25, 0.85, 0.8] : [0.96, 0.45, 0.43])
      );
      for (let count = 0; count < 30; count++) {
        const index = sparkCursor;
        sparkCursor = (sparkCursor + 1) % SPARKS;
        sparks.positions[index * 3] = at.x;
        sparks.positions[index * 3 + 1] = at.y;
        sparks.positions[index * 3 + 2] = at.z;
        sparkVelocity[index]
          ?.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5)
          .setLength(2 + Math.random() * 3);
        sparkLife[index] = 0.6;
        sparks.colors[index * 3] = tint.x;
        sparks.colors[index * 3 + 1] = tint.y;
        sparks.colors[index * 3 + 2] = tint.z;
      }
    };

    const targetPosition = new Vector3();
    const targetVelocity = new Vector3();
    const previousTarget = new Vector3();
    const aim = new Vector3();
    const desired = new Vector3();
    const steer = new Vector3();
    let phase = 0;
    const missileSpeed = 5.2;

    return {
      update({ dt }) {
        const speed = Number(params["targetSpeed"]);
        phase += (dt * speed) / 4.2;
        previousTarget.copy(targetPosition);
        targetPosition.set(
          Math.cos(phase) * 3.6 + Math.sin(phase * 3) * 0.8,
          HEIGHT,
          Math.sin(phase) * 2.4
        );
        if (dt > 0) {
          targetVelocity
            .copy(targetPosition)
            .sub(previousTarget)
            .divideScalar(dt);
        }
        targetGroup.position.copy(targetPosition);
        body.rotation.y += dt * 3;
        targetTrail.push(targetPosition);

        const lead = Number(params["lead"]);
        const turn = Number(params["turn"]);
        for (const missile of missiles) {
          missile.flight += dt;
          aim.copy(targetPosition);
          if (missile.predict) {
            const time =
              (missile.position.distanceTo(targetPosition) / missileSpeed) *
              lead;
            aim.addScaledVector(targetVelocity, time);
            aimPoint.position.copy(aim);
            aimLine.setPoints([targetPosition, aim]);
          }
          desired
            .copy(aim)
            .sub(missile.position)
            .setY(0)
            .setLength(missileSpeed);
          steer.copy(desired).sub(missile.velocity);
          limit(steer, turn);
          missile.velocity.addScaledVector(steer, dt);
          limit(missile.velocity, missileSpeed);
          missile.position.addScaledVector(missile.velocity, dt);
          missile.mesh.position.copy(missile.position);
          missile.mesh.lookAt(missile.position.clone().add(missile.velocity));
          missile.line.push(missile.position);
          if (
            missile.position.distanceTo(targetPosition) < HIT_RADIUS ||
            missile.flight > 8
          ) {
            if (missile.flight <= 8) {
              missile.hits++;
              missile.totalTime += missile.flight;
              explode(
                missile.position,
                missile.predict ? palette.cyan : palette.coral
              );
            }
            missile.position.copy(LAUNCHER);
            missile.velocity.set(0, 0, -3);
            missile.flight = 0;
            missile.line.reset();
          }
        }
        const showAim = params["predicted"] === true && lead > 0;
        aimPoint.visible = showAim;
        aimLine.visible = showAim;

        for (let index = 0; index < SPARKS; index++) {
          const life = (sparkLife[index] ?? 0) - dt;
          sparkLife[index] = life;
          const velocity = sparkVelocity[index];
          if (life > 0 && velocity) {
            sparks.positions[index * 3] =
              (sparks.positions[index * 3] ?? 0) + velocity.x * dt;
            sparks.positions[index * 3 + 1] =
              (sparks.positions[index * 3 + 1] ?? 0) + velocity.y * dt;
            sparks.positions[index * 3 + 2] =
              (sparks.positions[index * 3 + 2] ?? 0) + velocity.z * dt;
            velocity.y -= 6 * dt;
          } else {
            sparks.positions[index * 3 + 1] = -100;
          }
        }
        sparks.commit();

        const [seeker, pursuer] = missiles;
        if (seeker && pursuer) {
          context.readout("シークの平均命中時間", average(seeker));
          context.readout("予測追跡の平均命中時間", average(pursuer));
        }
        context.caption(
          "予測追跡は『今の距離を自分の速さで割った時間』だけ先の標的の位置を狙う。動く相手の進路へ回り込むので、追いかけ回すより短い経路で届く。"
        );
      },
    };
  },
};
