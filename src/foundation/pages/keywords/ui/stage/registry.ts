import type { DemoModule } from "./types";

type Loader = () => Promise<{ demo: DemoModule }>;

/** キーワードごとのデモを必要になったときだけ読み込む。 */
const loaders: Record<string, Loader> = {
  "animation/additive-animation": async () =>
    await import("./demos/animation/additive-animation"),
  "animation/foot-ik": async () => await import("./demos/animation/foot-ik"),
  "animation/forward-and-backward-reaching-ik": async () =>
    await import("./demos/animation/forward-and-backward-reaching-ik"),
  "animation/full-body-ik": async () =>
    await import("./demos/animation/full-body-ik"),
  "animation/inertialization": async () =>
    await import("./demos/animation/inertialization"),
  "animation/motion-matching": async () =>
    await import("./demos/animation/motion-matching"),
  "animation/motion-warping": async () =>
    await import("./demos/animation/motion-warping"),
  "animation/root-motion": async () =>
    await import("./demos/animation/root-motion"),
  "animation/two-bone": async () => await import("./demos/animation/two-bone"),
  "animation/vertex-animation-textures": async () =>
    await import("./demos/animation/vertex-animation-textures"),
  "camera/camera-confiner": async () =>
    await import("./demos/camera/camera-confiner"),
  "camera/camera-dead-zone": async () =>
    await import("./demos/camera/camera-dead-zone"),
  "camera/camera-lookahead": async () =>
    await import("./demos/camera/camera-lookahead"),
  "camera/corner-correction": async () =>
    await import("./demos/camera/corner-correction"),
  "camera/coyote-time": async () => await import("./demos/camera/coyote-time"),
  "camera/impulse-camera-shake": async () =>
    await import("./demos/camera/impulse-camera-shake"),
  "camera/input": async () => await import("./demos/camera/input"),
  "camera/jump-apex-hang-time": async () =>
    await import("./demos/camera/jump-apex-hang-time"),
  "camera/parallax-scrolling": async () =>
    await import("./demos/camera/parallax-scrolling"),
  "camera/spline-dolly": async () =>
    await import("./demos/camera/spline-dolly"),
  "collision/axis-aligned-bounding-box": async () =>
    await import("./demos/collision/axis-aligned-bounding-box"),
  "collision/bounding-volume-hierarchy": async () =>
    await import("./demos/collision/bounding-volume-hierarchy"),
  "collision/broad-phase": async () =>
    await import("./demos/collision/broad-phase"),
  "collision/continuous-collision-detection": async () =>
    await import("./demos/collision/continuous-collision-detection"),
  "collision/gilbert-johnson-keerthi-algorithm": async () =>
    await import("./demos/collision/gilbert-johnson-keerthi-algorithm"),
  "collision/morton-code": async () =>
    await import("./demos/collision/morton-code"),
  "collision/ray-casting": async () =>
    await import("./demos/collision/ray-casting"),
  "collision/separating-axis-theorem": async () =>
    await import("./demos/collision/separating-axis-theorem"),
  "collision/spatial-hashing": async () =>
    await import("./demos/collision/spatial-hashing"),
  "collision/sweep-and-prune": async () =>
    await import("./demos/collision/sweep-and-prune"),
  "curves/arc-length-parameterization": async () =>
    await import("./demos/curves/arc-length-parameterization"),
  "curves/b-spline": async () => await import("./demos/curves/b-spline"),
  "curves/be-zier-curve": async () =>
    await import("./demos/curves/be-zier-curve"),
  "curves/catmull-rom-spline": async () =>
    await import("./demos/curves/catmull-rom-spline"),
  "curves/cubic-hermite-curve": async () =>
    await import("./demos/curves/cubic-hermite-curve"),
  "curves/easing": async () => await import("./demos/curves/easing"),
  "curves/lerp": async () => await import("./demos/curves/lerp"),
  "curves/non-uniform-rational-b-spline": async () =>
    await import("./demos/curves/non-uniform-rational-b-spline"),
  "curves/slerp": async () => await import("./demos/curves/slerp"),
  "curves/smoothstep": async () => await import("./demos/curves/smoothstep"),
  "fields/constructive-solid-geometry": async () =>
    await import("./demos/fields/constructive-solid-geometry"),
  "fields/domain-deformation": async () =>
    await import("./demos/fields/domain-deformation"),
  "fields/domain-repetition": async () =>
    await import("./demos/fields/domain-repetition"),
  "fields/jump-flooding-algorithm": async () =>
    await import("./demos/fields/jump-flooding-algorithm"),
  "fields/metaballs": async () => await import("./demos/fields/metaballs"),
  "fields/multi-channel-signed-distance-field": async () =>
    await import("./demos/fields/multi-channel-signed-distance-field"),
  "fields/sdf-gradient": async () =>
    await import("./demos/fields/sdf-gradient"),
  "fields/signed-distance-field": async () =>
    await import("./demos/fields/signed-distance-field"),
  "fields/smooth-union": async () =>
    await import("./demos/fields/smooth-union"),
  "fields/sphere-tracing": async () =>
    await import("./demos/fields/sphere-tracing"),
  "fluids/affine-particle-in-cell": async () =>
    await import("./demos/fluids/affine-particle-in-cell"),
  "fluids/material-point-method": async () =>
    await import("./demos/fluids/material-point-method"),
  "fluids/particle-in-cell": async () =>
    await import("./demos/fluids/particle-in-cell"),
  "fluids/position-based-fluids": async () =>
    await import("./demos/fluids/position-based-fluids"),
  "fluids/pressure-projection": async () =>
    await import("./demos/fluids/pressure-projection"),
  "fluids/reaction-diffusion": async () =>
    await import("./demos/fluids/reaction-diffusion"),
  "fluids/semi-lagrangian-advection": async () =>
    await import("./demos/fluids/semi-lagrangian-advection"),
  "fluids/smoothed-particle-hydrodynamics": async () =>
    await import("./demos/fluids/smoothed-particle-hydrodynamics"),
  "fluids/stable-fluids": async () =>
    await import("./demos/fluids/stable-fluids"),
  "fluids/vorticity-confinement": async () =>
    await import("./demos/fluids/vorticity-confinement"),
  "generation/binary-space-partitioning": async () =>
    await import("./demos/generation/binary-space-partitioning"),
  "generation/biome-map": async () =>
    await import("./demos/generation/biome-map"),
  "generation/cellular-automata": async () =>
    await import("./demos/generation/cellular-automata"),
  "generation/density-masked-scattering": async () =>
    await import("./demos/generation/density-masked-scattering"),
  "generation/island-falloff": async () =>
    await import("./demos/generation/island-falloff"),
  "generation/l-system": async () =>
    await import("./demos/generation/l-system"),
  "generation/point-relaxation": async () =>
    await import("./demos/generation/point-relaxation"),
  "generation/space-colonization-algorithm": async () =>
    await import("./demos/generation/space-colonization-algorithm"),
  "generation/wang-tiles": async () =>
    await import("./demos/generation/wang-tiles"),
  "generation/wave-function-collapse": async () =>
    await import("./demos/generation/wave-function-collapse"),
  "lighting/anisotropic-reflection": async () =>
    await import("./demos/lighting/anisotropic-reflection"),
  "lighting/clear-coat": async () =>
    await import("./demos/lighting/clear-coat"),
  "lighting/fresnel": async () => await import("./demos/lighting/fresnel"),
  "lighting/ggx": async () => await import("./demos/lighting/ggx"),
  "lighting/image-based-lighting": async () =>
    await import("./demos/lighting/image-based-lighting"),
  "lighting/normal-mapping": async () =>
    await import("./demos/lighting/normal-mapping"),
  "lighting/physically-based-rendering": async () =>
    await import("./demos/lighting/physically-based-rendering"),
  "lighting/rim-lighting": async () =>
    await import("./demos/lighting/rim-lighting"),
  "lighting/subsurface-scattering": async () =>
    await import("./demos/lighting/subsurface-scattering"),
  "lighting/toon": async () => await import("./demos/lighting/toon"),
  "materials/channel-packing": async () =>
    await import("./demos/materials/channel-packing"),
  "materials/dissolve": async () => await import("./demos/materials/dissolve"),
  "materials/flow-map": async () => await import("./demos/materials/flow-map"),
  "materials/parallax-mapping": async () =>
    await import("./demos/materials/parallax-mapping"),
  "materials/polar-coordinates": async () =>
    await import("./demos/materials/polar-coordinates"),
  "materials/screen-space-distortion": async () =>
    await import("./demos/materials/screen-space-distortion"),
  "materials/texture-bombing": async () =>
    await import("./demos/materials/texture-bombing"),
  "materials/triplanar": async () =>
    await import("./demos/materials/triplanar"),
  "materials/uv-scrolling": async () =>
    await import("./demos/materials/uv-scrolling"),
  "materials/vertex-displacement": async () =>
    await import("./demos/materials/vertex-displacement"),
  "mesh/as-rigid-as-possible-deformation": async () =>
    await import("./demos/mesh/as-rigid-as-possible-deformation"),
  "mesh/delaunay-triangulation": async () =>
    await import("./demos/mesh/delaunay-triangulation"),
  "mesh/dual-quaternion-skinning": async () =>
    await import("./demos/mesh/dual-quaternion-skinning"),
  "mesh/laplacian-smoothing": async () =>
    await import("./demos/mesh/laplacian-smoothing"),
  "mesh/marching-cubes": async () =>
    await import("./demos/mesh/marching-cubes"),
  "mesh/marching-squares": async () =>
    await import("./demos/mesh/marching-squares"),
  "mesh/mesh-decimation": async () =>
    await import("./demos/mesh/mesh-decimation"),
  "mesh/subdivision-surface": async () =>
    await import("./demos/mesh/subdivision-surface"),
  "mesh/sweep": async () => await import("./demos/mesh/sweep"),
  "mesh/voronoi-fracture": async () =>
    await import("./demos/mesh/voronoi-fracture"),
  "motion/boids": async () => await import("./demos/motion/boids"),
  "motion/critical-damping": async () =>
    await import("./demos/motion/critical-damping"),
  "motion/exponential-damping": async () =>
    await import("./demos/motion/exponential-damping"),
  "motion/flow-field-following": async () =>
    await import("./demos/motion/flow-field-following"),
  "motion/obstacle-avoidance-steering": async () =>
    await import("./demos/motion/obstacle-avoidance-steering"),
  "motion/pd": async () => await import("./demos/motion/pd"),
  "motion/pursuit": async () => await import("./demos/motion/pursuit"),
  "motion/seek": async () => await import("./demos/motion/seek"),
  "motion/spring-damper": async () =>
    await import("./demos/motion/spring-damper"),
  "motion/wander-steering": async () =>
    await import("./demos/motion/wander-steering"),
  "nature/buoyancy": async () => await import("./demos/nature/buoyancy"),
  "nature/caustics": async () => await import("./demos/nature/caustics"),
  "nature/fft-ocean": async () => await import("./demos/nature/fft-ocean"),
  "nature/gerstner-waves": async () =>
    await import("./demos/nature/gerstner-waves"),
  "nature/height-field-wave-simulation": async () =>
    await import("./demos/nature/height-field-wave-simulation"),
  "nature/hydraulic-erosion": async () =>
    await import("./demos/nature/hydraulic-erosion"),
  "nature/procedural-wind-animation": async () =>
    await import("./demos/nature/procedural-wind-animation"),
  "nature/shallow-water-equations": async () =>
    await import("./demos/nature/shallow-water-equations"),
  "nature/thermal-erosion": async () =>
    await import("./demos/nature/thermal-erosion"),
  "nature/whitewater": async () => await import("./demos/nature/whitewater"),
  "navigation/a-search": async () =>
    await import("./demos/navigation/a-search"),
  "navigation/behavior-tree": async () =>
    await import("./demos/navigation/behavior-tree"),
  "navigation/blackboard-architecture": async () =>
    await import("./demos/navigation/blackboard-architecture"),
  "navigation/dijkstra-s-algorithm": async () =>
    await import("./demos/navigation/dijkstra-s-algorithm"),
  "navigation/environment-query": async () =>
    await import("./demos/navigation/environment-query"),
  "navigation/finite-state-machine": async () =>
    await import("./demos/navigation/finite-state-machine"),
  "navigation/funnel-algorithm": async () =>
    await import("./demos/navigation/funnel-algorithm"),
  "navigation/goal-oriented-action-planning": async () =>
    await import("./demos/navigation/goal-oriented-action-planning"),
  "navigation/navigation-mesh": async () =>
    await import("./demos/navigation/navigation-mesh"),
  "navigation/optimal-reciprocal-collision-avoidance": async () =>
    await import("./demos/navigation/optimal-reciprocal-collision-avoidance"),
  "noise/curl-noise": async () => await import("./demos/noise/curl-noise"),
  "noise/domain-warping": async () =>
    await import("./demos/noise/domain-warping"),
  "noise/fractal-brownian-motion": async () =>
    await import("./demos/noise/fractal-brownian-motion"),
  "noise/periodic": async () => await import("./demos/noise/periodic"),
  "noise/perlin": async () => await import("./demos/noise/perlin"),
  "noise/ridged-multifractal-noise": async () =>
    await import("./demos/noise/ridged-multifractal-noise"),
  "noise/simplex-noise": async () =>
    await import("./demos/noise/simplex-noise"),
  "noise/turbulence-noise": async () =>
    await import("./demos/noise/turbulence-noise"),
  "noise/value-noise": async () => await import("./demos/noise/value-noise"),
  "noise/worley": async () => await import("./demos/noise/worley"),
  "particles/billboard": async () =>
    await import("./demos/particles/billboard"),
  "particles/flipbook": async () => await import("./demos/particles/flipbook"),
  "particles/mesh-particles": async () =>
    await import("./demos/particles/mesh-particles"),
  "particles/ribbon": async () => await import("./demos/particles/ribbon"),
  "particles/size": async () => await import("./demos/particles/size"),
  "particles/soft-particles": async () =>
    await import("./demos/particles/soft-particles"),
  "particles/stretched-billboard": async () =>
    await import("./demos/particles/stretched-billboard"),
  "particles/sub-emitters": async () =>
    await import("./demos/particles/sub-emitters"),
  "particles/surface": async () => await import("./demos/particles/surface"),
  "particles/velocity-alignment": async () =>
    await import("./demos/particles/velocity-alignment"),
  "performance/compute-shader": async () =>
    await import("./demos/performance/compute-shader"),
  "performance/frustum": async () =>
    await import("./demos/performance/frustum"),
  "performance/gpu-instancing": async () =>
    await import("./demos/performance/gpu-instancing"),
  "performance/indirect-drawing": async () =>
    await import("./demos/performance/indirect-drawing"),
  "performance/level-of-detail": async () =>
    await import("./demos/performance/level-of-detail"),
  "performance/object-pool": async () =>
    await import("./demos/performance/object-pool"),
  "performance/overdraw": async () =>
    await import("./demos/performance/overdraw"),
  "performance/parallel-prefix-sum": async () =>
    await import("./demos/performance/parallel-prefix-sum"),
  "performance/ping-pong-buffers": async () =>
    await import("./demos/performance/ping-pong-buffers"),
  "performance/structure-of-arrays": async () =>
    await import("./demos/performance/structure-of-arrays"),
  "physics/extended-pbd": async () =>
    await import("./demos/physics/extended-pbd"),
  "physics/fixed-timestep": async () =>
    await import("./demos/physics/fixed-timestep"),
  "physics/friction": async () => await import("./demos/physics/friction"),
  "physics/joints": async () => await import("./demos/physics/joints"),
  "physics/mass-spring-system": async () =>
    await import("./demos/physics/mass-spring-system"),
  "physics/position-based-dynamics": async () =>
    await import("./demos/physics/position-based-dynamics"),
  "physics/runge-kutta": async () =>
    await import("./demos/physics/runge-kutta"),
  "physics/semi-implicit-euler": async () =>
    await import("./demos/physics/semi-implicit-euler"),
  "physics/shape-matching": async () =>
    await import("./demos/physics/shape-matching"),
  "physics/verlet-integration": async () =>
    await import("./demos/physics/verlet-integration"),
  "post/bloom": async () => await import("./demos/post/bloom"),
  "post/chromatic-aberration": async () =>
    await import("./demos/post/chromatic-aberration"),
  "post/color-grading": async () => await import("./demos/post/color-grading"),
  "post/depth-of-field": async () =>
    await import("./demos/post/depth-of-field"),
  "post/depth": async () => await import("./demos/post/depth"),
  "post/motion-blur": async () => await import("./demos/post/motion-blur"),
  "post/screen-space-reflections": async () =>
    await import("./demos/post/screen-space-reflections"),
  "post/ssao": async () => await import("./demos/post/ssao"),
  "post/temporal-anti-aliasing": async () =>
    await import("./demos/post/temporal-anti-aliasing"),
  "post/tone-mapping": async () => await import("./demos/post/tone-mapping"),
  "sampling/alias-method": async () =>
    await import("./demos/sampling/alias-method"),
  "sampling/blue-noise": async () =>
    await import("./demos/sampling/blue-noise"),
  "sampling/cosine-weighted-hemisphere-sampling": async () =>
    await import("./demos/sampling/cosine-weighted-hemisphere-sampling"),
  "sampling/gaussian": async () => await import("./demos/sampling/gaussian"),
  "sampling/importance-sampling": async () =>
    await import("./demos/sampling/importance-sampling"),
  "sampling/low-discrepancy-sequence": async () =>
    await import("./demos/sampling/low-discrepancy-sequence"),
  "sampling/poisson-disk-sampling": async () =>
    await import("./demos/sampling/poisson-disk-sampling"),
  "sampling/stratified": async () =>
    await import("./demos/sampling/stratified"),
  "sampling/uniform-disk": async () =>
    await import("./demos/sampling/uniform-disk"),
  "sampling/uniform-sphere-sampling": async () =>
    await import("./demos/sampling/uniform-sphere-sampling"),
  "volume/aerial-perspective": async () =>
    await import("./demos/volume/aerial-perspective"),
  "volume/beer-lambert-law": async () =>
    await import("./demos/volume/beer-lambert-law"),
  "volume/god-rays": async () => await import("./demos/volume/god-rays"),
  "volume/henyey-greenstein-phase-function": async () =>
    await import("./demos/volume/henyey-greenstein-phase-function"),
  "volume/mie-scattering": async () =>
    await import("./demos/volume/mie-scattering"),
  "volume/premultiplied-alpha": async () =>
    await import("./demos/volume/premultiplied-alpha"),
  "volume/rayleigh-scattering": async () =>
    await import("./demos/volume/rayleigh-scattering"),
  "volume/volume-ray-marching": async () =>
    await import("./demos/volume/volume-ray-marching"),
  "volume/volumetric-fog": async () =>
    await import("./demos/volume/volumetric-fog"),
  "volume/weighted-blended-order-independent-transparency": async () =>
    await import("./demos/volume/weighted-blended-order-independent-transparency"),
};

export const hasDemo = (key: string) => Object.hasOwn(loaders, key);

export async function loadDemo(key: string) {
  const loader = loaders[key];
  if (!loader) {
    return;
  }
  const loaded = await loader();
  return loaded.demo;
}
