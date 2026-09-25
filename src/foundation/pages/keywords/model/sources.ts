/** 各分野の理解を深めるための代表的な一次資料。 */
export const keywordSources: Record<string, { title: string; url: string }> = {
  noise: {
    title: "Curl-Noise for Procedural Fluid Flow",
    url: "https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf",
  },
  curves: {
    title: "The Book of Shaders — Shaping Functions",
    url: "https://thebookofshaders.com/05/",
  },
  motion: {
    title: "Spring-It-On",
    url: "https://theorangeduck.com/page/spring-roll-call",
  },
  particles: {
    title: "Unity Particle System Renderer",
    url: "https://docs.unity3d.com/Manual/PartSysRendererModule.html",
  },
  materials: {
    title: "Unreal Engine Material Coordinates",
    url: "https://dev.epicgames.com/documentation/en-us/unreal-engine/coordinates-material-expressions-in-unreal-engine",
  },
  fields: {
    title: "Unreal Engine Mesh Distance Fields",
    url: "https://dev.epicgames.com/documentation/en-us/unreal-engine/mesh-distance-fields-in-unreal-engine",
  },
  mesh: { title: "libigl Tutorial", url: "https://libigl.github.io/tutorial/" },
  lighting: {
    title: "Filament Material System",
    url: "https://google.github.io/filament/main/filament.html",
  },
  volume: {
    title: "Unreal Engine Sky Atmosphere",
    url: "https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine",
  },
  post: {
    title: "Unreal Engine Post Process Effects",
    url: "https://dev.epicgames.com/documentation/en-us/unreal-engine/post-process-effects-in-unreal-engine",
  },
  nature: {
    title: "GPU Gems — Effective Water Simulation",
    url: "https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models",
  },
  physics: {
    title: "Gaffer On Games — Integration Basics",
    url: "https://gafferongames.com/post/integration_basics/",
  },
  fluids: {
    title: "GPU Gems — Fast Fluid Dynamics Simulation on the GPU",
    url: "https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu",
  },
  animation: {
    title: "Unreal Engine IK Rig Solvers",
    url: "https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-solvers-in-unreal-engine",
  },
  generation: {
    title: "WaveFunctionCollapse",
    url: "https://github.com/mxgmn/WaveFunctionCollapse",
  },
  sampling: {
    title: "Fast Poisson Disk Sampling in Arbitrary Dimensions",
    url: "https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf",
  },
  navigation: {
    title: "Red Blob Games — A* Introduction",
    url: "https://www.redblobgames.com/pathfinding/a-star/introduction.html",
  },
  collision: {
    title: "Box2D Collision",
    url: "https://box2d.org/documentation/md_collision.html",
  },
  camera: {
    title: "Unity Cinemachine Position Composer",
    url: "https://docs.unity3d.com/Packages/com.unity.cinemachine%403.1/manual/CinemachinePositionComposer.html",
  },
  performance: {
    title: "Unity ComputeShader",
    url: "https://docs.unity3d.com/ScriptReference/ComputeShader.html",
  },
};

/** 分野資料より詳しい一次資料がある項目に適用する。 */
export const keywordSpecificSources: Record<
  string,
  { title: string; url: string }
> = {
  "plain-old-clr-object": {
    title: "Microsoft Learn — .NET Glossary",
    url: "https://learn.microsoft.com/en-us/dotnet/standard/glossary#poco",
  },
  "curl-noise": {
    title: "Bridson et al. — Curl-Noise for Procedural Fluid Flow",
    url: "https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf",
  },
  "cubic-hermite-curve": {
    title: "Autodesk — Hermite Curve",
    url: "https://help.autodesk.com/cloudhelp/JPN/MayaCRE-Tech-Docs/Commands/hermite.html",
  },
  "critical-damping": {
    title: "The Orange Duck — Spring-It-On",
    url: "https://theorangeduck.com/page/spring-roll-call",
  },
  "sphere-tracing": {
    title: "Hart — Sphere Tracing",
    url: "https://experts.illinois.edu/en/publications/sphere-tracing-a-geometric-method-for-the-antialiased-ray-tracing/",
  },
  "physically-based-rendering": {
    title: "Physically Based Rendering — Surface Reflection",
    url: "https://pbr-book.org/4ed/Radiometry,_Spectra,_and_Color/Surface_Reflection",
  },
  "extended-pbd": {
    title: "Macklin et al. — XPBD",
    url: "https://matthias-research.github.io/pages/publications/XPBD.pdf",
  },
  "position-based-fluids": {
    title: "Macklin and Müller — Position Based Fluids",
    url: "https://matthias-research.github.io/pages/publications/pbf_sig_preprint.pdf",
  },
  "reaction-diffusion": {
    title: "Karl Sims — Reaction-Diffusion Tutorial",
    url: "https://www.karlsims.com/rd.html",
  },
  "wave-function-collapse": {
    title: "mxgmn — WaveFunctionCollapse",
    url: "https://github.com/mxgmn/WaveFunctionCollapse",
  },
  "blue-noise": {
    title: "NVIDIA — Spatiotemporal Blue Noise",
    url: "https://developer.nvidia.com/blog/rendering-in-real-time-with-spatiotemporal-blue-noise-textures-part-1/",
  },
  "importance-sampling": {
    title: "Physically Based Rendering — Importance Sampling",
    url: "https://pbr-book.org/4ed/Monte_Carlo_Integration/Improving_Efficiency",
  },
  "weighted-blended-order-independent-transparency": {
    title: "McGuire — Weighted Blended OIT",
    url: "https://casual-effects.blogspot.com/2015/03/implemented-weighted-blended-order.html",
  },
};
