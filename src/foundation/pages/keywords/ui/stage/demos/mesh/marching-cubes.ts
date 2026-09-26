import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Raycaster,
  Vector3,
} from "three";
import { marker, palette, pointCloud, segments, valueNoise3 } from "../../kit";
import {
  CUBE_CORNERS,
  CUBE_EDGES,
  fillGrid,
  marchCubes,
  scalarGrid,
} from "../../marching";
import type { ScalarGrid } from "../../marching";
import type { DemoModule } from "../../types";

const SIZE = 3.6;
const CENTER = new Vector3(0, 1.9, 0);
const MAX_POINTS = 17 ** 3;

/** 3 次元のフラクタルノイズ（-1〜1）。 */
function noise3(x: number, y: number, z: number) {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let octave = 0; octave < 4; octave++) {
    sum +=
      (valueNoise3(x * frequency, y * frequency, z * frequency) * 2 - 1) *
      amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return sum;
}

/** 地形の密度：地面より下ほど大きく、ノイズで洞窟や張り出しを作る。 */
function terrainDensity(x: number, y: number, z: number) {
  const ground = CENTER.y - 0.3 - y;
  return ground * 0.9 + noise3(x * 0.55 + 7, y * 0.55, z * 0.55 + 3) * 1.6;
}

/** 格子の外周の値を外側にして、切り口にも面ができる（閉じた塊になる）ようにする。 */
function closeBorders(grid: ScalarGrid) {
  const { nx, ny, nz, values } = grid;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        if (
          i === 0 ||
          j === 0 ||
          k === 0 ||
          i === nx - 1 ||
          j === ny - 1 ||
          k === nz - 1
        ) {
          values[i + nx * (j + ny * k)] = -1;
        }
      }
    }
  }
}

const GRASS = new Color("#7fa65a");
const ROCK = new Color("#a08466");
const DEEP = new Color("#6b5443");
const BLOB = new Color("#e2b36b");

/** 上を向いた面は草、切り立った面は岩、下の方ほど濃い土の色にする。 */
function surfaceColors(
  positions: Float32Array,
  normals: Float32Array,
  mode: string
) {
  const colors = new Float32Array(positions.length);
  const color = new Color();
  for (let index = 0; index < positions.length; index += 3) {
    if (mode === "terrain") {
      const up = normals[index + 1] ?? 0;
      const height =
        ((positions[index + 1] ?? 0) - (CENTER.y - SIZE / 2)) / SIZE;
      color.copy(DEEP).lerp(ROCK, Math.min(1, Math.max(0, height * 1.8)));
      color.lerp(GRASS, Math.min(1, Math.max(0, (up - 0.55) / 0.25)));
    } else {
      color.copy(BLOB);
    }
    colors[index] = color.r;
    colors[index + 1] = color.g;
    colors[index + 2] = color.b;
  }
  return colors;
}

export const demo: DemoModule = {
  alt: "3 次元の格子の各点に数値を持たせ、数値がしきい値を超える領域の表面を三角形で取り出すマーチングキューブのデモ。格子の立方体 1 つごとに、8 つの角が内側か外側かで 256 通りのケースに分け、表から三角形の張り方を引く。動く球の集まり（メタボール）が溶け合う形や、洞窟のある地形を作れる。地形はクリックで掘ることができ、掘るたびに表面が作り直される。「1 つのセルを見る」では、角の内外と三角形の関係を 1 つの立方体で確かめられる。",
  camera: { position: [5.5, 4.8, 6.5], target: [0, 1.6, 0], fov: 42 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "値の場",
      value: "terrain",
      options: [
        { value: "terrain", label: "掘れる地形" },
        { value: "metaballs", label: "メタボール" },
        { value: "cell", label: "1 つのセルを見る" },
      ],
    },
    {
      type: "range",
      key: "resolution",
      label: "格子の細かさ（1 辺の点の数）",
      min: 6,
      max: 56,
      step: 1,
      value: 36,
    },
    {
      type: "range",
      key: "iso",
      label: "しきい値（等値面の高さ）",
      min: -0.6,
      max: 0.6,
      step: 0.01,
      value: 0,
    },
    {
      type: "toggle",
      key: "interpolate",
      label: "辺の上で位置を補間する",
      value: true,
    },
    { type: "toggle", key: "wire", label: "三角形の辺を表示", value: false },
    {
      type: "toggle",
      key: "points",
      label: "内側の格子点を表示（17 点以下）",
      value: true,
    },
    { type: "button", key: "next", label: "次のケース（1 つのセル）" },
    { type: "button", key: "reset", label: "地形を元に戻す" },
  ],
  legend: [
    { color: palette.amber, label: "しきい値より大きい格子点（内側）" },
    { color: palette.coral, label: "辺の上に置いた頂点" },
  ],
  hint: "「掘れる地形」では、地形をクリックするとその場所を掘ります（ドラッグで視点を回せます）。",
  setup(context) {
    const { scene, params, camera, pointer } = context;
    const root = new Group();
    scene.add(root);

    const surfaceMaterial = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.75,
      metalness: 0.02,
      side: DoubleSide,
    });
    const surfaceGeometry = new BufferGeometry();
    const surface = new Mesh(surfaceGeometry, surfaceMaterial);
    surface.castShadow = true;
    surface.receiveShadow = true;
    root.add(surface);
    const wire = new Mesh(
      surfaceGeometry,
      new MeshBasicMaterial({
        color: "#2b3748",
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      })
    );
    root.add(wire);

    // 格子の外枠
    const half = SIZE / 2;
    const boxPoints: Vector3[] = [];
    for (const [a, b] of CUBE_EDGES) {
      const ca = CUBE_CORNERS[a] ?? CUBE_CORNERS[0];
      const cb = CUBE_CORNERS[b] ?? CUBE_CORNERS[0];
      boxPoints.push(
        new Vector3(ca[0] - 0.5, ca[1] - 0.5, ca[2] - 0.5)
          .multiplyScalar(SIZE)
          .add(CENTER),
        new Vector3(cb[0] - 0.5, cb[1] - 0.5, cb[2] - 0.5)
          .multiplyScalar(SIZE)
          .add(CENTER)
      );
    }
    const box = segments(boxPoints, palette.muted, {
      width: 1.5,
      opacity: 0.6,
    });
    root.add(box);
    const samples = pointCloud(MAX_POINTS, { size: 7, color: palette.amber });
    root.add(samples);

    // 1 つのセルの表示：角の球と、辺の上の頂点
    const cornerMarkers = CUBE_CORNERS.map(() => {
      const ball = marker(palette.amber, 0.12);
      root.add(ball);
      return ball;
    });
    const edgeMarkers = CUBE_EDGES.map(() => {
      const ball = marker(palette.coral, 0.07);
      root.add(ball);
      return ball;
    });
    const cornerLabels = CUBE_CORNERS.map((_, index) => {
      const label = context.label(String(index), { size: "sm" });
      root.add(label);
      return label;
    });
    const caseLabel = context.label("", { tone: "strong" });
    caseLabel.position.set(CENTER.x, CENTER.y + half + 0.5, CENTER.z);
    root.add(caseLabel);

    let grid: ScalarGrid = scalarGrid(2, 2, 2, [0, 0, 0], 1);
    let terrainGrid: ScalarGrid | null = null;
    let signature = "";
    let caseIndex = 35;
    let caseTimer = 0;
    let lastMs = 0;
    const raycaster = new Raycaster();

    const makeGrid = (resolution: number) => {
      const spacing = SIZE / (resolution - 1);
      return scalarGrid(
        resolution,
        resolution,
        resolution,
        [CENTER.x - half, CENTER.y - half, CENTER.z - half],
        spacing
      );
    };

    const upload = (target: ScalarGrid, iso: number) => {
      const start = performance.now();
      const result = marchCubes(target, iso, params["interpolate"] === true);
      lastMs = performance.now() - start;
      surfaceGeometry.setAttribute(
        "position",
        new BufferAttribute(result.positions, 3)
      );
      surfaceGeometry.setAttribute(
        "normal",
        new BufferAttribute(result.normals, 3)
      );
      surfaceGeometry.setAttribute(
        "color",
        new BufferAttribute(
          surfaceColors(
            result.positions,
            result.normals,
            String(params["mode"])
          ),
          3
        )
      );
      surfaceGeometry.computeBoundingSphere();
      context.readout("三角形の数", result.triangles.toLocaleString());
      context.readout(
        "表面が通るセル",
        `${result.activeCells.toLocaleString()} / ${((target.nx - 1) ** 3).toLocaleString()}`
      );
      context.readout("作るのにかかった時間", `${lastMs.toFixed(1)} ms`);
      // 格子点の表示（点が多すぎると見えなくなるので、粗いときだけ）
      let count = 0;
      if (
        params["points"] === true &&
        target.nx <= 17 &&
        String(params["mode"]) !== "cell"
      ) {
        const { nx, ny, values, origin, spacing } = target;
        for (let index = 0; index < values.length; index++) {
          if ((values[index] ?? 0) > iso && count < MAX_POINTS) {
            const i = index % nx;
            const j = Math.floor(index / nx) % ny;
            const k = Math.floor(index / (nx * ny));
            samples.positions[count * 3] = origin[0] + i * spacing;
            samples.positions[count * 3 + 1] = origin[1] + j * spacing;
            samples.positions[count * 3 + 2] = origin[2] + k * spacing;
            count++;
          }
        }
      }
      samples.geometry.setDrawRange(0, count);
      samples.commit();
    };

    const resetTerrain = () => {
      terrainGrid = makeGrid(Number(params["resolution"]));
      fillGrid(terrainGrid, terrainDensity);
      closeBorders(terrainGrid);
    };

    const dig = () => {
      if (String(params["mode"]) !== "terrain" || !terrainGrid) {
        return;
      }
      raycaster.setFromCamera(pointer.ndc, camera);
      const [hit] = raycaster.intersectObject(surface);
      if (!hit) {
        return;
      }
      const radius = 0.55;
      const { nx, ny, nz, values, origin, spacing } = terrainGrid;
      for (let k = 0; k < nz; k++) {
        for (let j = 0; j < ny; j++) {
          for (let i = 0; i < nx; i++) {
            const distance = hit.point.distanceTo(
              new Vector3(
                origin[0] + i * spacing,
                origin[1] + j * spacing,
                origin[2] + k * spacing
              )
            );
            if (distance < radius * 1.6) {
              // 球の内側ほど強く値を下げる（外側へなめらかにつなぐ）
              const index = i + nx * (j + ny * k);
              values[index] = Math.min(
                values[index] ?? 0,
                (distance - radius) * 1.4
              );
            }
          }
        }
      }
      signature = "";
    };
    context.onPick(dig);

    const showCell = (iso: number) => {
      // 角の値：内側は iso より大きく、外側は小さく（値の大きさはばらつかせる）
      grid = scalarGrid(
        2,
        2,
        2,
        [CENTER.x - half, CENTER.y - half, CENTER.z - half],
        SIZE
      );
      for (const [corner, [dx, dy, dz]] of CUBE_CORNERS.entries()) {
        const inside = (caseIndex & (1 << corner)) !== 0;
        const spread = 0.25 + 0.7 * ((corner * 0.618 + caseIndex * 0.37) % 1);
        grid.values[dx + 2 * (dy + 2 * dz)] = iso + (inside ? spread : -spread);
      }
      upload(grid, iso);
      const inside: number[] = [];
      for (const [corner, [dx, dy, dz]] of CUBE_CORNERS.entries()) {
        const position = new Vector3(dx - 0.5, dy - 0.5, dz - 0.5)
          .multiplyScalar(SIZE)
          .add(CENTER);
        const isInside = (caseIndex & (1 << corner)) !== 0;
        const ball = cornerMarkers[corner];
        if (ball) {
          ball.position.copy(position);
          ball.visible = true;
          ball.material.color.set(isInside ? palette.amber : "#56627a");
          ball.material.emissive.set(isInside ? palette.amber : "#000000");
        }
        const label = cornerLabels[corner];
        if (label) {
          label.position.copy(position).add(new Vector3(0, 0.32, 0));
          label.visible = true;
        }
        if (isInside) {
          inside.push(corner);
        }
      }
      for (const [edge, [a, b]] of CUBE_EDGES.entries()) {
        const ball = edgeMarkers[edge];
        if (!ball) {
          continue;
        }
        const aInside = (caseIndex & (1 << a)) !== 0;
        const bInside = (caseIndex & (1 << b)) !== 0;
        ball.visible = aInside !== bInside;
        if (ball.visible) {
          const [ax, ay, az] = CUBE_CORNERS[a] ?? CUBE_CORNERS[0];
          const [bx, by, bz] = CUBE_CORNERS[b] ?? CUBE_CORNERS[0];
          const va = grid.values[ax + 2 * (ay + 2 * az)] ?? 0;
          const vb = grid.values[bx + 2 * (by + 2 * bz)] ?? 0;
          const t =
            params["interpolate"] === true ? (iso - va) / (vb - va) : 0.5;
          ball.position
            .set(
              ax + (bx - ax) * t - 0.5,
              ay + (by - ay) * t - 0.5,
              az + (bz - az) * t - 0.5
            )
            .multiplyScalar(SIZE)
            .add(CENTER);
        }
      }
      caseLabel.setText(
        `ケース ${caseIndex}（2 進数 ${caseIndex.toString(2).padStart(8, "0")}）・内側の角: ${inside.length > 0 ? inside.join(", ") : "なし"}`
      );
    };

    const setCellVisible = (visible: boolean) => {
      for (const ball of [...cornerMarkers, ...edgeMarkers]) {
        ball.visible = visible && ball.visible;
      }
      for (const label of cornerLabels) {
        label.visible = visible;
      }
      caseLabel.visible = visible;
      if (!visible) {
        for (const ball of [...cornerMarkers, ...edgeMarkers]) {
          ball.visible = false;
        }
      }
    };

    return {
      action(key) {
        if (key === "next") {
          context.setParam("mode", "cell");
          caseIndex = (caseIndex + 1) % 256;
          caseTimer = 0;
          signature = "";
        } else if (key === "reset") {
          resetTerrain();
          signature = "";
        }
      },
      update({ time, dt }) {
        const mode = String(params["mode"]);
        const iso = Number(params["iso"]);
        const resolution = Number(params["resolution"]);
        wire.visible = params["wire"] === true || mode === "cell";
        const next = [
          mode,
          iso,
          resolution,
          params["interpolate"],
          params["points"],
          mode === "cell" ? caseIndex : "",
        ].join("|");
        if (
          mode === "terrain" &&
          (!terrainGrid || terrainGrid.nx !== resolution)
        ) {
          resetTerrain();
          signature = "";
        }
        if (mode === "cell") {
          // 自動で、面白いケースを順に見せる
          caseTimer += dt;
          if (caseTimer > 2.2) {
            caseTimer = 0;
            caseIndex = (caseIndex * 37 + 11) % 256;
          }
          const key = `${next}|${caseIndex}`;
          if (key !== signature) {
            signature = key;
            setCellVisible(true);
            showCell(iso);
          }
          context.caption(
            "立方体の 8 つの角が内側（黄）か外側（灰）かで、2⁸ = 256 通りのケースに分かれる。ケース番号を表で引くと、どの辺に頂点を置き、どう三角形を張るかがわかる。赤い点が、内側と外側の角を結ぶ辺の上に置いた頂点。"
          );
          return;
        }
        setCellVisible(false);
        if (mode === "metaballs") {
          grid = grid.nx === resolution ? grid : makeGrid(resolution);
          const balls = [0, 1, 2, 3, 4].map((index) => {
            const phase = time * (0.35 + index * 0.07) + index * 1.7;
            return new Vector3(
              Math.sin(phase * 1.3) * 0.9,
              Math.sin(phase * 0.9 + index) * 0.8,
              Math.cos(phase * 1.1) * 0.9
            ).add(CENTER);
          });
          fillGrid(grid, (x, y, z) => {
            let sum = 0;
            for (const ball of balls) {
              const dx = x - ball.x;
              const dy = y - ball.y;
              const dz = z - ball.z;
              sum += 0.36 / (dx * dx + dy * dy + dz * dz + 1e-4);
            }
            return sum - 1;
          });
          upload(grid, iso);
          signature = "";
          context.caption(
            "5 つの球それぞれが、近いほど大きい値を場に足す。足し合わせた値がしきい値を超える領域の表面を毎フレーム作り直すので、球が近づくと溶け合ってつながる。格子を粗くすると、表面がかくかくになる。"
          );
          return;
        }
        if (next !== signature && terrainGrid) {
          signature = next;
          upload(terrainGrid, iso);
        }
        context.caption(
          "地面より下ほど大きくなる値に 3 次元ノイズを足して、洞窟や張り出しのある地形を作っている。高さマップの地形と違い、横穴やトンネルも表せる。クリックすると、その場所の値を球の形に下げて表面を作り直す（ボクセル地形を掘る処理）。"
        );
      },
    };
  },
};
