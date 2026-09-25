import type { DemoFamily } from "../../model/demo-presets";
import { background } from "./drawing";
import type { Renderer, Scene } from "./drawing";
import { drawCurves, drawMotion, drawParticles } from "./motion";
import {
  drawAnimation,
  drawCamera,
  drawFluids,
  drawNature,
  drawPhysics,
} from "./simulation";
import {
  drawFields,
  drawLighting,
  drawMaterials,
  drawNoise,
  drawPost,
  drawVolume,
} from "./surfaces";
import {
  drawCollision,
  drawData,
  drawNavigation,
  drawPerformance,
} from "./systems";
import { drawGeneration, drawMesh, drawSampling } from "./world";

const renderers: Record<DemoFamily, Renderer> = {
  noise: drawNoise,
  curves: drawCurves,
  motion: drawMotion,
  particles: drawParticles,
  materials: drawMaterials,
  fields: drawFields,
  mesh: drawMesh,
  lighting: drawLighting,
  volume: drawVolume,
  post: drawPost,
  nature: drawNature,
  physics: drawPhysics,
  fluids: drawFluids,
  animation: drawAnimation,
  generation: drawGeneration,
  sampling: drawSampling,
  navigation: drawNavigation,
  collision: drawCollision,
  camera: drawCamera,
  performance: drawPerformance,
  dotnet: drawData,
};

export function renderDemo(family: DemoFamily, scene: Scene) {
  scene.ctx.save();
  background(scene);
  renderers[family](scene);
  scene.ctx.restore();
}
