import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
} from "three";
import { palette, pointCloud, segments } from "../../kit";
import type { DemoModule } from "../../types";

type PolyMesh = { vertices: Vector3[]; faces: number[][]; sharp: Set<string> };

/** 点の平均（空なら原点）。 */
function average(points: readonly Vector3[]) {
  const sum = new Vector3();
  for (const point of points) {
    sum.add(point);
  }
  return points.length > 0 ? sum.divideScalar(points.length) : sum;
}

const edgeKey = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);

/** 立方体（外から見て反時計回りの四角形 6 枚）。 */
function cube(): PolyMesh {
  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ].map(([x, y, z]) => new Vector3(x, y, z));
  const faces = [
    [4, 5, 6, 7],
    [1, 0, 3, 2],
    [5, 1, 2, 6],
    [0, 4, 7, 3],
    [7, 6, 2, 3],
    [0, 1, 5, 4],
  ];
  return { vertices, faces, sharp: new Set() };
}

/** 面を法線の向きへ押し出す（側面の四角形を足し、元の面を持ち上げる）。 */
function extrude(
  mesh: PolyMesh,
  faceIndex: number,
  distance: number,
  scale = 1
) {
  const face = mesh.faces[faceIndex];
  if (!face) {
    return;
  }
  const points = face.map((index) => mesh.vertices[index] ?? new Vector3());
  const center = average(points);
  const normal = new Vector3()
    .subVectors(points[1] ?? center, points[0] ?? center)
    .cross(new Vector3().subVectors(points[2] ?? center, points[1] ?? center))
    .normalize();
  const top = points.map((point) => {
    mesh.vertices.push(
      point
        .clone()
        .sub(center)
        .multiplyScalar(scale)
        .add(center)
        .addScaledVector(normal, distance)
    );
    return mesh.vertices.length - 1;
  });
  for (let k = 0; k < face.length; k++) {
    const a = face[k] ?? 0;
    const b = face[(k + 1) % face.length] ?? 0;
    mesh.faces.push([a, b, top[(k + 1) % face.length] ?? 0, top[k] ?? 0]);
  }
  mesh.faces[faceIndex] = top;
}

/** 立方体の 4 つの側面と上面を押し出した、腕の生えた形。 */
function creature(): PolyMesh {
  const mesh = cube();
  for (const face of [2, 3, 0, 1]) {
    extrude(mesh, face, 0.9, 0.7);
    extrude(mesh, face, 1.1, 0.75);
  }
  extrude(mesh, 4, 0.5, 0.8);
  extrude(mesh, 4, 0.9, 1.2);
  return mesh;
}

/** 八角柱のカップ（底あり、上は縁に厚みのある開口）。上の縁をとがった辺にできる。 */
function cup(): PolyMesh {
  const sides = 8;
  const vertices: Vector3[] = [];
  const faces: number[][] = [];
  const ring = (radius: number, y: number) => {
    const start = vertices.length;
    for (let k = 0; k < sides; k++) {
      const angle = (k / sides) * Math.PI * 2;
      vertices.push(
        new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      );
    }
    return start;
  };
  const bottom = ring(0.9, -1);
  const outerTop = ring(1.2, 1);
  const innerTop = ring(1, 1);
  const innerBottom = ring(0.75, -0.7);
  const quadStrip = (a: number, b: number, flip: boolean) => {
    for (let k = 0; k < sides; k++) {
      const k1 = (k + 1) % sides;
      const face = [a + k, a + k1, b + k1, b + k];
      faces.push(flip ? face.toReversed() : face);
    }
  };
  quadStrip(bottom, outerTop, true);
  quadStrip(outerTop, innerTop, true);
  quadStrip(innerTop, innerBottom, true);
  faces.push(Array.from({ length: sides }, (_, k) => bottom + k));
  faces.push(
    Array.from({ length: sides }, (_, k) => innerBottom + sides - 1 - k)
  );
  const sharp = new Set<string>();
  for (let k = 0; k < sides; k++) {
    sharp.add(edgeKey(outerTop + k, outerTop + ((k + 1) % sides)));
    sharp.add(edgeKey(innerTop + k, innerTop + ((k + 1) % sides)));
    sharp.add(edgeKey(bottom + k, bottom + ((k + 1) % sides)));
  }
  return { vertices, faces, sharp };
}

/**
 * カトマル・クラーク細分割を 1 回行う。
 * 面点 = 面の頂点の平均、辺点 = 辺の両端と両側の面点の平均、
 * 元の頂点 = (Q + 2R + (n − 3)P) / n（Q: 周りの面点の平均、R: 周りの辺の中点の平均、n: つながる辺の数）。
 * とがった辺（sharp）では、辺点を中点にし、頂点も辺に沿った規則で動かす。
 */
function catmullClark(
  mesh: PolyMesh,
  useSharp: boolean,
  smooth: boolean
): PolyMesh {
  const { vertices, faces } = mesh;
  const facePoints = faces.map((face) =>
    average(face.map((index) => vertices[index] ?? new Vector3()))
  );
  const edgeFaces = new Map<string, number[]>();
  for (const [f, face] of faces.entries()) {
    for (let k = 0; k < face.length; k++) {
      const key = edgeKey(face[k] ?? 0, face[(k + 1) % face.length] ?? 0);
      edgeFaces.set(key, [...(edgeFaces.get(key) ?? []), f]);
    }
  }
  const isSharp = (key: string) =>
    (useSharp && mesh.sharp.has(key)) || (edgeFaces.get(key)?.length ?? 0) < 2;
  const newVertices: Vector3[] = [];
  const faceIndex = facePoints.map((point) => {
    newVertices.push(point.clone());
    return newVertices.length - 1;
  });
  const edgeIndex = new Map<string, number>();
  for (const [key, adjacent] of edgeFaces) {
    const [a, b] = key.split(",").map(Number);
    const pa = vertices[a ?? 0] ?? new Vector3();
    const pb = vertices[b ?? 0] ?? new Vector3();
    const mid = pa.clone().add(pb).multiplyScalar(0.5);
    let point = mid;
    if (smooth && !isSharp(key)) {
      point = pa
        .clone()
        .add(pb)
        .add(facePoints[adjacent[0] ?? 0] ?? mid)
        .add(facePoints[adjacent[1] ?? 0] ?? mid)
        .multiplyScalar(0.25);
    }
    newVertices.push(point);
    edgeIndex.set(key, newVertices.length - 1);
  }
  // 元の頂点の新しい位置
  const vertexFaces = vertices.map(() => [] as number[]);
  const vertexEdges = vertices.map(() => [] as string[]);
  for (const [f, face] of faces.entries()) {
    for (const index of face) {
      vertexFaces[index]?.push(f);
    }
  }
  for (const key of edgeFaces.keys()) {
    const [a, b] = key.split(",").map(Number);
    vertexEdges[a ?? 0]?.push(key);
    vertexEdges[b ?? 0]?.push(key);
  }
  const vertexIndex = vertices.map((point, v) => {
    let next = point.clone();
    if (smooth) {
      const edges = vertexEdges[v] ?? [];
      const sharpEdges = edges.filter(isSharp);
      const other = (key: string) => {
        const [a, b] = key.split(",").map(Number);
        return vertices[a === v ? (b ?? 0) : (a ?? 0)] ?? point;
      };
      if (sharpEdges.length === 2) {
        const [e0, e1] = sharpEdges;
        next = other(e0 ?? "")
          .clone()
          .add(other(e1 ?? ""))
          .addScaledVector(point, 6)
          .multiplyScalar(1 / 8);
      } else if (sharpEdges.length < 2) {
        const n = edges.length;
        const q = average(
          (vertexFaces[v] ?? []).map((f) => facePoints[f] ?? point)
        );
        const r = average(
          edges.map((key) => other(key).clone().add(point).multiplyScalar(0.5))
        );
        next = q
          .add(r.multiplyScalar(2))
          .addScaledVector(point, n - 3)
          .divideScalar(n);
      }
    }
    newVertices.push(next);
    return newVertices.length - 1;
  });
  // 面ごとに、元の頂点・辺点・面点・辺点で四角形を作る
  const newFaces: number[][] = [];
  for (const [f, face] of faces.entries()) {
    for (let k = 0; k < face.length; k++) {
      const previous = face[(k + face.length - 1) % face.length] ?? 0;
      const current = face[k] ?? 0;
      const next = face[(k + 1) % face.length] ?? 0;
      newFaces.push([
        vertexIndex[current] ?? 0,
        edgeIndex.get(edgeKey(current, next)) ?? 0,
        faceIndex[f] ?? 0,
        edgeIndex.get(edgeKey(previous, current)) ?? 0,
      ]);
    }
  }
  // とがった辺は、分けた後の 2 本もとがった辺として引き継ぐ
  const sharp = new Set<string>();
  for (const key of mesh.sharp) {
    const [a, b] = key.split(",").map(Number);
    const middle = edgeIndex.get(key);
    if (middle !== undefined) {
      sharp.add(edgeKey(vertexIndex[a ?? 0] ?? 0, middle));
      sharp.add(edgeKey(middle, vertexIndex[b ?? 0] ?? 0));
    }
  }
  return { vertices: newVertices, faces: newFaces, sharp };
}

function toGeometry(mesh: PolyMesh) {
  const positions: number[] = [];
  for (const point of mesh.vertices) {
    positions.push(point.x, point.y, point.z);
  }
  const indices: number[] = [];
  for (const face of mesh.faces) {
    for (let k = 1; k + 1 < face.length; k++) {
      indices.push(face[0] ?? 0, face[k] ?? 0, face[k + 1] ?? 0);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function cageLines(mesh: PolyMesh) {
  const seen = new Set<string>();
  const points: Vector3[] = [];
  for (const face of mesh.faces) {
    for (let k = 0; k < face.length; k++) {
      const a = face[k] ?? 0;
      const b = face[(k + 1) % face.length] ?? 0;
      const key = edgeKey(a, b);
      if (!seen.has(key)) {
        seen.add(key);
        points.push(
          mesh.vertices[a] ?? new Vector3(),
          mesh.vertices[b] ?? new Vector3()
        );
      }
    }
  }
  return points;
}

export const demo: DemoModule = {
  alt: "少ない面でできた角ばった形（制御メッシュ）を、面を 4 つに分けながら丸めていくサブディビジョンサーフェスのデモ。カトマル・クラーク法では、分けるたびに新しい点を周りの点の重み付き平均の位置に置くので、くり返すほどなめらかな曲面に近づく。立方体は丸い形に、腕を押し出した形は生き物のような形になる。カップの縁のように、とがらせたい辺を指定すると、そこだけ角を残せる。白い線が元の制御メッシュ。",
  camera: { position: [3.4, 3.6, 4.4], target: [0, 1.5, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "shape",
      label: "制御メッシュ",
      value: "creature",
      options: [
        { value: "cube", label: "立方体" },
        { value: "creature", label: "腕を押し出した形" },
        { value: "cup", label: "カップ" },
      ],
    },
    {
      type: "range",
      key: "level",
      label: "細分割の回数",
      min: 0,
      max: 4,
      step: 1,
      value: 3,
    },
    {
      type: "select",
      key: "method",
      label: "新しい点の置き方",
      value: "catmull",
      options: [
        { value: "catmull", label: "カトマル・クラーク（丸める）" },
        { value: "linear", label: "分けるだけ（丸めない）" },
      ],
    },
    {
      type: "toggle",
      key: "sharp",
      label: "とがった辺を使う（カップの縁）",
      value: true,
    },
    { type: "toggle", key: "cage", label: "制御メッシュを表示", value: true },
    { type: "toggle", key: "wire", label: "分割後の辺を表示", value: true },
  ],
  legend: [
    { color: palette.ink, label: "制御メッシュ（元の角ばった形）" },
    { color: palette.amber, label: "制御点" },
  ],
  setup(context) {
    const { scene, params } = context;
    const material = new MeshStandardMaterial({
      color: "#7fb2d9",
      roughness: 0.4,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const mesh = new Mesh(new BufferGeometry(), material);
    mesh.position.y = 1.6;
    mesh.castShadow = true;
    scene.add(mesh);
    const wire = new Mesh(
      mesh.geometry,
      new MeshBasicMaterial({
        color: "#16202e",
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      })
    );
    wire.position.y = 1.6;
    scene.add(wire);
    const cage = segments([], palette.ink, { width: 2 });
    cage.position.y = 1.6;
    scene.add(cage);
    const points = pointCloud(200, { size: 16, color: palette.amber });
    points.position.y = 1.6;
    scene.add(points);

    let signature = "";
    return {
      update({ time }) {
        mesh.rotation.y = time * 0.25;
        wire.rotation.y = mesh.rotation.y;
        cage.rotation.y = mesh.rotation.y;
        points.rotation.y = mesh.rotation.y;
        const key = [
          params["shape"],
          params["level"],
          params["method"],
          params["sharp"],
        ].join("|");
        if (key !== signature) {
          signature = key;
          const shape = String(params["shape"]);
          const base =
            shape === "cube" ? cube() : shape === "cup" ? cup() : creature();
          const scale = shape === "creature" ? 0.55 : 1;
          for (const point of base.vertices) {
            point.multiplyScalar(scale);
          }
          let result = base;
          for (let level = 0; level < Number(params["level"]); level++) {
            result = catmullClark(
              result,
              params["sharp"] === true,
              params["method"] === "catmull"
            );
          }
          mesh.geometry.dispose();
          mesh.geometry = toGeometry(result);
          wire.geometry = mesh.geometry;
          cage.setPoints(cageLines(base));
          for (const [index, point] of base.vertices.entries()) {
            points.positions.set([point.x, point.y, point.z], index * 3);
          }
          points.geometry.setDrawRange(0, base.vertices.length);
          points.commit();
          context.readout("制御メッシュの面", `${base.faces.length}`);
          context.readout("細分割後の面", result.faces.length.toLocaleString());
        }
        wire.visible = params["wire"] === true;
        cage.visible = params["cage"] === true;
        points.visible = params["cage"] === true;
        context.caption(
          params["method"] === "catmull"
            ? "1 回ごとに、四角形を 4 つに分け、新しい点を周りの点の重み付き平均に置く。元の頂点も周りへ引き寄せられるので、分けるほど角が取れ、制御メッシュの内側に収まるなめらかな曲面に近づく。とがった辺では平均を取らず、辺に沿ってだけ動かすので角が残る。"
            : "面を分けるだけで点を動かさないと、面の数が増えても形は角ばったまま変わらない。丸くなるのは、分けるたびに点を周りの平均の位置へ動かしているからだとわかる。"
        );
      },
    };
  },
};
