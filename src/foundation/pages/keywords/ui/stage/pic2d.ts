/**
 * 格子と粒子を組み合わせた 2 次元の流体（PIC / FLIP / APIC）。
 * Matthias Müller の「Ten Minute Physics」の FLIP 実装をもとに、APIC の受け渡しを加えたもの。
 * 速度は MAC 格子（u はセルの左辺、v は下辺）に置き、粒子と格子の間で毎ステップ受け渡す。
 */

const FLUID = 0;
const AIR = 1;
const SOLID = 2;

export type Transfer = "pic" | "flip" | "apic";

export type PicObstacle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
} | null;

export class PicFluid {
  readonly numX: number;
  readonly numY: number;
  readonly h: number;
  readonly invH: number;
  readonly numCells: number;
  readonly u: Float32Array;
  readonly v: Float32Array;
  readonly du: Float32Array;
  readonly dv: Float32Array;
  readonly prevU: Float32Array;
  readonly prevV: Float32Array;
  readonly pressure: Float32Array;
  readonly solid: Float32Array; // 1 = 流体が入れる、0 = 壁
  readonly cellType: Int32Array;
  readonly particleDensity: Float32Array;
  restDensity = 0;

  readonly maxParticles: number;
  count = 0;
  readonly pos: Float32Array;
  readonly vel: Float32Array;
  /** APIC 用：粒子ごとの速度の傾き（u の勾配 2 成分、v の勾配 2 成分）。 */
  readonly affine: Float32Array;
  readonly radius: number;

  private readonly pInvSpacing: number;
  private readonly pNumX: number;
  private readonly pNumY: number;
  private readonly pNumCells: number;
  private readonly numCellParticles: Int32Array;
  private readonly firstCellParticle: Int32Array;
  private readonly cellParticleIds: Int32Array;

  constructor(
    width: number,
    height: number,
    spacing: number,
    particleRadius: number,
    maxParticles: number
  ) {
    this.numX = Math.floor(width / spacing) + 1;
    this.numY = Math.floor(height / spacing) + 1;
    this.h = Math.max(width / this.numX, height / this.numY);
    this.invH = 1 / this.h;
    this.numCells = this.numX * this.numY;
    const n = this.numCells;
    this.u = new Float32Array(n);
    this.v = new Float32Array(n);
    this.du = new Float32Array(n);
    this.dv = new Float32Array(n);
    this.prevU = new Float32Array(n);
    this.prevV = new Float32Array(n);
    this.pressure = new Float32Array(n);
    this.solid = new Float32Array(n);
    this.cellType = new Int32Array(n);
    this.particleDensity = new Float32Array(n);
    this.maxParticles = maxParticles;
    this.pos = new Float32Array(2 * maxParticles);
    this.vel = new Float32Array(2 * maxParticles);
    this.affine = new Float32Array(4 * maxParticles);
    this.radius = particleRadius;
    this.pInvSpacing = 1 / (2.2 * particleRadius);
    this.pNumX = Math.floor(width * this.pInvSpacing) + 1;
    this.pNumY = Math.floor(height * this.pInvSpacing) + 1;
    this.pNumCells = this.pNumX * this.pNumY;
    this.numCellParticles = new Int32Array(this.pNumCells);
    this.firstCellParticle = new Int32Array(this.pNumCells + 1);
    this.cellParticleIds = new Int32Array(maxParticles);
    // 外周のセルを壁にする
    for (let i = 0; i < this.numX; i++) {
      for (let j = 0; j < this.numY; j++) {
        this.solid[i * this.numY + j] =
          i === 0 || i === this.numX - 1 || j === 0 ? 0 : 1;
      }
    }
  }

  private integrate(dt: number, gravity: number) {
    for (let i = 0; i < this.count; i++) {
      this.vel[2 * i + 1] = (this.vel[2 * i + 1] ?? 0) + dt * gravity;
      this.pos[2 * i] = (this.pos[2 * i] ?? 0) + (this.vel[2 * i] ?? 0) * dt;
      this.pos[2 * i + 1] =
        (this.pos[2 * i + 1] ?? 0) + (this.vel[2 * i + 1] ?? 0) * dt;
    }
  }

  /** 粒子同士が重ならないよう押し離す（格子の外で粒子が固まるのを防ぐ）。 */
  private pushApart(iterations: number) {
    const { pNumX, pNumY, pInvSpacing } = this;
    this.numCellParticles.fill(0);
    for (let i = 0; i < this.count; i++) {
      const xi = Math.max(
        0,
        Math.min(pNumX - 1, Math.floor((this.pos[2 * i] ?? 0) * pInvSpacing))
      );
      const yi = Math.max(
        0,
        Math.min(
          pNumY - 1,
          Math.floor((this.pos[2 * i + 1] ?? 0) * pInvSpacing)
        )
      );
      const cell = xi * pNumY + yi;
      this.numCellParticles[cell] = (this.numCellParticles[cell] ?? 0) + 1;
    }
    let first = 0;
    for (let i = 0; i < this.pNumCells; i++) {
      first += this.numCellParticles[i] ?? 0;
      this.firstCellParticle[i] = first;
    }
    this.firstCellParticle[this.pNumCells] = first;
    for (let i = 0; i < this.count; i++) {
      const xi = Math.max(
        0,
        Math.min(pNumX - 1, Math.floor((this.pos[2 * i] ?? 0) * pInvSpacing))
      );
      const yi = Math.max(
        0,
        Math.min(
          pNumY - 1,
          Math.floor((this.pos[2 * i + 1] ?? 0) * pInvSpacing)
        )
      );
      const cell = xi * pNumY + yi;
      this.firstCellParticle[cell] = (this.firstCellParticle[cell] ?? 0) - 1;
      this.cellParticleIds[this.firstCellParticle[cell] ?? 0] = i;
    }
    const minDist = 2 * this.radius;
    const minDist2 = minDist * minDist;
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (let i = 0; i < this.count; i++) {
        const px = this.pos[2 * i] ?? 0;
        const py = this.pos[2 * i + 1] ?? 0;
        const pxi = Math.floor(px * pInvSpacing);
        const pyi = Math.floor(py * pInvSpacing);
        for (
          let xi = Math.max(pxi - 1, 0);
          xi <= Math.min(pxi + 1, pNumX - 1);
          xi++
        ) {
          for (
            let yi = Math.max(pyi - 1, 0);
            yi <= Math.min(pyi + 1, pNumY - 1);
            yi++
          ) {
            const cell = xi * pNumY + yi;
            for (
              let k = this.firstCellParticle[cell] ?? 0;
              k < (this.firstCellParticle[cell + 1] ?? 0);
              k++
            ) {
              const id = this.cellParticleIds[k] ?? 0;
              if (id === i) {
                continue;
              }
              let dx = (this.pos[2 * id] ?? 0) - (this.pos[2 * i] ?? 0);
              let dy = (this.pos[2 * id + 1] ?? 0) - (this.pos[2 * i + 1] ?? 0);
              const d2 = dx * dx + dy * dy;
              if (d2 > minDist2 || d2 === 0) {
                continue;
              }
              const d = Math.sqrt(d2);
              const s = (0.5 * (minDist - d)) / d;
              dx *= s;
              dy *= s;
              this.pos[2 * i] = (this.pos[2 * i] ?? 0) - dx;
              this.pos[2 * i + 1] = (this.pos[2 * i + 1] ?? 0) - dy;
              this.pos[2 * id] = (this.pos[2 * id] ?? 0) + dx;
              this.pos[2 * id + 1] = (this.pos[2 * id + 1] ?? 0) + dy;
            }
          }
        }
      }
    }
  }

  private collide(obstacle: PicObstacle) {
    const { h, radius: r } = this;
    const minX = h + r;
    const maxX = (this.numX - 1) * h - r;
    const minY = h + r;
    const maxY = (this.numY - 1) * h - r;
    for (let i = 0; i < this.count; i++) {
      let x = this.pos[2 * i] ?? 0;
      let y = this.pos[2 * i + 1] ?? 0;
      if (obstacle) {
        const dx = x - obstacle.x;
        const dy = y - obstacle.y;
        const d2 = dx * dx + dy * dy;
        const minDist = obstacle.r + r;
        if (d2 < minDist * minDist) {
          const d = Math.sqrt(d2) || 1e-6;
          x = obstacle.x + (dx / d) * minDist;
          y = obstacle.y + (dy / d) * minDist;
          this.vel[2 * i] = obstacle.vx;
          this.vel[2 * i + 1] = obstacle.vy;
        }
      }
      if (x < minX) {
        x = minX;
        this.vel[2 * i] = 0;
      }
      if (x > maxX) {
        x = maxX;
        this.vel[2 * i] = 0;
      }
      if (y < minY) {
        y = minY;
        this.vel[2 * i + 1] = 0;
      }
      if (y > maxY) {
        y = maxY;
        this.vel[2 * i + 1] = 0;
      }
      this.pos[2 * i] = x;
      this.pos[2 * i + 1] = y;
    }
  }

  private updateDensity() {
    const { numY: n, h, invH } = this;
    const h2 = 0.5 * h;
    const d = this.particleDensity;
    d.fill(0);
    for (let i = 0; i < this.count; i++) {
      const x = Math.max(
        h,
        Math.min((this.numX - 1) * h, this.pos[2 * i] ?? 0)
      );
      const y = Math.max(
        h,
        Math.min((this.numY - 1) * h, this.pos[2 * i + 1] ?? 0)
      );
      const x0 = Math.floor((x - h2) * invH);
      const tx = (x - h2 - x0 * h) * invH;
      const x1 = Math.min(x0 + 1, this.numX - 2);
      const y0 = Math.floor((y - h2) * invH);
      const ty = (y - h2 - y0 * h) * invH;
      const y1 = Math.min(y0 + 1, this.numY - 2);
      const sx = 1 - tx;
      const sy = 1 - ty;
      if (x0 < this.numX && y0 < this.numY) {
        d[x0 * n + y0] = (d[x0 * n + y0] ?? 0) + sx * sy;
      }
      if (x1 < this.numX && y0 < this.numY) {
        d[x1 * n + y0] = (d[x1 * n + y0] ?? 0) + tx * sy;
      }
      if (x1 < this.numX && y1 < this.numY) {
        d[x1 * n + y1] = (d[x1 * n + y1] ?? 0) + tx * ty;
      }
      if (x0 < this.numX && y1 < this.numY) {
        d[x0 * n + y1] = (d[x0 * n + y1] ?? 0) + sx * ty;
      }
    }
    if (this.restDensity === 0) {
      let sum = 0;
      let fluidCells = 0;
      for (let i = 0; i < this.numCells; i++) {
        if (this.cellType[i] === FLUID) {
          sum += d[i] ?? 0;
          fluidCells++;
        }
      }
      if (fluidCells > 0) {
        this.restDensity = sum / fluidCells;
      }
    }
  }

  /** 粒子 ↔ 格子の速度の受け渡し。toGrid = true で粒子から格子へ、false で格子から粒子へ。 */
  private transfer(toGrid: boolean, mode: Transfer, flipRatio: number) {
    const { numY: n, h, invH } = this;
    const h2 = 0.5 * h;
    if (toGrid) {
      this.prevU.set(this.u);
      this.prevV.set(this.v);
      this.du.fill(0);
      this.dv.fill(0);
      this.u.fill(0);
      this.v.fill(0);
      for (let i = 0; i < this.numCells; i++) {
        this.cellType[i] = this.solid[i] === 0 ? SOLID : AIR;
      }
      for (let i = 0; i < this.count; i++) {
        const xi = Math.max(
          0,
          Math.min(this.numX - 1, Math.floor((this.pos[2 * i] ?? 0) * invH))
        );
        const yi = Math.max(
          0,
          Math.min(this.numY - 1, Math.floor((this.pos[2 * i + 1] ?? 0) * invH))
        );
        const cell = xi * n + yi;
        if (this.cellType[cell] === AIR) {
          this.cellType[cell] = FLUID;
        }
      }
    }
    for (let component = 0; component < 2; component++) {
      const dx = component === 0 ? 0 : h2;
      const dy = component === 0 ? h2 : 0;
      const f = component === 0 ? this.u : this.v;
      const prevF = component === 0 ? this.prevU : this.prevV;
      const d = component === 0 ? this.du : this.dv;
      for (let i = 0; i < this.count; i++) {
        const px = this.pos[2 * i] ?? 0;
        const py = this.pos[2 * i + 1] ?? 0;
        const x = Math.max(h, Math.min((this.numX - 1) * h, px));
        const y = Math.max(h, Math.min((this.numY - 1) * h, py));
        const x0 = Math.min(Math.floor((x - dx) * invH), this.numX - 2);
        const tx = (x - dx - x0 * h) * invH;
        const x1 = Math.min(x0 + 1, this.numX - 2);
        const y0 = Math.min(Math.floor((y - dy) * invH), this.numY - 2);
        const ty = (y - dy - y0 * h) * invH;
        const y1 = Math.min(y0 + 1, this.numY - 2);
        const sx = 1 - tx;
        const sy = 1 - ty;
        const weights = [sx * sy, tx * sy, tx * ty, sx * ty];
        const nodes = [x0 * n + y0, x1 * n + y0, x1 * n + y1, x0 * n + y1];
        // 各格子点の位置（粒子からの相対位置）：APIC の傾きに使う
        const offsets = [
          [x0 * h + dx - px, y0 * h + dy - py],
          [x1 * h + dx - px, y0 * h + dy - py],
          [x1 * h + dx - px, y1 * h + dy - py],
          [x0 * h + dx - px, y1 * h + dy - py],
        ];
        const cx = this.affine[4 * i + component * 2] ?? 0;
        const cy = this.affine[4 * i + component * 2 + 1] ?? 0;
        if (toGrid) {
          const pv = this.vel[2 * i + component] ?? 0;
          for (let k = 0; k < 4; k++) {
            const node = nodes[k] ?? 0;
            const w = weights[k] ?? 0;
            const [ox, oy] = offsets[k] ?? [0, 0];
            // APIC：粒子の速度に、速度の傾き × 格子点までの距離を足して渡す
            const value =
              mode === "apic" ? pv + cx * (ox ?? 0) + cy * (oy ?? 0) : pv;
            f[node] = (f[node] ?? 0) + value * w;
            d[node] = (d[node] ?? 0) + w;
          }
        } else {
          const offset = component === 0 ? n : 1;
          const valid = nodes.map((node) =>
            this.cellType[node] !== AIR || this.cellType[node - offset] !== AIR
              ? 1
              : 0
          );
          let weightSum = 0;
          for (let k = 0; k < 4; k++) {
            weightSum += (valid[k] ?? 0) * (weights[k] ?? 0);
          }
          if (weightSum <= 0) {
            continue;
          }
          let picV = 0;
          let corr = 0;
          let gradX = 0;
          let gradY = 0;
          const gradWeights = [
            [-sy * invH, -sx * invH],
            [sy * invH, -tx * invH],
            [ty * invH, tx * invH],
            [-ty * invH, sx * invH],
          ];
          for (let k = 0; k < 4; k++) {
            const node = nodes[k] ?? 0;
            const w = (valid[k] ?? 0) * (weights[k] ?? 0);
            picV += w * (f[node] ?? 0);
            corr += w * ((f[node] ?? 0) - (prevF[node] ?? 0));
            const [gx, gy] = gradWeights[k] ?? [0, 0];
            gradX += (valid[k] ?? 0) * (gx ?? 0) * (f[node] ?? 0);
            gradY += (valid[k] ?? 0) * (gy ?? 0) * (f[node] ?? 0);
          }
          picV /= weightSum;
          corr /= weightSum;
          const current = this.vel[2 * i + component] ?? 0;
          if (mode === "pic") {
            this.vel[2 * i + component] = picV;
          } else if (mode === "flip") {
            this.vel[2 * i + component] =
              (1 - flipRatio) * picV + flipRatio * (current + corr);
          } else {
            this.vel[2 * i + component] = picV;
            this.affine[4 * i + component * 2] = gradX;
            this.affine[4 * i + component * 2 + 1] = gradY;
          }
        }
      }
      if (toGrid) {
        for (let i = 0; i < f.length; i++) {
          if ((d[i] ?? 0) > 0) {
            f[i] = (f[i] ?? 0) / (d[i] ?? 1);
          }
        }
        // 壁に接する速度は 0 に戻す
        for (let i = 0; i < this.numX; i++) {
          for (let j = 0; j < this.numY; j++) {
            const solidCell = this.cellType[i * n + j] === SOLID;
            if (
              solidCell ||
              (i > 0 && this.cellType[(i - 1) * n + j] === SOLID)
            ) {
              this.u[i * n + j] = this.prevU[i * n + j] ?? 0;
            }
            if (
              solidCell ||
              (j > 0 && this.cellType[i * n + j - 1] === SOLID)
            ) {
              this.v[i * n + j] = this.prevV[i * n + j] ?? 0;
            }
          }
        }
      }
    }
  }

  /** 圧力投影（ガウス＝ザイデル法 + 過緩和）。粒子の密集を補正して体積のずれも防ぐ。 */
  private solve(iterations: number, dt: number, overRelaxation: number) {
    const { numY: n } = this;
    this.pressure.fill(0);
    this.prevU.set(this.u);
    this.prevV.set(this.v);
    const cp = (1000 * this.h) / dt;
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (let i = 1; i < this.numX - 1; i++) {
        for (let j = 1; j < this.numY - 1; j++) {
          if (this.cellType[i * n + j] !== FLUID) {
            continue;
          }
          const center = i * n + j;
          const left = (i - 1) * n + j;
          const right = (i + 1) * n + j;
          const bottom = i * n + j - 1;
          const top = i * n + j + 1;
          const sx0 = this.solid[left] ?? 0;
          const sx1 = this.solid[right] ?? 0;
          const sy0 = this.solid[bottom] ?? 0;
          const sy1 = this.solid[top] ?? 0;
          const s = sx0 + sx1 + sy0 + sy1;
          if (s === 0) {
            continue;
          }
          let divergence =
            (this.u[right] ?? 0) -
            (this.u[center] ?? 0) +
            (this.v[top] ?? 0) -
            (this.v[center] ?? 0);
          if (this.restDensity > 0) {
            const compression =
              (this.particleDensity[center] ?? 0) - this.restDensity;
            if (compression > 0) {
              divergence -= compression;
            }
          }
          const p = (-divergence / s) * overRelaxation;
          this.pressure[center] = (this.pressure[center] ?? 0) + cp * p;
          this.u[center] = (this.u[center] ?? 0) - sx0 * p;
          this.u[right] = (this.u[right] ?? 0) + sx1 * p;
          this.v[center] = (this.v[center] ?? 0) - sy0 * p;
          this.v[top] = (this.v[top] ?? 0) + sy1 * p;
        }
      }
    }
  }

  step(options: {
    dt: number;
    gravity: number;
    mode: Transfer;
    flipRatio: number;
    pressureIterations: number;
    obstacle: PicObstacle;
  }) {
    const substeps = 1;
    const sdt = options.dt / substeps;
    for (let s = 0; s < substeps; s++) {
      this.integrate(sdt, options.gravity);
      this.pushApart(2);
      this.collide(options.obstacle);
      this.transfer(true, options.mode, options.flipRatio);
      this.updateDensity();
      this.solve(options.pressureIterations, sdt, 1.9);
      this.transfer(false, options.mode, options.flipRatio);
    }
  }

  /** セルの種類（0 = 水、1 = 空気、2 = 壁）。 */
  typeAt(i: number, j: number) {
    return this.cellType[i * this.numY + j] ?? AIR;
  }
}
