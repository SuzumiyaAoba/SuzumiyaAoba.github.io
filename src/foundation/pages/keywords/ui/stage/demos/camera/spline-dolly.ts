import {
  BoxGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  Group,
  Mesh,
  PerspectiveCamera,
  Vector3,
} from "three";
import { palette, polyline, segments, standard } from "../../kit";
import { mannequin, walkPose } from "../../mannequin";
import { pictureInPicture } from "../../platformer";
import type { DemoModule } from "../../types";

/** プレイヤーが歩く道（S 字の通路）。 */
const PATH = new CatmullRomCurve3(
  [
    new Vector3(-9, 0, 5),
    new Vector3(-5, 0, 1.5),
    new Vector3(-1, 0, 4),
    new Vector3(3, 0, 1),
    new Vector3(4.5, 0, -3.5),
    new Vector3(0.5, 0, -6.5),
    new Vector3(-5, 0, -5.5),
  ],
  false,
  "centripetal"
);
/** カメラを載せるレール。道の外側を、柱をよけて高い位置に通してある。 */
const RAIL = new CatmullRomCurve3(
  [
    new Vector3(-10, 3.2, 10),
    new Vector3(-4.5, 3.6, 7.5),
    new Vector3(1.5, 4, 8.5),
    new Vector3(8.5, 4.4, 4),
    new Vector3(9.5, 4.8, -3.5),
    new Vector3(4, 5, -11),
    new Vector3(-5.5, 4.6, -11.5),
  ],
  false,
  "centripetal"
);
/** 比較用の固定カメラ。道の外側から柱ごしに見る位置。 */
const FIXED = new Vector3(-14, 6, -2);
/** 柱は、レールから人への視線をさえぎらない位置に置いてある。 */
const PILLARS = [
  new Vector3(1.8, 0, -2.4),
  new Vector3(-7.5, 0, -1.5),
  new Vector3(-1.5, 0, -1.2),
  new Vector3(-8, 0, -5.2),
];
const SPEED = 1.9;
const RAIL_SAMPLES = 400;

export const demo: DemoModule = {
  alt: "カメラを見えないレール（スプライン曲線）に載せ、プレイヤーの進み具合に合わせてレールの上を滑らせるスプラインドリーのデモ。人が S 字の通路を行き来し、外側の高い位置に通したレールの上をカメラが追いかける。レールは柱をよけるように作ってあるので、カメラが壁にめり込んだり、柱で人が隠れたりしない。固定カメラと比べると、人が遠ざかって小さくなったり柱の陰に隠れたりする。左下の小窓がカメラの映像。",
  camera: { position: [16, 18, 20], target: [0, 1, -1], orbit: true },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "カメラの位置の決め方",
      value: "progress",
      options: [
        { value: "progress", label: "道の進み具合をレールに写す" },
        { value: "nearest", label: "レール上で一番近い点" },
        { value: "fixed", label: "固定カメラ（比較用）" },
      ],
    },
    {
      type: "range",
      key: "damping",
      label: "カメラの追いかけ方",
      min: 0.5,
      max: 20,
      step: 0.5,
      value: 5,
      hint: "小さいほど、カメラがレールの上をゆっくり遅れてついてきます。",
    },
    {
      type: "range",
      key: "speed",
      label: "歩く速さ",
      min: 0.3,
      max: 2,
      step: 0.05,
      value: 1,
    },
  ],
  legend: [
    { color: palette.amber, label: "カメラのレール" },
    { color: palette.sky, label: "人の歩く道" },
    { color: palette.coral, label: "カメラから人への視線" },
  ],
  setup(context) {
    const { scene, params } = context;
    const pathLength = PATH.getLength();
    scene.add(
      polyline(
        PATH.getSpacedPoints(160).map((point) => point.setY(0.03)),
        palette.sky,
        { width: 3, opacity: 0.8 }
      )
    );
    const railPoints = RAIL.getSpacedPoints(RAIL_SAMPLES);
    scene.add(polyline(railPoints, palette.amber, { width: 3 }));
    // レールの枕木と支柱
    const ties: Vector3[] = [];
    for (let index = 0; index <= 24; index++) {
      const u = index / 24;
      const point = RAIL.getPointAt(u);
      ties.push(point.clone(), point.clone().setY(0));
    }
    const posts = segments(ties, palette.muted, { width: 1, opacity: 0.35 });
    scene.add(posts);

    const pillarMaterial = standard("#7b8698", { roughness: 0.7 });
    for (const position of PILLARS) {
      const pillar = new Mesh(new BoxGeometry(1.2, 4.5, 1.2), pillarMaterial);
      pillar.position.copy(position).setY(2.25);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    }

    const man = mannequin({ accent: palette.amber });
    scene.add(man.root);

    // カメラの模型（本体とレンズ）
    const gizmo = new Group();
    const body = new Mesh(new BoxGeometry(0.5, 0.4, 0.7), standard("#2a3240"));
    const lens = new Mesh(
      new ConeGeometry(0.22, 0.4, 16),
      standard(palette.coral, { emissive: 0.4 })
    );
    lens.rotation.x = -Math.PI / 2;
    lens.position.z = 0.5;
    gizmo.add(body, lens);
    scene.add(gizmo);
    const sight = polyline([], palette.coral, { width: 2, opacity: 0.8 });
    scene.add(sight);
    const pathSkip = new Set([gizmo, sight, posts]);

    const view = new PerspectiveCamera(45, 16 / 9, 0.1, 120);
    scene.add(view);
    pictureInPicture(context, view, (inset) => {
      for (const object of pathSkip) {
        object.visible = !inset;
      }
    });

    let progress = 0;
    let direction = 1;
    let phase = 0;
    let railU = 0;
    const cameraPosition = RAIL.getPointAt(0);
    const nearestU = (target: Vector3, around: number) => {
      // 前回の位置の近くだけを探す。全体から探すと、道が折り返す所でレールの反対側へ飛ぶことがある
      let best = around;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let step = -40; step <= 40; step++) {
        const u = Math.min(1, Math.max(0, around + step / RAIL_SAMPLES));
        const point = railPoints[Math.round(u * RAIL_SAMPLES)];
        const distance = point
          ? point.distanceToSquared(target)
          : Number.POSITIVE_INFINITY;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = u;
        }
      }
      return best;
    };

    return {
      update({ dt }) {
        if (dt <= 0) {
          return;
        }
        const h = Math.min(dt, 1 / 30);
        const speed = SPEED * Number(params["speed"]);
        progress += (direction * speed * h) / pathLength;
        if (progress >= 1 || progress <= 0) {
          progress = Math.min(1, Math.max(0, progress));
          direction *= -1;
        }
        const position = PATH.getPointAt(progress);
        const tangent = PATH.getTangentAt(progress).multiplyScalar(direction);
        man.root.position.copy(position);
        man.root.rotation.y = Math.atan2(tangent.x, tangent.z);
        phase = (phase + (speed * h) / 1.5) % 1;
        walkPose(man, phase, Math.min(1.2, speed / 1.6));

        const focus = position.clone().setY(1.2);
        const mode = String(params["mode"]);
        let wanted = FIXED.clone();
        if (mode === "progress") {
          railU = progress;
          wanted = RAIL.getPointAt(railU);
        } else if (mode === "nearest") {
          railU = nearestU(focus, railU);
          wanted = RAIL.getPointAt(railU);
        }
        cameraPosition.lerp(
          wanted,
          1 - Math.exp(-Number(params["damping"]) * h)
        );
        view.position.copy(cameraPosition);
        view.lookAt(focus);
        gizmo.position.copy(cameraPosition);
        gizmo.lookAt(focus);
        sight.setPoints([cameraPosition.clone(), focus]);

        const distance = cameraPosition.distanceTo(focus);
        context.readout("カメラと人の距離", `${distance.toFixed(1)} m`);
        context.readout(
          "レール上の位置",
          mode === "fixed" ? "—" : `${Math.round(railU * 100)}%`
        );
        let caption =
          "人が道のどこまで進んだか（0〜100%）を、そのままレールの上の位置に写す。レールの形は自由に作れるので、柱をよけながら、いつも同じくらいの距離と角度で人を映せる。";
        if (mode === "nearest") {
          caption =
            "カメラを、レールの上で人に一番近い点へ動かす。道とレールの形が大きく違っても使えるが、レール全体から探すと折り返しで反対側へ飛ぶので、前回の位置の近くだけを探している。";
        } else if (mode === "fixed") {
          caption =
            "カメラが一か所に固定されていると、人が遠ざかって小さくなったり、柱の陰に隠れたりする。視線（赤い線）が柱を通り抜けているときは、小窓で人が見えていない。";
        }
        context.caption(caption);
      },
    };
  },
};
