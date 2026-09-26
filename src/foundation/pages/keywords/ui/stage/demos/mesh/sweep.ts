import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
} from "three";
import { palette, polyline, segments } from "../../kit";
import type { DemoModule } from "../../types";

type Profile = { points: [number, number][]; closed: boolean };

/** 断面の形（半径 1 程度）。 */
function profile(kind: string): Profile {
  const points: [number, number][] = [];
  if (kind === "star") {
    for (let index = 0; index < 10; index++) {
      const angle = (index / 10) * Math.PI * 2;
      const radius = index % 2 === 0 ? 1 : 0.45;
      points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
    return { points, closed: true };
  }
  if (kind === "square") {
    for (const [x, y] of [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ] as const) {
      points.push([x * 0.8, y * 0.5]);
    }
    return { points, closed: true };
  }
  if (kind === "road") {
    // 道路：縁石のある路面（上向き）。開いた断面
    return {
      points: [
        [-1.4, -0.2],
        [-1.4, 0.15],
        [-1.2, 0.15],
        [-1.15, 0],
        [1.15, 0],
        [1.2, 0.15],
        [1.4, 0.15],
        [1.4, -0.2],
      ],
      closed: false,
    };
  }
  for (let index = 0; index < 24; index++) {
    const angle = (index / 24) * Math.PI * 2;
    points.push([Math.cos(angle), Math.sin(angle)]);
  }
  return { points, closed: true };
}

type Frames = { tangents: Vector3[]; normals: Vector3[]; binormals: Vector3[] };

/** フレネ標構：曲がる向き（接線の変化の向き）を法線にする。まっすぐな所や曲がる向きが反転する所で乱れる。 */
function frenetFrames(curve: CatmullRomCurve3, count: number): Frames {
  const tangents: Vector3[] = [];
  const normals: Vector3[] = [];
  const binormals: Vector3[] = [];
  const eps = 1e-3;
  let last = new Vector3(0, 1, 0);
  for (let index = 0; index <= count; index++) {
    const t = Math.min(1 - eps, Math.max(eps, index / count));
    const tangent = curve.getTangentAt(t);
    const change = curve
      .getTangentAt(Math.min(1, t + eps))
      .sub(curve.getTangentAt(Math.max(0, t - eps)));
    let normal = change.sub(
      tangent.clone().multiplyScalar(change.dot(tangent))
    );
    if (normal.lengthSq() < 1e-10) {
      normal = last.clone(); // 曲がっていない所では向きが決まらない
    }
    normal.normalize();
    last = normal;
    tangents.push(tangent);
    normals.push(normal);
    binormals.push(new Vector3().crossVectors(tangent, normal));
  }
  return { tangents, normals, binormals };
}

/** 回転最小化フレーム（二重反射法）：前の枠を、ねじらずに次の点へ運ぶ。 */
function rotationMinimizingFrames(
  curve: CatmullRomCurve3,
  count: number
): Frames {
  const points = curve.getSpacedPoints(count);
  const tangents = points.map((_, index) => curve.getTangentAt(index / count));
  const first = tangents[0] ?? new Vector3(1, 0, 0);
  const helper =
    Math.abs(first.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const normals: Vector3[] = [
    helper.sub(first.clone().multiplyScalar(helper.dot(first))).normalize(),
  ];
  for (let index = 0; index < count; index++) {
    const p0 = points[index] ?? new Vector3();
    const p1 = points[index + 1] ?? p0;
    const t0 = tangents[index] ?? first;
    const t1 = tangents[index + 1] ?? t0;
    const r0 = normals[index] ?? new Vector3();
    const v1 = p1.clone().sub(p0);
    const c1 = v1.dot(v1);
    if (c1 < 1e-12) {
      normals.push(r0.clone());
      continue;
    }
    const rL = r0.clone().sub(v1.clone().multiplyScalar((2 / c1) * v1.dot(r0)));
    const tL = t0.clone().sub(v1.clone().multiplyScalar((2 / c1) * v1.dot(t0)));
    const v2 = t1.clone().sub(tL);
    const c2 = v2.dot(v2);
    normals.push(
      c2 < 1e-12
        ? rL
        : rL.sub(v2.multiplyScalar((2 / c2) * v2.dot(rL))).normalize()
    );
  }
  const binormals = tangents.map((tangent, index) =>
    new Vector3().crossVectors(tangent, normals[index] ?? new Vector3())
  );
  return { tangents, normals, binormals };
}

/** 断面を曲線に沿って運び、隣り合う断面を四角形（三角形 2 枚）でつなぐ。 */
function sweepGeometry(
  curve: CatmullRomCurve3,
  frames: Frames,
  shape: Profile,
  count: number,
  options: { size: number; taper: number; twist: number }
) {
  const ring = shape.points.length;
  const positions = new Float32Array((count + 1) * ring * 3);
  const indices: number[] = [];
  const point = new Vector3();
  for (let index = 0; index <= count; index++) {
    const t = index / count;
    const center = curve.getPointAt(t);
    const normal = frames.normals[index] ?? new Vector3(0, 1, 0);
    const binormal = frames.binormals[index] ?? new Vector3(0, 0, 1);
    const scale = options.size * (1 - options.taper * t);
    const angle = options.twist * t;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (const [k, [x, y]] of shape.points.entries()) {
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      point
        .copy(center)
        .addScaledVector(normal, ry * scale)
        .addScaledVector(binormal, rx * scale);
      positions.set([point.x, point.y, point.z], (index * ring + k) * 3);
    }
  }
  const edges = shape.closed ? ring : ring - 1;
  for (let index = 0; index < count; index++) {
    for (let k = 0; k < edges; k++) {
      const a = index * ring + k;
      const b = index * ring + ((k + 1) % ring);
      const c = a + ring;
      const d = b + ring;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const PIPE = [
  new Vector3(-4, 0.6, 1.5),
  new Vector3(-2.5, 0.6, 1.5),
  new Vector3(-1.5, 1.2, 0.5),
  new Vector3(-1.5, 2.6, -0.5),
  new Vector3(0.5, 3, -1),
  new Vector3(2, 2, 0.5),
  new Vector3(3.5, 1, 1),
  new Vector3(4, 0.6, -1),
];
const ROAD = [
  new Vector3(-4.5, 0.05, 2),
  new Vector3(-2, 0.05, -1.5),
  new Vector3(0.5, 0.8, 1.5),
  new Vector3(3, 1.2, -1.5),
  new Vector3(4.5, 0.4, 1.5),
];

export const demo: DemoModule = {
  alt: "断面の形を曲線に沿って運び、つないで立体を作るスイープ（押し出し）のデモ。配管、うねる触手、坂のある道路を、それぞれ円・星形・道路の断面で作る。断面の向きを決める方法として、曲がる向きを使うフレネ標構と、前の断面をねじらずに運ぶ回転最小化フレームを比べられる。フレネ標構では、曲がる向きが入れ替わる所で断面が急にくるっと回ってしまう。緑と赤の短い線が、各点での断面の向き。",
  camera: { position: [3.5, 4.2, 6.5], target: [0, 1.6, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "path",
      label: "曲線",
      value: "tentacle",
      options: [
        { value: "tentacle", label: "うねる触手" },
        { value: "pipe", label: "配管" },
        { value: "road", label: "道路" },
      ],
    },
    {
      type: "select",
      key: "shape",
      label: "断面",
      value: "star",
      options: [
        { value: "circle", label: "円" },
        { value: "star", label: "星形" },
        { value: "square", label: "長方形" },
        { value: "road", label: "道路" },
      ],
    },
    {
      type: "select",
      key: "frames",
      label: "断面の向きの決め方",
      value: "rmf",
      options: [
        { value: "rmf", label: "回転最小化フレーム" },
        { value: "frenet", label: "フレネ標構" },
      ],
    },
    {
      type: "range",
      key: "twist",
      label: "ねじり（度）",
      min: -720,
      max: 720,
      step: 15,
      value: 0,
    },
    {
      type: "range",
      key: "taper",
      label: "先細り",
      min: 0,
      max: 0.95,
      step: 0.05,
      value: 0.6,
    },
    {
      type: "range",
      key: "segments",
      label: "曲線方向の分割数",
      min: 4,
      max: 200,
      step: 1,
      value: 120,
    },
    {
      type: "toggle",
      key: "frames-visible",
      label: "断面の向きを表示",
      value: true,
    },
    { type: "toggle", key: "wire", label: "ポリゴンの辺を表示", value: false },
  ],
  legend: [
    { color: palette.amber, label: "運ぶ道すじ（曲線）" },
    { color: palette.lime, label: "断面の縦の向き（法線）" },
    { color: palette.coral, label: "断面の横の向き（従法線）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const material = new MeshStandardMaterial({
      color: "#c98a6b",
      roughness: 0.5,
      metalness: 0.05,
      side: DoubleSide,
    });
    const mesh = new Mesh(new BufferGeometry(), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const wire = new Mesh(
      mesh.geometry,
      new MeshBasicMaterial({
        color: "#1b2230",
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      })
    );
    scene.add(wire);
    const path = polyline([], palette.amber, { width: 2.5 });
    scene.add(path);
    const normalLines = segments([], palette.lime, { width: 2.5 });
    const binormalLines = segments([], palette.coral, { width: 2.5 });
    scene.add(normalLines, binormalLines);

    let lastPath = "";
    return {
      update({ time }) {
        const kind = String(params["path"]);
        let points = kind === "road" ? ROAD : PIPE;
        if (kind === "tentacle") {
          // 根元を固定し、先へ行くほど大きくうねる
          points = Array.from({ length: 9 }, (_, index) => {
            const s = index / 8;
            const sway = s * s;
            return new Vector3(
              Math.sin(time * 1.1 + s * 3) * 1.6 * sway,
              0.2 + s * 3.4 + Math.sin(time * 0.8 + s * 4) * 0.4 * sway,
              Math.cos(time * 0.9 + s * 3.5) * 1.6 * sway - 0.5
            );
          });
        }
        if (kind !== lastPath) {
          lastPath = kind;
          context.setParam(
            "shape",
            kind === "road" ? "road" : kind === "pipe" ? "circle" : "star"
          );
          context.setParam("taper", kind === "tentacle" ? 0.6 : 0);
        }
        const curve = new CatmullRomCurve3(points, false, "centripetal");
        const count = Number(params["segments"]);
        const frames =
          params["frames"] === "frenet"
            ? frenetFrames(curve, count)
            : rotationMinimizingFrames(curve, count);
        const shape = profile(String(params["shape"]));
        const size = kind === "road" ? 0.6 : kind === "pipe" ? 0.28 : 0.55;
        const geometry = sweepGeometry(curve, frames, shape, count, {
          size,
          taper: Number(params["taper"]),
          twist: (Number(params["twist"]) * Math.PI) / 180,
        });
        mesh.geometry.dispose();
        mesh.geometry = geometry;
        wire.geometry = geometry;
        wire.visible = params["wire"] === true;
        material.color.set(
          kind === "road" ? "#8b8f99" : kind === "pipe" ? "#b8c4cf" : "#c98a6b"
        );
        material.metalness = kind === "pipe" ? 0.6 : 0.05;
        material.roughness = kind === "pipe" ? 0.3 : 0.55;
        path.setPoints(curve.getSpacedPoints(160));
        const showFrames = params["frames-visible"] === true;
        normalLines.visible = showFrames;
        binormalLines.visible = showFrames;
        if (showFrames) {
          const n: Vector3[] = [];
          const b: Vector3[] = [];
          const step = Math.max(1, Math.round(count / 24));
          for (let index = 0; index <= count; index += step) {
            const center = curve.getPointAt(index / count);
            const length = size * 1.6;
            n.push(
              center,
              center
                .clone()
                .addScaledVector(frames.normals[index] ?? new Vector3(), length)
            );
            b.push(
              center,
              center
                .clone()
                .addScaledVector(
                  frames.binormals[index] ?? new Vector3(),
                  length
                )
            );
          }
          normalLines.setPoints(n);
          binormalLines.setPoints(b);
        }
        context.readout(
          "頂点",
          geometry.getAttribute("position").count.toLocaleString()
        );
        context.readout(
          "三角形",
          ((geometry.index?.count ?? 0) / 3).toLocaleString()
        );
        context.caption(
          params["frames"] === "frenet"
            ? "フレネ標構は、曲線が曲がる向きを断面の縦の向きにする。曲がる向きが左右で入れ替わる所や、ほぼまっすぐな所では向きが急に変わったり決まらなかったりして、断面がくるっと回ってねじれる（星形の角の並びで見える）。"
            : "回転最小化フレームは、1 つ前の断面の向きを、なるべく回さないように次の点へ運ぶ。曲線がどう曲がっても断面が勝手にねじれないので、配管、触手、道路、剣の軌跡など、ゲームで曲線から形を作るときの定番になっている。"
        );
      },
    };
  },
};
