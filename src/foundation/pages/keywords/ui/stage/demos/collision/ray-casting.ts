import {
  BoxGeometry,
  BufferAttribute,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import type { MeshStandardMaterial } from "three";
import {
  arrow,
  marker,
  palette,
  polyline,
  segments,
  standard,
} from "../../kit";
import { mannequin, walkPose } from "../../mannequin";
import type { DemoModule } from "../../types";

type Hit = { t: number; normal: Vector3 };
type Shape =
  | {
      kind: "sphere";
      center: Vector3;
      radius: number;
      mesh: Mesh;
      material: MeshStandardMaterial;
    }
  | {
      kind: "box";
      min: Vector3;
      max: Vector3;
      mesh: Mesh;
      material: MeshStandardMaterial;
    };

/** 光線と球：|o + t d - c|² = r² の小さい方の解。 */
function raySphere(
  origin: Vector3,
  dir: Vector3,
  center: Vector3,
  radius: number
): Hit | null {
  const oc = origin.clone().sub(center);
  const b = oc.dot(dir);
  const c = oc.lengthSq() - radius * radius;
  const discriminant = b * b - c;
  if (discriminant < 0) {
    return null;
  }
  const t = -b - Math.sqrt(discriminant);
  if (t < 1e-4) {
    return null;
  }
  const point = origin.clone().addScaledVector(dir, t);
  return { t, normal: point.sub(center).normalize() };
}

/** 光線と軸平行な箱：各軸の板（スラブ）に入る時刻の最大と出る時刻の最小を比べる。 */
function rayBox(
  origin: Vector3,
  dir: Vector3,
  min: Vector3,
  max: Vector3
): Hit | null {
  let enter = Number.NEGATIVE_INFINITY;
  let exit = Number.POSITIVE_INFINITY;
  const normal = new Vector3();
  for (const axis of ["x", "y", "z"] as const) {
    const d = dir[axis];
    if (Math.abs(d) < 1e-9) {
      if (origin[axis] < min[axis] || origin[axis] > max[axis]) {
        return null;
      }
      continue;
    }
    const t0 = (min[axis] - origin[axis]) / d;
    const t1 = (max[axis] - origin[axis]) / d;
    const near = Math.min(t0, t1);
    const far = Math.max(t0, t1);
    if (near > enter) {
      enter = near;
      normal.set(0, 0, 0);
      normal[axis] = d > 0 ? -1 : 1;
    }
    exit = Math.min(exit, far);
  }
  if (enter > exit || enter < 1e-4) {
    return null;
  }
  return { t: enter, normal };
}

const ground = (x: number) =>
  0.45 * Math.sin(0.8 * x) + 0.22 * Math.sin(2.3 * x + 1) - 0.1;

export const demo: DemoModule = {
  alt: "光線（レイ）と物体の交差を調べるレイキャストのデモ。照準のモードでは、銃口からカーソルの方向へレーザーを飛ばし、球や箱との交点をすべて計算して、いちばん近いものを当たりとする。当たった点の法線（白い矢印）で反射させると、跳弾になる。接地のモードでは、キャラクターの腰から真下へ光線を飛ばして地面までの距離を測り、接地しているかと、坂の傾きを求める。光線が短すぎると、下り坂で地面を見失い、空中にいると判定されてしまう。",
  camera: { position: [0, 8, 8.5], target: [0, 0.3, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "使い方",
      value: "aim",
      options: [
        { value: "aim", label: "照準と跳弾" },
        { value: "ground", label: "接地判定" },
      ],
    },
    {
      type: "range",
      key: "bounces",
      label: "反射の回数（照準）",
      min: 0,
      max: 6,
      step: 1,
      value: 2,
    },
    {
      type: "range",
      key: "reach",
      label: "足元から下へ調べる長さ（接地）",
      min: 0.02,
      max: 0.6,
      step: 0.02,
      value: 0.3,
    },
    {
      type: "range",
      key: "speed",
      label: "歩く速さ（接地）",
      min: 0.5,
      max: 5,
      step: 0.1,
      value: 2.5,
    },
  ],
  legend: [
    { color: palette.coral, label: "いちばん近い当たり / 光線" },
    { color: palette.amber, label: "当たったが、もっと近い物がある" },
    { color: palette.ink, label: "当たった点の法線" },
    { color: palette.lime, label: "地面に届いた光線（接地）" },
  ],
  hint: "照準：カーソルの方向へ撃ちます（カーソルがないときは自動で振ります）",
  setup(context) {
    const { scene, params } = context;
    const aimGroup = new Group();
    const groundGroup = new Group();
    scene.add(aimGroup, groundGroup);

    const shapes: Shape[] = [];
    const addSphere = (x: number, z: number, radius: number) => {
      const material = standard("#8a97ab");
      const mesh = new Mesh(new SphereGeometry(radius, 32, 20), material);
      mesh.position.set(x, radius, z);
      mesh.castShadow = true;
      aimGroup.add(mesh);
      shapes.push({
        kind: "sphere",
        center: mesh.position.clone(),
        radius,
        mesh,
        material,
      });
    };
    const addBox = (x: number, z: number, w: number, h: number, d: number) => {
      const material = standard("#8a97ab");
      const mesh = new Mesh(new BoxGeometry(w, h, d), material);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      aimGroup.add(mesh);
      shapes.push({
        kind: "box",
        min: new Vector3(x - w / 2, 0, z - d / 2),
        max: new Vector3(x + w / 2, h, z + d / 2),
        mesh,
        material,
      });
    };
    addSphere(-1.2, -1.6, 0.8);
    addSphere(2.4, 1.4, 0.6);
    addSphere(0.4, 2.6, 0.5);
    addBox(1.6, -1.8, 1.2, 1.4, 0.8);
    addBox(-0.4, 0.6, 0.6, 1.2, 1.6);
    addBox(4, -0.4, 0.5, 1.4, 2.4);
    // 外周の壁
    const wallsFrom = shapes.length;
    addBox(0, -4, 12, 0.7, 0.2);
    addBox(0, 4, 12, 0.7, 0.2);
    addBox(6, 0, 0.2, 0.7, 8);
    addBox(-6, 0, 0.2, 0.7, 8);
    const walls = new Set(shapes.slice(wallsFrom).map((shape) => shape.mesh));
    for (const shape of shapes.slice(wallsFrom)) {
      shape.material.color.set("#4b5668");
    }
    const turret = new Mesh(
      new CylinderGeometry(0.3, 0.4, 0.8, 24),
      standard(palette.sky)
    );
    turret.position.set(-5, 0.4, 0);
    turret.castShadow = true;
    aimGroup.add(turret);
    const muzzle = new Vector3(-5, 0.6, 0);
    const beam = polyline([], palette.coral, { width: 4 });
    const beamGlow = polyline([], palette.coral, { width: 10, opacity: 0.25 });
    aimGroup.add(beamGlow, beam);
    const hitMarkers = Array.from({ length: 7 }, () => {
      const m = marker(palette.coral, 0.07);
      aimGroup.add(m);
      return m;
    });
    const normals = Array.from({ length: 7 }, () => {
      const a = arrow(palette.ink, { radius: 0.018 });
      aimGroup.add(a);
      return a;
    });

    // 接地判定のモード
    const width = 16;
    const terrainGeometry = new PlaneGeometry(width, 2.4, 200, 1);
    terrainGeometry.rotateX(-Math.PI / 2);
    const positions = terrainGeometry.getAttribute("position");
    if (positions instanceof BufferAttribute) {
      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, ground(positions.getX(i)));
      }
      terrainGeometry.computeVertexNormals();
    }
    const terrain = new Mesh(
      terrainGeometry,
      standard("#40566f", { roughness: 0.9 })
    );
    terrain.receiveShadow = true;
    groundGroup.add(terrain);
    const man = mannequin({ accent: palette.amber });
    man.root.scale.setScalar(0.8);
    groundGroup.add(man.root);
    const feetRays = segments([], palette.lime, { width: 3 });
    const missRays = segments([], palette.coral, { width: 3 });
    const slopeArrow = arrow(palette.ink, { radius: 0.02 });
    groundGroup.add(feetRays, missRays, slopeArrow);
    const stateLabel = context.label("", { tone: "strong" });
    groundGroup.add(stateLabel);

    const base = new Color("#8a97ab");
    const nearColor = new Color(palette.coral);
    const fartherColor = new Color(palette.amber);
    let x = -6;
    let direction = 1;
    let y = ground(-6);
    let vy = 0;
    let phase = 0;
    let airTime = 0;
    let airCount = 0;
    let wasGrounded = true;

    const aim = (time: number) => {
      const point = context.pointerOnPlane({
        normal: [0, 1, 0],
        origin: [0, 0.6, 0],
      });
      const target =
        point && point.distanceTo(muzzle) > 0.5
          ? point.setY(0.6)
          : muzzle
              .clone()
              .add(
                new Vector3(
                  Math.cos(Math.sin(time * 0.4) * 0.9),
                  0,
                  Math.sin(Math.sin(time * 0.4) * 0.9)
                )
              );
      let origin = muzzle.clone();
      let dir = target.sub(muzzle).setY(0).normalize();
      turret.rotation.y = Math.atan2(dir.x, dir.z);
      const points = [origin.clone()];
      const colors = new Map<Mesh, Color>();
      let tested = 0;
      let first = "";
      let firstDistance = 0;
      const bounces = Number(params["bounces"]);
      for (const m of hitMarkers) {
        m.visible = false;
      }
      for (const a of normals) {
        a.visible = false;
      }
      for (let bounce = 0; bounce <= bounces; bounce++) {
        let best: (Hit & { shape: Shape }) | null = null;
        for (const shape of shapes) {
          tested++;
          const hit =
            shape.kind === "sphere"
              ? raySphere(origin, dir, shape.center, shape.radius)
              : rayBox(origin, dir, shape.min, shape.max);
          if (hit) {
            if (!colors.has(shape.mesh)) {
              colors.set(shape.mesh, fartherColor);
            }
            if (!best || hit.t < best.t) {
              best = { ...hit, shape };
            }
          }
        }
        if (!best) {
          points.push(origin.clone().addScaledVector(dir, 20));
          break;
        }
        colors.set(best.shape.mesh, nearColor);
        const hitPoint = origin.clone().addScaledVector(dir, best.t);
        points.push(hitPoint.clone());
        if (bounce === 0) {
          first = best.shape.kind === "sphere" ? "球" : "箱";
          firstDistance = best.t;
        }
        const markerMesh = hitMarkers[bounce];
        const normalArrow = normals[bounce];
        if (markerMesh && normalArrow) {
          markerMesh.visible = true;
          markerMesh.position.copy(hitPoint);
          normalArrow.visible = true;
          normalArrow.set(hitPoint, best.normal.clone().multiplyScalar(0.7));
        }
        // 反射：d' = d - 2 (d・n) n
        dir = dir
          .clone()
          .addScaledVector(best.normal, -2 * dir.dot(best.normal))
          .setY(0)
          .normalize();
        origin = hitPoint.addScaledVector(best.normal, 1e-3);
      }
      beam.setPoints(points);
      beamGlow.setPoints(points);
      for (const shape of shapes) {
        if (!walls.has(shape.mesh)) {
          shape.material.color.copy(colors.get(shape.mesh) ?? base);
        }
      }
      context.readout(
        "最初に当たった物",
        first ? `${first}（距離 ${firstDistance.toFixed(2)}）` : "なし"
      );
      context.readout("調べた物体の数（のべ）", `${tested}`);
      context.caption(
        "銃口から光線を飛ばし、すべての物体との交点を計算して、距離 t がいちばん小さい物を当たりとする（赤）。光線上にあっても、もっと近い物の陰にある物（黄）は当たらない。当たった点の法線（白い矢印）で向きを反射させると、跳弾になる。"
      );
    };

    const walk = (dt: number) => {
      const speed = Number(params["speed"]);
      const reach = Number(params["reach"]);
      x += direction * speed * dt;
      if (x > 6.5 || x < -6.5) {
        direction *= -1;
        x = Math.max(-6.5, Math.min(6.5, x));
      }
      // 腰から真下へ 3 本の光線を飛ばし、地面までの距離を測る
      const hip = 0.75;
      const hits: Vector3[] = [];
      const misses: Vector3[] = [];
      let groundY: number | null = null;
      for (const dx of [-0.25, 0, 0.25]) {
        const px = x + dx;
        const top = y + hip;
        const surface = ground(px);
        const distance = top - surface;
        const length = hip + reach;
        if (distance >= 0 && distance <= length) {
          hits.push(new Vector3(px, top, 0), new Vector3(px, surface, 0));
          if (dx === 0) {
            groundY = surface;
          }
        } else {
          misses.push(
            new Vector3(px, top, 0),
            new Vector3(px, top - length, 0)
          );
        }
      }
      const grounded = groundY !== null && vy <= 0.01;
      if (grounded && groundY !== null) {
        y = groundY;
        vy = 0;
        airTime = 0;
      } else {
        vy -= 9.8 * dt;
        y += vy * dt;
        airTime += dt;
        if (y < ground(x)) {
          y = ground(x);
          vy = 0;
        }
      }
      if (wasGrounded && !grounded) {
        airCount++;
      }
      wasGrounded = grounded;
      feetRays.setPoints(hits);
      feetRays.visible = hits.length > 0;
      missRays.setPoints(misses);
      missRays.visible = misses.length > 0;
      man.root.position.set(x, y, 0);
      man.root.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      phase = (phase + speed * dt * 0.6) % 1;
      if (grounded) {
        walkPose(man, phase, 1);
      } else {
        man.rest();
        man.upperArm.L.rotation.z = 1.2;
        man.upperArm.R.rotation.z = -1.2;
      }
      // 坂の傾き：地面の法線
      const slope = (ground(x + 0.01) - ground(x - 0.01)) / 0.02;
      const normal = new Vector3(-slope, 1, 0).normalize();
      slopeArrow.visible = grounded;
      slopeArrow.set(new Vector3(x, y + 0.02, 0.5), normal.multiplyScalar(0.8));
      stateLabel.setText(grounded ? "接地" : "空中");
      stateLabel.position.set(x, y + 2, 0);
      context.readout(
        "状態",
        grounded ? "接地" : `空中（${airTime.toFixed(2)} 秒）`
      );
      context.readout(
        "坂の角度",
        `${((Math.atan(Math.abs(slope)) * 180) / Math.PI).toFixed(0)}°`
      );
      context.readout("接地が途切れた回数", `${airCount}`);
      context.caption(
        "腰から真下へ光線を飛ばし、足元から「調べる長さ」以内に地面があれば接地とみなして、足を地面の高さに合わせる。調べる長さが短いと、速く下り坂を歩いたときに地面が光線の届かない所まで下がり、空中と判定されて小さく落ちる（接地が途切れる）。白い矢印は当たった点の法線で、坂の傾きがわかる。"
      );
    };

    let mode = "";
    return {
      update({ dt, time }) {
        const next = String(params["mode"]);
        if (next !== mode) {
          mode = next;
          airCount = 0;
          // 接地は横から見る方がわかりやすい
          if (mode === "ground") {
            context.camera.position.set(0, 2.4, 9.5);
          } else {
            context.camera.position.set(0, 8, 8.5);
          }
          context.readout("状態", "");
          context.readout("坂の角度", "");
          context.readout("接地が途切れた回数", "");
          context.readout("最初に当たった物", "");
          context.readout("調べた物体の数（のべ）", "");
        }
        aimGroup.visible = mode === "aim";
        groundGroup.visible = mode === "ground";
        if (mode === "aim") {
          aim(time);
        } else {
          walk(dt);
        }
      },
    };
  },
};
