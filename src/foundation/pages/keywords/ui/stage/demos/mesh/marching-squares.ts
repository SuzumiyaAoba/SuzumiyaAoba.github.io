import {
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  Vector2,
  Vector3,
} from "three";
import { fbm2, palette, pointCloud, segments } from "../../kit";
import { marchSquares, SQUARE_CORNERS, SQUARE_SEGMENTS } from "../../marching";
import type { DemoModule } from "../../types";

const WIDTH = 17;
const HEIGHT = 9.4;
const ORIGIN: [number, number] = [-WIDTH / 2, -HEIGHT / 2];
const BALLS = 18;
const BALL_RADIUS = 0.16;
const MAX_POINTS = 97 * 60;

type Stroke = { x: number; y: number; radius: number; sign: number };

/** 地形の値：地面より下ほど大きく、ノイズで洞窟や浮島を作る。 */
function terrain(x: number, y: number) {
  const ground = -0.1 + Math.sin(x * 0.35) * 1.2 + Math.sin(x * 0.9 + 1) * 0.35;
  return (ground - y) * 0.7 + fbm2(x * 0.22 + 4, y * 0.22 + 9, 4) * 2.6;
}

export const demo: DemoModule = {
  alt: "2 次元の格子の各点に数値を持たせ、数値がしきい値を超える領域の輪郭線を取り出すマーチングスクエアのデモ。格子の四角形 1 つごとに、4 つの角が内側か外側かで 16 通りのケースに分け、どの辺からどの辺へ線を引くかを表で決める。地面をクリックやドラッグで掘ったり盛ったりでき、そのたびに輪郭と塗りが作り直される。輪郭はそのまま当たり判定にも使え、落ちてくるボールが新しい地形の上を転がる。『ワームス』のような壊せる 2D 地形の作り方。",
  camera: { position: [0, 0, 15], target: [0, 0, 0], orbit: false, fov: 40 },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "表示",
      value: "terrain",
      options: [
        { value: "terrain", label: "壊せる地形" },
        { value: "cases", label: "16 通りのケース" },
      ],
    },
    {
      type: "range",
      key: "cells",
      label: "格子の細かさ（横のマスの数）",
      min: 8,
      max: 96,
      step: 1,
      value: 40,
    },
    {
      type: "toggle",
      key: "interpolate",
      label: "辺の上で位置を補間する",
      value: true,
    },
    { type: "toggle", key: "grid", label: "格子点を表示", value: true },
    {
      type: "select",
      key: "brush",
      label: "ドラッグしたとき",
      value: "dig",
      options: [
        { value: "dig", label: "掘る" },
        { value: "add", label: "盛る" },
      ],
    },
    {
      type: "range",
      key: "radius",
      label: "ブラシの大きさ",
      min: 0.3,
      max: 2,
      step: 0.05,
      value: 0.8,
    },
    { type: "button", key: "drop", label: "ボールを落とす" },
    { type: "button", key: "reset", label: "地形を元に戻す" },
  ],
  legend: [
    { color: palette.amber, label: "しきい値より大きい格子点（内側）" },
    { color: palette.lime, label: "取り出した輪郭線" },
  ],
  hint: "地形をドラッグすると掘れます（「盛る」にすると土を足せます）。",
  setup(context) {
    const { scene, params, pointer } = context;
    const terrainGroup = new Group();
    scene.add(terrainGroup);
    const casesGroup = new Group();
    scene.add(casesGroup);

    const sky = new Mesh(
      new PlaneGeometry(WIDTH, HEIGHT),
      new MeshBasicMaterial({ color: "#253449" })
    );
    sky.position.z = -0.05;
    terrainGroup.add(sky);
    const fillGeometry = new BufferGeometry();
    const fill = new Mesh(
      fillGeometry,
      new MeshBasicMaterial({ color: "#7a5a40" })
    );
    terrainGroup.add(fill);
    const contour = segments([], palette.lime, { width: 3 });
    contour.position.z = 0.02;
    terrainGroup.add(contour);
    const gridLines = segments([], palette.faint, { width: 1, opacity: 0.8 });
    gridLines.position.z = 0.01;
    terrainGroup.add(gridLines);
    const samples = pointCloud(MAX_POINTS, { size: 20 });
    samples.position.z = 0.03;
    terrainGroup.add(samples);
    const cursor = new Mesh(
      new RingGeometry(0.95, 1, 48),
      new MeshBasicMaterial({
        color: palette.ink,
        transparent: true,
        opacity: 0.8,
      })
    );
    cursor.position.z = 0.05;
    terrainGroup.add(cursor);

    const balls = new InstancedMesh(
      new CircleGeometry(BALL_RADIUS, 20),
      new MeshBasicMaterial({ color: palette.sky }),
      BALLS
    );
    balls.position.z = 0.04;
    terrainGroup.add(balls);
    const ballPositions = Array.from(
      { length: BALLS },
      () => new Vector2(0, 100)
    );
    const ballVelocities = Array.from({ length: BALLS }, () => new Vector2());
    const matrix = new Matrix4();

    const strokes: Stroke[] = [];
    let nx = 0;
    let ny = 0;
    let spacing = 1;
    let values = new Float32Array(0);
    let dirty = true;
    let built = "";

    const applyStroke = (stroke: Stroke) => {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const x = ORIGIN[0] + i * spacing;
          const y = ORIGIN[1] + j * spacing;
          const distance = Math.hypot(x - stroke.x, y - stroke.y);
          if (distance > stroke.radius * 1.8) {
            continue;
          }
          const index = i + nx * j;
          const value = values[index] ?? 0;
          // 掘る：円の内側ほど値を下げる。盛る：円の内側ほど値を上げる
          const shaped = (stroke.radius - distance) * 1.2;
          values[index] =
            stroke.sign < 0
              ? Math.min(value, -shaped)
              : Math.max(value, shaped);
        }
      }
      dirty = true;
    };

    const rebuildField = () => {
      const cells = Number(params["cells"]);
      spacing = WIDTH / cells;
      nx = cells + 1;
      ny = Math.floor(HEIGHT / spacing) + 1;
      values = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          values[i + nx * j] = terrain(
            ORIGIN[0] + i * spacing,
            ORIGIN[1] + j * spacing
          );
        }
      }
      for (const stroke of strokes) {
        applyStroke(stroke);
      }
      dirty = true;
    };

    /** 格子の値を双一次補間で読む（ボールの当たり判定用）。 */
    const sample = (x: number, y: number) => {
      const fx = Math.min(nx - 1.001, Math.max(0, (x - ORIGIN[0]) / spacing));
      const fy = Math.min(ny - 1.001, Math.max(0, (y - ORIGIN[1]) / spacing));
      const i = Math.floor(fx);
      const j = Math.floor(fy);
      const tx = fx - i;
      const ty = fy - j;
      const v00 = values[i + nx * j] ?? 0;
      const v10 = values[i + 1 + nx * j] ?? 0;
      const v01 = values[i + nx * (j + 1)] ?? 0;
      const v11 = values[i + 1 + nx * (j + 1)] ?? 0;
      return (
        (v00 * (1 - tx) + v10 * tx) * (1 - ty) +
        (v01 * (1 - tx) + v11 * tx) * ty
      );
    };

    const dropBalls = () => {
      for (const [index, position] of ballPositions.entries()) {
        position.set(
          ORIGIN[0] + 1 + ((index * 0.618) % 1) * (WIDTH - 2),
          HEIGHT / 2 + 0.5 + (index % 5) * 0.6
        );
        ballVelocities[index]?.set(0, 0);
      }
    };
    dropBalls();

    const rebuildMesh = () => {
      const interpolate = params["interpolate"] === true;
      const result = marchSquares(
        values,
        nx,
        ny,
        ORIGIN,
        spacing,
        0,
        interpolate
      );
      const positions = new Float32Array((result.fill.length / 2) * 3);
      for (let index = 0; index < result.fill.length / 2; index++) {
        positions[index * 3] = result.fill[index * 2] ?? 0;
        positions[index * 3 + 1] = result.fill[index * 2 + 1] ?? 0;
      }
      fillGeometry.setAttribute("position", new BufferAttribute(positions, 3));
      fillGeometry.computeBoundingSphere();
      const linePoints: Vector3[] = [];
      for (let index = 0; index < result.lines.length; index += 4) {
        linePoints.push(
          new Vector3(result.lines[index], result.lines[index + 1], 0),
          new Vector3(result.lines[index + 2], result.lines[index + 3], 0)
        );
      }
      contour.setPoints(linePoints);
      const showGrid = params["grid"] === true;
      gridLines.visible = showGrid;
      samples.visible = showGrid;
      if (showGrid) {
        const lines: Vector3[] = [];
        for (let i = 0; i < nx; i++) {
          const x = ORIGIN[0] + i * spacing;
          lines.push(
            new Vector3(x, ORIGIN[1], 0),
            new Vector3(x, ORIGIN[1] + (ny - 1) * spacing, 0)
          );
        }
        for (let j = 0; j < ny; j++) {
          const y = ORIGIN[1] + j * spacing;
          lines.push(
            new Vector3(ORIGIN[0], y, 0),
            new Vector3(ORIGIN[0] + (nx - 1) * spacing, y, 0)
          );
        }
        gridLines.setPoints(lines);
        const inside = new Color(palette.amber);
        const outside = new Color(palette.faint);
        let count = 0;
        for (let j = 0; j < ny; j++) {
          for (let i = 0; i < nx; i++) {
            if (count >= MAX_POINTS) {
              break;
            }
            const color = (values[i + nx * j] ?? 0) > 0 ? inside : outside;
            samples.positions.set(
              [ORIGIN[0] + i * spacing, ORIGIN[1] + j * spacing, 0],
              count * 3
            );
            samples.colors.set([color.r, color.g, color.b], count * 3);
            samples.sizes[count] = Math.min(
              1,
              12 / Number(params["cells"]) + 0.25
            );
            count++;
          }
        }
        samples.geometry.setDrawRange(0, count);
        samples.commit();
      }
      context.readout(
        "格子点",
        `${nx} × ${ny} = ${(nx * ny).toLocaleString()}`
      );
      context.readout("輪郭の線分", (result.lines.length / 4).toLocaleString());
    };

    // 16 通りのケースの一覧（4 × 4 のタイル）
    const buildCases = () => {
      const tile = 2;
      const gap = 0.35;
      const lines: Vector3[] = [];
      const frame: Vector3[] = [];
      const fills: number[] = [];
      const cornerDots: { position: Vector3; inside: boolean }[] = [];
      for (let index = 0; index < 16; index++) {
        const column = index % 8;
        const row = Math.floor(index / 8);
        const x0 = (column - 4) * (tile + gap) + gap / 2;
        const y0 = (0.5 - row) * (tile + gap + 1.1) - tile / 2 + 0.3;
        const cell = new Float32Array(4);
        for (const [c, [dx, dy]] of SQUARE_CORNERS.entries()) {
          cell[dx + 2 * dy] = (index & (1 << c)) === 0 ? -1 : 1;
          cornerDots.push({
            position: new Vector3(x0 + dx * tile, y0 + dy * tile, 0.03),
            inside: (index & (1 << c)) !== 0,
          });
        }
        const result = marchSquares(cell, 2, 2, [x0, y0], tile, 0, true);
        fills.push(...result.fill);
        for (let n = 0; n < result.lines.length; n += 4) {
          lines.push(
            new Vector3(result.lines[n], result.lines[n + 1], 0.02),
            new Vector3(result.lines[n + 2], result.lines[n + 3], 0.02)
          );
        }
        const corners = [
          [x0, y0],
          [x0 + tile, y0],
          [x0 + tile, y0 + tile],
          [x0, y0 + tile],
        ] as const;
        for (let c = 0; c < 4; c++) {
          const [ax, ay] = corners[c] ?? corners[0];
          const [bx, by] = corners[(c + 1) % 4] ?? corners[0];
          frame.push(new Vector3(ax, ay, 0.01), new Vector3(bx, by, 0.01));
        }
        const label = context.label(
          `${index}${(SQUARE_SEGMENTS[index]?.length ?? 0) > 1 ? "（あいまい）" : ""}`,
          { size: "sm" }
        );
        label.position.set(x0 + tile / 2, y0 - 0.45, 0);
        casesGroup.add(label);
      }
      const positions = new Float32Array((fills.length / 2) * 3);
      for (let n = 0; n < fills.length / 2; n++) {
        positions[n * 3] = fills[n * 2] ?? 0;
        positions[n * 3 + 1] = fills[n * 2 + 1] ?? 0;
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(positions, 3));
      casesGroup.add(
        new Mesh(geometry, new MeshBasicMaterial({ color: "#7a5a40" }))
      );
      casesGroup.add(segments(frame, palette.muted, { width: 1.5 }));
      casesGroup.add(segments(lines, palette.lime, { width: 3 }));
      const dots = pointCloud(cornerDots.length, { size: 30 });
      const inside = new Color(palette.amber);
      const outside = new Color("#56627a");
      for (const [n, dot] of cornerDots.entries()) {
        dots.positions.set(
          [dot.position.x, dot.position.y, dot.position.z],
          n * 3
        );
        const color = dot.inside ? inside : outside;
        dots.colors.set([color.r, color.g, color.b], n * 3);
      }
      dots.commit();
      casesGroup.add(dots);
    };
    buildCases();

    rebuildField();
    const brushPoint = new Vector3();
    return {
      action(key) {
        if (key === "reset") {
          strokes.length = 0;
          rebuildField();
          dropBalls();
        } else if (key === "drop") {
          dropBalls();
        }
      },
      update({ dt }) {
        const mode = String(params["mode"]);
        terrainGroup.visible = mode === "terrain";
        casesGroup.visible = mode === "cases";
        if (mode === "cases") {
          context.readout("格子点", "");
          context.readout("輪郭の線分", "");
          built = "";
          context.caption(
            "4 つの角が内側（黄）か外側（灰）かで 2⁴ = 16 通りに分かれる。内側と外側の角を結ぶ辺の上に点を置き、表のとおりに線でつなぐ。5 と 10 は、対角の角だけが内側になる「あいまいな」ケースで、線のつなぎ方が 2 通りある（ここでは内側をつなぐ方を選んでいる）。"
          );
          return;
        }
        const key = `${params["cells"]}`;
        if (key !== built) {
          built = key;
          rebuildField();
        }
        // ブラシ：押している間、ポインターの位置を掘る（または盛る）
        const radius = Number(params["radius"]);
        const hit = context.pointerOnPlane({ normal: [0, 0, 1] }, brushPoint);
        cursor.visible = hit !== null;
        if (hit) {
          cursor.position.set(hit.x, hit.y, 0.05);
          cursor.scale.setScalar(radius);
          if (pointer.down) {
            const stroke = {
              x: hit.x,
              y: hit.y,
              radius,
              sign: params["brush"] === "dig" ? -1 : 1,
            };
            strokes.push(stroke);
            applyStroke(stroke);
          }
        }
        const interpolateKey = `${params["interpolate"]}|${params["grid"]}`;
        if (dirty || interpolateKey !== built.split("#")[1]) {
          built = `${key}#${interpolateKey}`;
          dirty = false;
          rebuildMesh();
        }

        // ボール：場の値が 0 を超えた（地面にめり込んだ）ら、値が下がる向きへ押し出す
        const h = Math.min(Math.max(dt, 0), 1 / 30);
        const steps = 3;
        for (let step = 0; step < steps; step++) {
          const sub = h / steps;
          for (const [index, position] of ballPositions.entries()) {
            const velocity = ballVelocities[index];
            if (!velocity) {
              continue;
            }
            velocity.y -= 14 * sub;
            position.addScaledVector(velocity, sub);
            const eps = spacing * 0.5;
            const value = sample(position.x, position.y);
            const gx =
              (sample(position.x + eps, position.y) -
                sample(position.x - eps, position.y)) /
              (2 * eps);
            const gy =
              (sample(position.x, position.y + eps) -
                sample(position.x, position.y - eps)) /
              (2 * eps);
            const gradient = Math.hypot(gx, gy);
            const depth =
              (value + BALL_RADIUS * gradient) / Math.max(gradient, 1e-3);
            if (depth > 0 && gradient > 1e-3) {
              const normal = new Vector2(-gx / gradient, -gy / gradient);
              position.addScaledVector(normal, depth);
              const into = velocity.dot(normal);
              if (into < 0) {
                velocity.addScaledVector(normal, -into * 1.25);
                velocity.multiplyScalar(0.995);
              }
            }
            if (
              position.y < ORIGIN[1] - 1 ||
              Math.abs(position.x) > WIDTH / 2 + 1
            ) {
              position.set(
                ORIGIN[0] + 1 + Math.random() * (WIDTH - 2),
                HEIGHT / 2 + 0.5
              );
              velocity.set(0, 0);
            }
          }
        }
        for (const [index, position] of ballPositions.entries()) {
          matrix.makeTranslation(position.x, position.y, 0);
          balls.setMatrixAt(index, matrix);
        }
        balls.instanceMatrix.needsUpdate = true;
        context.caption(
          "格子の四角形ごとに、4 つの角の値がしきい値より大きいか（黄）で 16 通りのケースに分け、表のとおりに辺と辺を線で結ぶと輪郭（緑）ができる。値を書き換えた場所の周りだけを作り直せばよいので、掘ったり盛ったりしてもすぐに形が変わる。ボールは同じ値の場を当たり判定に使っている。"
        );
      },
    };
  },
};
