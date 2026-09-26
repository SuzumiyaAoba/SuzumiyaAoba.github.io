import {
  BoxGeometry,
  Color,
  EdgesGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
} from "three";
import type { Vector3 } from "three";
import { clamp, rng, standard } from "./kit";
import type { DemoContext } from "./types";

/**
 * 2 次元の粒子流体の入れ物。近傍探索（格子）、水槽の壁、棒による押しのけ、描画を受け持つ。
 * 流体の解き方（SPH・PBF など）はデモ側で書く。
 */
export class FluidTank {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly capacity: number;
  count = 0;
  readonly x: Float64Array;
  readonly y: Float64Array;
  readonly vx: Float64Array;
  readonly vy: Float64Array;
  readonly px: Float64Array;
  readonly py: Float64Array;
  /** 近傍リスト（CSR 形式）。neighborStart[i]〜neighborStart[i+1] が粒子 i の近傍。 */
  neighborStart: Int32Array;
  neighbors: Int32Array;
  private readonly gridWidth: number;
  private readonly gridHeight: number;
  private readonly head: Int32Array;
  private readonly next: Int32Array;

  constructor(options: {
    width: number;
    height: number;
    radius: number;
    capacity: number;
  }) {
    this.width = options.width;
    this.height = options.height;
    this.radius = options.radius;
    this.capacity = options.capacity;
    const n = options.capacity;
    this.x = new Float64Array(n);
    this.y = new Float64Array(n);
    this.vx = new Float64Array(n);
    this.vy = new Float64Array(n);
    this.px = new Float64Array(n);
    this.py = new Float64Array(n);
    this.neighborStart = new Int32Array(n + 1);
    this.neighbors = new Int32Array(n * 48);
    this.gridWidth = Math.ceil(this.width / this.radius) + 1;
    this.gridHeight = Math.ceil(this.height / this.radius) + 1;
    this.head = new Int32Array(this.gridWidth * this.gridHeight);
    this.next = new Int32Array(n);
  }

  /** 左下から幅 w・高さ h の長方形に、間隔 spacing で粒子を並べる。 */
  fillBlock(
    left: number,
    bottom: number,
    w: number,
    h: number,
    spacing: number
  ) {
    this.count = 0;
    for (let j = 0; j < Math.floor(h / spacing); j++) {
      for (let i = 0; i < Math.floor(w / spacing); i++) {
        if (this.count >= this.capacity) {
          return;
        }
        const k = this.count++;
        this.x[k] = left + i * spacing + (j % 2) * spacing * 0.01;
        this.y[k] = bottom + j * spacing;
        this.vx[k] = 0;
        this.vy[k] = 0;
      }
    }
  }

  cellOf(value: number, size: number) {
    return Math.max(0, Math.min(size - 1, Math.floor(value / this.radius)));
  }

  /** 格子に粒子を振り分け、半径 radius 以内の近傍を列挙する。 */
  findNeighbors() {
    const { head, next, radius, gridWidth, gridHeight } = this;
    head.fill(-1);
    for (let i = 0; i < this.count; i++) {
      const cell =
        this.cellOf(this.y[i] ?? 0, gridHeight) * gridWidth +
        this.cellOf(this.x[i] ?? 0, gridWidth);
      next[i] = head[cell] ?? -1;
      head[cell] = i;
    }
    const r2 = radius * radius;
    let cursor = 0;
    for (let i = 0; i < this.count; i++) {
      this.neighborStart[i] = cursor;
      const xi = this.x[i] ?? 0;
      const yi = this.y[i] ?? 0;
      const cx = this.cellOf(xi, gridWidth);
      const cy = this.cellOf(yi, gridHeight);
      for (let oy = -1; oy <= 1; oy++) {
        const gy = cy + oy;
        if (gy < 0 || gy >= gridHeight) {
          continue;
        }
        for (let ox = -1; ox <= 1; ox++) {
          const gx = cx + ox;
          if (gx < 0 || gx >= gridWidth) {
            continue;
          }
          for (
            let j = head[gy * gridWidth + gx] ?? -1;
            j >= 0;
            j = next[j] ?? -1
          ) {
            if (j === i) {
              continue;
            }
            const dx = (this.x[j] ?? 0) - xi;
            const dy = (this.y[j] ?? 0) - yi;
            if (dx * dx + dy * dy < r2 && cursor < this.neighbors.length) {
              this.neighbors[cursor++] = j;
            }
          }
        }
      }
    }
    this.neighborStart[this.count] = cursor;
  }

  /** 壁と、円形の棒（obstacle）から粒子を押し出す。 */
  collide(obstacle: { x: number; y: number; r: number } | null) {
    const margin = 0.01;
    for (let i = 0; i < this.count; i++) {
      let x = this.x[i] ?? 0;
      let y = this.y[i] ?? 0;
      if (obstacle) {
        const dx = x - obstacle.x;
        const dy = y - obstacle.y;
        const d = Math.hypot(dx, dy);
        if (d < obstacle.r && d > 1e-6) {
          x = obstacle.x + (dx / d) * obstacle.r;
          y = obstacle.y + (dy / d) * obstacle.r;
        }
      }
      this.x[i] = clamp(x, margin, this.width - margin);
      this.y[i] = clamp(y, margin, this.height - margin);
    }
  }
}

/** 粒子を球で描き、ガラスの水槽の枠を添える。 */
export function tankView(
  context: DemoContext,
  tank: FluidTank,
  options: { origin: Vector3; particleRadius: number }
) {
  const { scene } = context;
  const random = rng(3);
  const depth = new Float32Array(tank.capacity).map(
    () => (random() - 0.5) * 0.25
  );
  const mesh = new InstancedMesh(
    new SphereGeometry(options.particleRadius, 10, 8),
    standard("#ffffff", { roughness: 0.25, metalness: 0 }),
    tank.capacity
  );
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  scene.add(mesh);
  const glassGeometry = new BoxGeometry(tank.width, tank.height, 0.45);
  const glass = new Mesh(
    glassGeometry,
    new MeshPhysicalMaterial({
      color: "#9fd7ff",
      transparent: true,
      opacity: 0.06,
      roughness: 0.05,
      depthWrite: false,
    })
  );
  glass.position.set(
    options.origin.x + tank.width / 2,
    options.origin.y + tank.height / 2,
    options.origin.z
  );
  const edges = new LineSegments(
    new EdgesGeometry(glassGeometry),
    new LineBasicMaterial({ color: "#7f93b0" })
  );
  edges.position.copy(glass.position);
  scene.add(glass, edges);
  const matrix = new Matrix4();
  const color = new Color();
  const slow = new Color("#1d5fd6");
  const fast = new Color("#bfeaff");
  const update = (value: (i: number) => number) => {
    for (let i = 0; i < tank.capacity; i++) {
      if (i >= tank.count) {
        matrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, matrix);
        continue;
      }
      matrix.makeTranslation(
        options.origin.x + (tank.x[i] ?? 0),
        options.origin.y + (tank.y[i] ?? 0),
        options.origin.z + (depth[i] ?? 0)
      );
      mesh.setMatrixAt(i, matrix);
      color.copy(slow).lerp(fast, clamp(value(i)));
      mesh.setColorAt(i, color);
    }
    mesh.count = tank.capacity;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  };
  return { mesh, update };
}

/** 任意の粒子配列を水槽に描く（PIC・FLIP・APIC・MPM 用）。 */
export function particleView(
  context: DemoContext,
  options: {
    capacity: number;
    width: number;
    height: number;
    origin: Vector3;
    particleRadius: number;
    colors?: readonly [string, string];
  }
) {
  const { scene } = context;
  const random = rng(5);
  const depth = new Float32Array(options.capacity).map(
    () => (random() - 0.5) * 0.3
  );
  const mesh = new InstancedMesh(
    new SphereGeometry(options.particleRadius, 8, 6),
    standard("#ffffff", { roughness: 0.3, metalness: 0 }),
    options.capacity
  );
  mesh.frustumCulled = false;
  scene.add(mesh);
  const glassGeometry = new BoxGeometry(options.width, options.height, 0.45);
  const edges = new LineSegments(
    new EdgesGeometry(glassGeometry),
    new LineBasicMaterial({ color: "#7f93b0" })
  );
  edges.position.set(
    options.origin.x + options.width / 2,
    options.origin.y + options.height / 2,
    options.origin.z
  );
  scene.add(edges);
  const matrix = new Matrix4();
  const color = new Color();
  const low = new Color(options.colors?.[0] ?? "#1d5fd6");
  const high = new Color(options.colors?.[1] ?? "#bfeaff");
  const update = (
    count: number,
    position: (i: number) => [number, number],
    value: (i: number) => number,
    tint?: (i: number, out: Color) => void
  ) => {
    for (let i = 0; i < options.capacity; i++) {
      if (i >= count) {
        matrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, matrix);
        continue;
      }
      const [x, y] = position(i);
      matrix.makeTranslation(
        options.origin.x + x,
        options.origin.y + y,
        options.origin.z + (depth[i] ?? 0)
      );
      mesh.setMatrixAt(i, matrix);
      if (tint) {
        tint(i, color);
      } else {
        color.copy(low).lerp(high, clamp(value(i)));
      }
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  };
  return { mesh, update };
}
