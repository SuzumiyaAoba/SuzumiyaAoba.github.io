import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, pointCloud, rng } from "../../kit";
import type { DemoModule } from "../../types";

type Face = { points: Vector3[]; inner: boolean };
type Piece = {
  mesh: Mesh;
  center: Vector3;
  local: Vector3[];
  velocity: Vector3;
  spin: Vector3;
  resting: boolean;
};

const WALL = { width: 3.4, height: 2.6, depth: 0.36 };

function quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3): Face {
  return { points: [a, b, c, d], inner: false };
}

/** 箱の 6 面（外から見て反時計回り）。 */
function boxFaces(min: Vector3, max: Vector3): Face[] {
  const c = (x: number, y: number, z: number) =>
    new Vector3(x ? max.x : min.x, y ? max.y : min.y, z ? max.z : min.z);
  return [
    quad(c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)),
    quad(c(1, 0, 0), c(0, 0, 0), c(0, 1, 0), c(1, 1, 0)),
    quad(c(1, 0, 1), c(1, 0, 0), c(1, 1, 0), c(1, 1, 1)),
    quad(c(0, 0, 0), c(0, 0, 1), c(0, 1, 1), c(0, 1, 0)),
    quad(c(0, 1, 1), c(1, 1, 1), c(1, 1, 0), c(0, 1, 0)),
    quad(c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)),
  ];
}

/**
 * 凸多面体を平面 n·x ≦ d で切り、残った側を返す。
 * 各面をサザーランド・ホッジマン法で切り、切り口の点を集めて新しい面（断面）にする。
 */
function clip(faces: Face[], normal: Vector3, d: number): Face[] {
  const result: Face[] = [];
  const cut: Vector3[] = [];
  for (const face of faces) {
    const output: Vector3[] = [];
    const { points } = face;
    for (let index = 0; index < points.length; index++) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      if (!current || !next) {
        continue;
      }
      const dc = normal.dot(current) - d;
      const dn = normal.dot(next) - d;
      if (dc <= 0) {
        output.push(current);
      }
      if ((dc < 0 && dn > 0) || (dc > 0 && dn < 0)) {
        const point = current.clone().lerp(next, dc / (dc - dn));
        output.push(point);
        cut.push(point);
      }
    }
    if (output.length >= 3) {
      result.push({ points: output, inner: face.inner });
    }
  }
  if (cut.length >= 3) {
    // 切り口の点を、平面の法線の周りに角度順に並べる（外から見て反時計回り）
    const center = new Vector3();
    for (const point of cut) {
      center.add(point);
    }
    center.divideScalar(cut.length);
    const u = new Vector3().subVectors(cut[0] ?? center, center).normalize();
    const v = new Vector3().crossVectors(normal, u);
    const unique: Vector3[] = [];
    for (const point of cut) {
      if (!unique.some((other) => other.distanceToSquared(point) < 1e-10)) {
        unique.push(point);
      }
    }
    unique.sort((a, b) => {
      const pa = a.clone().sub(center);
      const pb = b.clone().sub(center);
      return (
        Math.atan2(pa.dot(v), pa.dot(u)) - Math.atan2(pb.dot(v), pb.dot(u))
      );
    });
    if (unique.length >= 3) {
      result.push({ points: unique, inner: true });
    }
  }
  return result;
}

/** 種点 i のボロノイ領域：箱を、ほかのすべての種点との垂直二等分面で切り取る。 */
function voronoiCell(
  seeds: readonly Vector3[],
  index: number,
  min: Vector3,
  max: Vector3
) {
  const seed = seeds[index] ?? new Vector3();
  let faces = boxFaces(min, max);
  const others = seeds
    .map((other, j) => ({ other, j, distance: other.distanceTo(seed) }))
    .filter(({ j }) => j !== index)
    .toSorted((a, b) => a.distance - b.distance);
  for (const { other, distance } of others) {
    // 領域が、この種点との中間の面まで届かないなら、それより遠い種点も関係ない
    let reach = 0;
    for (const face of faces) {
      for (const point of face.points) {
        reach = Math.max(reach, point.distanceTo(seed));
      }
    }
    if (reach < distance / 2) {
      break;
    }
    const normal = other.clone().sub(seed).normalize();
    const d = normal.dot(seed.clone().add(other).multiplyScalar(0.5));
    faces = clip(faces, normal, d);
  }
  return faces;
}

/** 面を三角形に分けて、外側の面と割れ口の面を別のグループにする。 */
function pieceGeometry(faces: readonly Face[], center: Vector3) {
  const outer: number[] = [];
  const inner: number[] = [];
  for (const face of faces) {
    const target = face.inner ? inner : outer;
    const [first] = face.points;
    if (!first) {
      continue;
    }
    for (let index = 1; index + 1 < face.points.length; index++) {
      for (const point of [first, face.points[index], face.points[index + 1]]) {
        target.push(
          (point?.x ?? 0) - center.x,
          (point?.y ?? 0) - center.y,
          (point?.z ?? 0) - center.z
        );
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([...outer, ...inner]), 3)
  );
  geometry.addGroup(0, outer.length / 3, 0);
  geometry.addGroup(outer.length / 3, inner.length / 3, 1);
  geometry.computeVertexNormals();
  return geometry;
}

export const demo: DemoModule = {
  alt: "壁に弾を当てると、当たった場所の周りが細かく砕けて穴が開くボロノイ破砕のデモ。壁の中に種点をばらまき、それぞれの種点に一番近い領域（ボロノイ領域）ごとに壁を切り分けて破片にする。ボロノイ領域はどれも凸な多面体になるので、箱を「隣の種点との垂直二等分面」で次々に切り落とすだけで作れる。種点を当たった場所の近くに集めると、衝撃の中心ほど細かく砕ける。分解表示で、割れる前の切り分け方を確かめられる。",
  camera: { position: [0.6, 2.2, 6.4], target: [0, 1.2, 0], fov: 42 },
  controls: [
    { type: "button", key: "shoot", label: "壁の中央を撃つ" },
    { type: "button", key: "reset", label: "壁を元に戻す" },
    {
      type: "range",
      key: "pieces",
      label: "破片の数（種点の数）",
      min: 6,
      max: 90,
      step: 1,
      value: 40,
    },
    {
      type: "range",
      key: "focus",
      label: "当たった場所への集中",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.7,
    },
    {
      type: "range",
      key: "power",
      label: "衝撃の強さ",
      min: 0,
      max: 12,
      step: 0.5,
      value: 6,
    },
    {
      type: "range",
      key: "reach",
      label: "壁に残す破片（衝撃の弱さのしきい値）",
      min: 0,
      max: 0.8,
      step: 0.02,
      value: 0.3,
      hint: "0 にすると、すべての破片が崩れ落ちます。",
    },
    {
      type: "range",
      key: "explode",
      label: "分解表示（割れる前）",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0,
    },
    {
      type: "select",
      key: "material",
      label: "素材",
      value: "stone",
      options: [
        { value: "stone", label: "石" },
        { value: "glass", label: "ガラス" },
      ],
    },
    { type: "toggle", key: "seeds", label: "種点を表示", value: false },
  ],
  legend: [
    { color: "#8f877c", label: "壁の表面" },
    { color: "#f0dcb4", label: "割れ口（切り分けた面）" },
    { color: palette.coral, label: "種点" },
  ],
  hint: "壁をクリックすると、その場所を撃ちます。",
  setup(context) {
    const { scene, params } = context;
    const root = new Group();
    scene.add(root);
    const min = new Vector3(-WALL.width / 2, 0, -WALL.depth / 2);
    const max = new Vector3(WALL.width / 2, WALL.height, WALL.depth / 2);
    const stoneOuter = new MeshStandardMaterial({
      color: "#8f877c",
      roughness: 0.85,
      flatShading: true,
    });
    const stoneInner = new MeshStandardMaterial({
      color: "#f0dcb4",
      roughness: 0.95,
      flatShading: true,
    });
    const glassOuter = new MeshStandardMaterial({
      color: "#9fd8ff",
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
      flatShading: true,
    });
    const glassInner = new MeshStandardMaterial({
      color: "#e6f7ff",
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
      flatShading: true,
    });
    const seedsView = pointCloud(120, { size: 14, color: palette.coral });
    root.add(seedsView);
    const flash = new Mesh(
      new SphereGeometry(0.2, 20, 12),
      new MeshStandardMaterial({
        color: "#ffd48a",
        emissive: "#ffb347",
        emissiveIntensity: 3,
      })
    );
    flash.visible = false;
    root.add(flash);

    let pieces: Piece[] = [];
    let broken = false;
    let flashTime = 10;
    let signature = "";
    let impact = new Vector3(0, WALL.height / 2, WALL.depth / 2);
    let buildMs = 0;

    const clear = () => {
      for (const piece of pieces) {
        root.remove(piece.mesh);
        piece.mesh.geometry.dispose();
      }
      pieces = [];
    };

    /** 当たった場所の近くほど種点が多くなるように置く。 */
    const makeSeeds = (count: number) => {
      const random = rng(7);
      const focus = Number(params["focus"]);
      const seeds: Vector3[] = [];
      for (let index = 0; index < count; index++) {
        if (random() < focus) {
          // 当たった場所からの距離を、近い所に偏らせて選ぶ
          const radius = random() ** 2 * 1.6;
          const angle = random() * Math.PI * 2;
          const point = new Vector3(
            impact.x + Math.cos(angle) * radius,
            impact.y + Math.sin(angle) * radius,
            (random() - 0.5) * WALL.depth
          );
          point.clamp(min.clone().addScalar(0.01), max.clone().subScalar(0.01));
          seeds.push(point);
        } else {
          seeds.push(
            new Vector3(
              min.x + random() * WALL.width,
              random() * WALL.height,
              (random() - 0.5) * WALL.depth
            )
          );
        }
      }
      return seeds;
    };

    const build = () => {
      clear();
      const start = performance.now();
      const seeds = makeSeeds(Number(params["pieces"]));
      const glass = params["material"] === "glass";
      for (const [index] of seeds.entries()) {
        const faces = voronoiCell(seeds, index, min, max);
        const center = new Vector3();
        let count = 0;
        for (const face of faces) {
          for (const point of face.points) {
            center.add(point);
            count++;
          }
        }
        if (count === 0) {
          continue;
        }
        center.divideScalar(count);
        const geometry = pieceGeometry(faces, center);
        const mesh = new Mesh(
          geometry,
          glass ? [glassOuter, glassInner] : [stoneOuter, stoneInner]
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.copy(center);
        root.add(mesh);
        const local: Vector3[] = [];
        for (const face of faces) {
          for (const point of face.points) {
            local.push(point.clone().sub(center));
          }
        }
        pieces.push({
          mesh,
          center: center.clone(),
          local,
          velocity: new Vector3(),
          spin: new Vector3(),
          resting: true,
        });
      }
      buildMs = performance.now() - start;
      for (const [index, seed] of seeds.entries()) {
        seedsView.positions.set([seed.x, seed.y, seed.z], index * 3);
      }
      seedsView.geometry.setDrawRange(0, seeds.length);
      seedsView.commit();
      broken = false;
    };

    const shoot = (point: Vector3) => {
      impact = point.clone();
      build();
      broken = true;
      flashTime = 0;
      flash.position.copy(impact);
      const power = Number(params["power"]);
      const random = rng(11);
      for (const piece of pieces) {
        const away = piece.center.clone().sub(impact);
        const distance = away.length();
        // 当たった場所に近い破片ほど強く、奥（-z）と外側へ飛ばす
        const falloff = Math.exp(-distance / 0.9);
        // 衝撃が弱い破片は壁に残す（穴の開いた壁になる）
        if (falloff < Number(params["reach"])) {
          continue;
        }
        const strength = power * falloff;
        away
          .normalize()
          .multiplyScalar(0.6)
          .add(new Vector3(0, 0.2, -1));
        piece.velocity.copy(away.normalize().multiplyScalar(strength));
        piece.velocity.x += (random() - 0.5) * 0.4;
        piece.spin
          .set(random() - 0.5, random() - 0.5, random() - 0.5)
          .multiplyScalar(strength * 2.5);
        piece.resting = false;
      }
    };

    context.onPick(
      (point) => {
        if (
          Math.abs(point.x) < WALL.width / 2 &&
          point.y > 0 &&
          point.y < WALL.height
        ) {
          shoot(point);
        }
      },
      { normal: [0, 0, 1], origin: [0, 0, WALL.depth / 2] }
    );

    const rotation = new Quaternion();
    const world = new Vector3();
    return {
      action(key) {
        if (key === "shoot") {
          shoot(new Vector3(0, WALL.height / 2, WALL.depth / 2));
        } else if (key === "reset") {
          signature = "";
        }
      },
      update({ dt }) {
        const next = [
          params["pieces"],
          params["focus"],
          params["material"],
        ].join("|");
        if (next !== signature) {
          signature = next;
          impact = new Vector3(0, WALL.height / 2, WALL.depth / 2);
          build();
        }
        seedsView.visible = params["seeds"] === true && !broken;
        flashTime += dt;
        flash.visible = flashTime < 0.25;
        flash.scale.setScalar(1 + flashTime * 12);

        if (broken) {
          const h = Math.min(dt, 1 / 30);
          for (const piece of pieces) {
            if (piece.resting) {
              continue;
            }
            piece.velocity.y -= 9.8 * h;
            piece.mesh.position.addScaledVector(piece.velocity, h);
            const angle = piece.spin.length() * h;
            if (angle > 1e-6) {
              rotation.setFromAxisAngle(piece.spin.clone().normalize(), angle);
              piece.mesh.quaternion.premultiply(rotation);
            }
            // 床との当たり：一番低い頂点が床より下なら押し上げて跳ね返す
            let lowest = Number.POSITIVE_INFINITY;
            for (const point of piece.local) {
              world
                .copy(point)
                .applyQuaternion(piece.mesh.quaternion)
                .add(piece.mesh.position);
              lowest = Math.min(lowest, world.y);
            }
            if (lowest < 0) {
              piece.mesh.position.y -= lowest;
              if (piece.velocity.y < 0) {
                piece.velocity.y *= -0.25;
              }
              piece.velocity.x *= 0.8;
              piece.velocity.z *= 0.8;
              piece.spin.multiplyScalar(0.8);
              if (
                piece.velocity.lengthSq() < 0.02 &&
                piece.spin.lengthSq() < 0.05
              ) {
                piece.resting = true;
              }
            }
          }
        } else {
          // 分解表示：破片をそれぞれの中心から外へ少し離す
          const explode = Number(params["explode"]);
          const wallCenter = new Vector3(0, WALL.height / 2, 0);
          for (const piece of pieces) {
            const offset = piece.center
              .clone()
              .sub(wallCenter)
              .multiplyScalar(explode * 0.6);
            offset.z += explode * 0.4 * Math.sign(piece.center.z || 1);
            piece.mesh.position.copy(piece.center).add(offset);
            piece.mesh.scale.setScalar(1 - explode * 0.15);
            piece.mesh.quaternion.identity();
          }
        }
        context.readout("破片", `${pieces.length}`);
        context.readout("切り分けにかかった時間", `${buildMs.toFixed(1)} ms`);
        context.caption(
          broken
            ? "当たった場所の近くに種点を多く置いたので、中心ほど細かく砕けて飛び、衝撃の弱い外側の大きな塊は壁に残って穴が開く。破片はどれも凸な多面体なので、物理エンジンの当たり判定にもそのまま使いやすい。"
            : "壁の中に種点を置き、それぞれの種点に一番近い領域ごとに切り分けておく。「分解表示」を動かすと切り分け方が見える。ゲームでは、割れ方を前もって作っておき（プリフラクチャー）、壊れた瞬間に一枚の壁を破片に差し替えることが多い。"
        );
      },
    };
  },
};
