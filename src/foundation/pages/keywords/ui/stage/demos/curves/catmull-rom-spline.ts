import {
  BoxGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  PerspectiveCamera,
  Vector3,
} from "three";
import { palette, polyline, rng, standard } from "../../kit";
import { handle } from "../../widgets";
import type { DemoModule } from "../../types";

const RAIL_HEIGHT = 1.6;
const SAMPLES = 240;
const INSET_LAYER = 1;

export const demo: DemoModule = {
  alt: "小さなステージの周りに置いた通過点を、カトマル・ロム曲線で結んだカメラレール。カメラが曲線に沿って移動し、右上にそのカメラの映像が表示される。曲線の種類を切り替えると、点の間隔が不均一な場所での膨らみ方が変わる。",
  camera: { position: [0, 9.5, 9.5], target: [0, 0.6, 0] },
  controls: [
    {
      type: "select",
      key: "type",
      label: "パラメータ化",
      value: "centripetal",
      options: [
        { value: "catmullrom", label: "一様" },
        { value: "centripetal", label: "求心" },
        { value: "chordal", label: "弦長" },
      ],
      hint: "一様は点の間隔が偏ると行き過ぎやループが出ます。求心はそれが起きにくい定番設定です。",
    },
    {
      type: "select",
      key: "look",
      label: "カメラの向き",
      value: "center",
      options: [
        { value: "center", label: "ステージ中央を注視" },
        { value: "forward", label: "進行方向" },
      ],
    },
    {
      type: "range",
      key: "speed",
      label: "1 周の時間",
      min: 4,
      max: 20,
      step: 1,
      value: 10,
      format: (value) => `${value} 秒`,
    },
    { type: "toggle", key: "inset", label: "カメラの映像を表示", value: true },
  ],
  hint: "通過点（白い球）をドラッグして経路を変えられます。曲線は必ずすべての通過点を通ります。",
  setup(context) {
    const { scene, params, renderer, camera } = context;
    camera.layers.enable(INSET_LAYER);
    const random = rng(4);
    const colors = [
      palette.cyan,
      palette.amber,
      palette.violet,
      palette.coral,
      palette.sky,
    ];
    for (let index = 0; index < 9; index++) {
      const angle = (index / 9) * Math.PI * 2 + random();
      const radius = random() * 1.6;
      const height = 0.4 + random() * 1.8;
      const mesh =
        index % 3 === 0
          ? new Mesh(
              new CylinderGeometry(0.3, 0.3, height, 24),
              standard(colors[index % colors.length] ?? palette.ink, {
                roughness: 0.4,
              })
            )
          : new Mesh(
              new BoxGeometry(0.55, height, 0.55),
              standard(colors[index % colors.length] ?? palette.ink, {
                roughness: 0.5,
              })
            );
      mesh.position.set(
        Math.cos(angle) * radius,
        height / 2,
        Math.sin(angle) * radius
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    const waypoints = [
      new Vector3(-4, RAIL_HEIGHT, -2.2),
      new Vector3(-0.6, RAIL_HEIGHT + 0.8, -3.8),
      new Vector3(0.1, RAIL_HEIGHT + 0.6, -3.4),
      new Vector3(4.2, RAIL_HEIGHT, -1.4),
      new Vector3(3.2, RAIL_HEIGHT + 1, 3.2),
      new Vector3(-2.8, RAIL_HEIGHT + 0.4, 3.6),
    ];
    for (const [index, point] of waypoints.entries()) {
      const item = handle(palette.ink, 0.12);
      item.position.copy(point);
      scene.add(item);
      const label = context.label(`${index + 1}`, { tone: "muted" });
      label.position.set(0, 0.35, 0);
      item.add(label);
      context.draggable(item, {
        clamp: (position) => {
          position.x = Math.max(-5.5, Math.min(5.5, position.x));
          position.z = Math.max(-5, Math.min(5, position.z));
        },
        onDrag: (position) => point.copy(position),
      });
    }
    const curve = new CatmullRomCurve3(waypoints, true, "centripetal", 0.5);
    const rail = polyline([], palette.cyan, { width: 3 });
    const railShadow = polyline([], palette.cyan, { width: 1, opacity: 0.25 });
    scene.add(rail, railShadow);

    // レールを走るカメラの模型（メインカメラにだけ見せる）。Object3D.lookAt は +Z を対象へ向ける。
    const dolly = new Group();
    const body = new Mesh(
      new BoxGeometry(0.34, 0.26, 0.44),
      standard("#2c3444", { metalness: 0.4, roughness: 0.4 })
    );
    const lens = new Mesh(
      new CylinderGeometry(0.09, 0.11, 0.18, 20),
      standard("#11151c", { metalness: 0.6 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.3;
    const frustum = new Mesh(
      new ConeGeometry(0.45, 0.9, 4, 1, true),
      standard(palette.amber, { emissive: 0.4 })
    );
    frustum.material.transparent = true;
    frustum.material.opacity = 0.18;
    frustum.material.depthWrite = false;
    frustum.rotation.x = -Math.PI / 2;
    frustum.rotation.z = Math.PI / 4;
    frustum.position.z = 0.8;
    dolly.add(body, lens, frustum);
    dolly.traverse((child) => child.layers.set(INSET_LAYER));
    scene.add(dolly);

    const railCamera = new PerspectiveCamera(55, 16 / 9, 0.05, 80);
    const insetFrame = document.createElement("div");
    insetFrame.className = "keyword-stage-inset";
    insetFrame.textContent = "レール上のカメラ";
    context.overlay(insetFrame);

    context.setRender(() => {
      const { x: width, y: height } = context.size;
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);
      renderer.render(scene, camera);
      if (params["inset"] !== true) {
        return;
      }
      const insetWidth = Math.round(width * 0.3);
      const insetHeight = Math.round((insetWidth * 9) / 16);
      const x = width - insetWidth - 12;
      const y = height - insetHeight - 12;
      railCamera.aspect = insetWidth / insetHeight;
      railCamera.updateProjectionMatrix();
      renderer.setScissorTest(true);
      renderer.setScissor(x, y, insetWidth, insetHeight);
      renderer.setViewport(x, y, insetWidth, insetHeight);
      renderer.render(scene, railCamera);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);
    });

    const position = new Vector3();
    const tangent = new Vector3();
    const focus = new Vector3(0, 0.8, 0);
    let progress = 0;

    return {
      update({ dt }) {
        const { type } = params;
        curve.curveType =
          type === "catmullrom" || type === "chordal" ? type : "centripetal";
        progress = (progress + dt / Number(params["speed"])) % 1;
        const points = curve.getSpacedPoints(SAMPLES);
        rail.setPoints(points);
        railShadow.setPoints(
          points.map((point) => new Vector3(point.x, 0.02, point.z))
        );
        curve.getPointAt(progress, position);
        curve.getTangentAt(progress, tangent);
        dolly.position.copy(position);
        railCamera.position.copy(position);
        if (params["look"] === "center") {
          dolly.lookAt(focus);
          railCamera.lookAt(focus);
        } else {
          dolly.lookAt(position.clone().add(tangent));
          railCamera.lookAt(position.clone().add(tangent));
        }
        insetFrame.hidden = params["inset"] !== true;
        context.readout("通過点", `${waypoints.length} 個（ループ）`);
        context.readout("曲線の長さ", `${curve.getLength().toFixed(1)} m`);
        context.caption(
          "カトマル・ロム曲線は、前後の通過点から各点での接線を自動で決める。通過点を並べるだけで、すべてを通る滑らかなカメラ経路になる。"
        );
      },
      dispose() {
        camera.layers.disable(INSET_LAYER);
      },
    };
  },
};
