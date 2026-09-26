import { InstancedMesh, Matrix4, SphereGeometry, Vector3 } from "three";
import { palette, standard, trail } from "../../kit";
import type { DemoModule } from "../../types";
import {
  gerstnerPoint,
  MAX_WAVES,
  oceanSurface,
  waveSet,
  waveUniforms,
} from "../../waves";

const TRACERS = 24;

export const demo: DemoModule = {
  alt: "海の波を、頂点を上下だけでなく前後にも動かすゲルストナー波で描くデモ。水面の各点は円を描くように回り、波の山では前へ集まって尖り、谷では広がって平らになる。上下に動かすだけの正弦波と比べると、波の形の違いがよく分かる。水面に並べた光る点は、同じ水の粒の動き（円軌道）を示している。",
  camera: { position: [9, 4.5, 11], target: [0, 0, 0] },
  studio: { floor: false, background: "#0b1a2a" },
  bloom: { strength: 0.5, radius: 0.4, threshold: 0.85 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "波の動かし方",
      value: "gerstner",
      options: [
        { value: "sine", label: "正弦波（上下だけ）" },
        { value: "gerstner", label: "ゲルストナー波（円運動）" },
      ],
    },
    {
      type: "range",
      key: "steepness",
      label: "尖り具合 Q",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.75,
      hint: "1 に近いほど波頭が尖ります。1 を超えると水面が裏返って輪になります。",
    },
    {
      type: "range",
      key: "count",
      label: "重ねる波の数",
      min: 1,
      max: MAX_WAVES,
      step: 1,
      value: 8,
    },
    {
      type: "range",
      key: "height",
      label: "波の高さ",
      min: 0.2,
      max: 2.5,
      step: 0.05,
      value: 1.2,
    },
    {
      type: "toggle",
      key: "tracers",
      label: "水の粒の軌道を表示",
      value: true,
    },
  ],
  legend: [{ color: palette.amber, label: "水の粒（元の位置は同じ）" }],
  setup(context) {
    const { scene, params } = context;
    const state = waveUniforms(
      waveSet({ seed: 7, wavelength: 9, amplitude: 0.45, spread: 0.7 })
    );
    const ocean = oceanSurface(state, { size: 60, segments: 320 });
    scene.add(ocean);
    const tracers = new InstancedMesh(
      new SphereGeometry(0.09, 16, 12),
      standard(palette.amber, { emissive: 1.5 }),
      TRACERS
    );
    scene.add(tracers);
    const path = trail(90, palette.amber, { width: 2.5 });
    scene.add(path);
    const matrix = new Matrix4();
    let time = 0;

    return {
      update({ dt }) {
        time += dt;
        state.uTime.value = time;
        state.uGerstner.value = params["mode"] === "gerstner" ? 1 : 0;
        state.uSteepness.value = Number(params["steepness"]);
        state.uWaveCount.value = Number(params["count"]);
        state.uAmplitudeScale.value = Number(params["height"]);
        const show = params["tracers"] === true;
        tracers.visible = show;
        path.visible = show;
        // 一直線に並べた水の粒が、波に合わせてどう動くか
        for (let index = 0; index < TRACERS; index++) {
          const point = gerstnerPoint(state, -6 + index * 0.5, 2);
          matrix.makeTranslation(point.x, point.y + 0.05, point.z);
          tracers.setMatrixAt(index, matrix);
          if (index === 12 && show) {
            path.push(new Vector3(point.x, point.y + 0.05, point.z));
          }
        }
        tracers.instanceMatrix.needsUpdate = true;
        context.readout("重ねた波", `${state.uWaveCount.value} 本`);
        context.caption(
          params["mode"] === "gerstner"
            ? "水の粒は、波が通るたびに円を描いて元の位置に戻る。山では粒が前へ寄り集まって尖り、谷では離れて平らになるので、本物の海のような鋭い波頭ができる。"
            : "正弦波は頂点を上下に動かすだけなので、山も谷も同じ丸い形になり、波頭が尖らない。"
        );
      },
    };
  },
};
