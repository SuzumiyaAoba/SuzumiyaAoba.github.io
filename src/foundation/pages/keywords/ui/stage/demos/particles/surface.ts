import {
  Mesh,
  SphereGeometry,
  Vector3,
  WireframeGeometry,
  LineSegments,
  LineBasicMaterial,
} from "three";
import { palette, rng, standard } from "../../kit";
import { particleSystem } from "../../particles";
import type { DemoModule } from "../../types";

const COUNT = 1800;
const RADIUS = 1.2;
const CENTER = new Vector3(0, 1.6, 0);

export const demo: DemoModule = {
  alt: "球の表面から炎の粒子が立ち上るデモ。表面上の位置を頂点から選ぶと、頂点が密集した上下の極にばかり粒子が出る。三角形を面積で重み付けして選び、その内部の一点を取ると、表面全体から均一に燃え上がる。",
  camera: { position: [3.6, 2.8, 4.6], target: [0, 1.6, 0] },
  bloom: { strength: 0.9, radius: 0.5, threshold: 0.55 },
  studio: { background: "#06080d" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "放出位置の選び方",
      value: "area",
      options: [
        { value: "vertex", label: "頂点からランダム" },
        { value: "area", label: "面積で重み付けした三角形" },
      ],
    },
    {
      type: "toggle",
      key: "wire",
      label: "メッシュの頂点と辺を表示",
      value: true,
    },
    {
      type: "range",
      key: "rise",
      label: "上昇の強さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 0.8,
    },
  ],
  legend: [
    { color: palette.amber, label: "表面から出る粒子" },
    { color: palette.muted, label: "メッシュの辺（UV 球は極ほど細かい）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(19);
    const geometry = new SphereGeometry(RADIUS, 40, 24);
    const core = new Mesh(
      geometry,
      standard("#2b1a18", { roughness: 0.6, emissive: 0 })
    );
    core.material.emissive.set("#ff5a1f");
    core.material.emissiveIntensity = 0.25;
    core.position.copy(CENTER);
    core.castShadow = true;
    const wire = new LineSegments(
      new WireframeGeometry(geometry),
      new LineBasicMaterial({
        color: palette.muted,
        transparent: true,
        opacity: 0.35,
      })
    );
    wire.position.copy(CENTER);
    scene.add(core, wire);

    // 三角形ごとの面積の累積（重み付き抽選用）
    const position = geometry.getAttribute("position");
    const index = geometry.getIndex();
    const triangles = index ? index.count / 3 : 0;
    const cumulative = new Float32Array(triangles);
    const a = new Vector3();
    const b = new Vector3();
    const c = new Vector3();
    let total = 0;
    for (let triangle = 0; triangle < triangles; triangle++) {
      a.fromBufferAttribute(position, index?.getX(triangle * 3) ?? 0);
      b.fromBufferAttribute(position, index?.getX(triangle * 3 + 1) ?? 0);
      c.fromBufferAttribute(position, index?.getX(triangle * 3 + 2) ?? 0);
      total += b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
      cumulative[triangle] = total;
    }
    const pickTriangle = () => {
      const target = random() * total;
      let low = 0;
      let high = triangles - 1;
      while (low < high) {
        const middle = (low + high) >> 1;
        if ((cumulative[middle] ?? 0) < target) {
          low = middle + 1;
        } else {
          high = middle;
        }
      }
      return low;
    };
    const sample = (mode: string, out: Vector3) => {
      if (mode === "vertex") {
        return out.fromBufferAttribute(
          position,
          Math.floor(random() * position.count)
        );
      }
      const triangle = pickTriangle();
      a.fromBufferAttribute(position, index?.getX(triangle * 3) ?? 0);
      b.fromBufferAttribute(position, index?.getX(triangle * 3 + 1) ?? 0);
      c.fromBufferAttribute(position, index?.getX(triangle * 3 + 2) ?? 0);
      // 三角形内の一様な点（重心座標）
      let u = random();
      let v = random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      return out
        .copy(a)
        .addScaledVector(b.clone().sub(a), u)
        .addScaledVector(c.clone().sub(a), v);
    };

    const particles = particleSystem({ capacity: COUNT });
    scene.add(particles);
    const origins = Array.from({ length: COUNT }, () => new Vector3());
    const normals = Array.from({ length: COUNT }, () => new Vector3());
    const ages = Float32Array.from({ length: COUNT }, () => random());
    const lives = Float32Array.from(
      { length: COUNT },
      () => 0.8 + random() * 0.8
    );
    const point = new Vector3();
    let polar = 0;

    return {
      update({ dt, time }) {
        const mode = String(params["mode"]);
        const rise = Number(params["rise"]);
        polar = 0;
        for (let particle = 0; particle < COUNT; particle++) {
          const life = lives[particle] ?? 1;
          let age = (ages[particle] ?? 0) + dt / life;
          const origin = origins[particle];
          const normal = normals[particle];
          if (!(origin && normal)) {
            continue;
          }
          if (age >= 1 || origin.lengthSq() === 0) {
            age %= 1;
            sample(mode, origin);
            normal.copy(origin).normalize();
          }
          ages[particle] = age;
          if (Math.abs(origin.y) > RADIUS * 0.8) {
            polar++;
          }
          const t = age;
          point
            .copy(origin)
            .addScaledVector(normal, t * 0.45)
            .add(CENTER);
          point.y += t * t * rise * 1.4;
          point.x += Math.sin(time * 3 + particle) * 0.04 * t;
          particles.positions.set([point.x, point.y, point.z], particle * 3);
          particles.sizes[particle] =
            (0.14 - t * 0.1) * (0.8 + (particle % 5) * 0.1);
          const heat = 1 - t;
          particles.colors.set(
            [1.6 * heat + 0.4, 0.7 * heat * heat + 0.1, 0.15 * heat, heat],
            particle * 4
          );
        }
        particles.setCount(COUNT);
        particles.commit();
        wire.visible = params["wire"] === true;
        core.rotation.y += dt * 0.15;
        wire.rotation.y = core.rotation.y;
        const expected = 0.2;
        context.readout(
          "極付近（|y| > 0.8r）の割合",
          `${((polar / COUNT) * 100).toFixed(1)} %`
        );
        context.readout("面積どおりなら", `${(expected * 100).toFixed(1)} %`);
        context.caption(
          mode === "vertex"
            ? "UV 球の頂点は極に集中している。頂点から選ぶと、見た目の面積とは関係なく極ばかりから粒子が出てしまう。"
            : "三角形を面積に比例した確率で選び、その中の一点を一様に取る。メッシュの分割の粗密に関係なく、表面全体から均等に放出できる。"
        );
      },
    };
  },
};
