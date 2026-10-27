import {
  CatmullRomCurve3,
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  Shape,
  TubeGeometry,
  Vector3,
} from "three";
import type { Material, Camera } from "three";
import { applySurfaceFinish } from "./surface-finish";
import { hd800sPerforatedGrille } from "./hd-800s-grille";
import { createModelParts } from "./parts";
import type { Position } from "./parts";
import {
  earPadGeometry,
  cupOutline,
  microfiberPileGeometry,
  distantGrilleGeometry,
} from "./hd-800s-geometry";
import { createHd800sTextures } from "./hd-800s-textures";
import { createDetailLevels } from "./detail-levels";

function ellipticalOutline(width: number, height: number) {
  const shape = new Shape();
  shape.absellipse(0, 0, width / 2, height / 2, 0, Math.PI * 2, false, 0);
  return shape;
}

export function createHd800sParts() {
  const parts = createModelParts();
  const textures = createHd800sTextures();
  for (const texture of Object.values(textures.metal)) {
    texture.center.set(0.5, 0.5);
    texture.rotation = Math.PI / 4;
  }
  const padGeometry = earPadGeometry();
  const grilleGeometry = distantGrilleGeometry();
  const detail = createDetailLevels();
  let detailedGrille: BufferGeometry | undefined;
  let detailedPile: BufferGeometry | undefined;
  const matte = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x18_1a_1c,
      roughness: 0.68,
      metalness: 0.05,
      specularIntensity: 0.65,
    }),
    { scale: [9, 9, 9], relief: 0.004, roughness: 0.06 }
  );
  const trim = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x20_22_26,
      roughness: 0.66,
      metalness: 0.18,
    }),
    { scale: [12, 12, 12], relief: 0.003, roughness: 0.045 }
  );
  const microfiber = new MeshPhysicalMaterial({
    color: 0x29_29_2b,
    map: textures.fabric.color,
    roughness: 0.95,
    roughnessMap: textures.fabric.roughness,
    bumpMap: textures.fabric.height,
    bumpScale: 0.18,
    sheen: 0.85,
    sheenColor: 0x4b_4b_4d,
    sheenRoughness: 0.92,
    specularIntensity: 0.06,
  });
  const pile = new MeshPhysicalMaterial({
    color: 0x25_25_28,
    roughness: 1,
    sheen: 0.85,
    sheenColor: 0x57_57_5a,
    sheenRoughness: 1,
    specularIntensity: 0,
    side: DoubleSide,
  });
  const thread = new MeshPhysicalMaterial({
    color: 0x27_28_2b,
    roughness: 0.95,
    sheen: 0.4,
    sheenColor: 0x49_49_4c,
    specularIntensity: 0.12,
  });
  const acoustic = new MeshStandardMaterial({
    color: 0x16_18_1a,
    alphaMap: textures.cloth,
    alphaTest: 0.03,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    roughness: 0.93,
    side: DoubleSide,
  });
  const grilleMetal = new MeshPhysicalMaterial({
    color: 0x27_29_2c,
    metalness: 0.82,
    roughness: 0.3,
    side: DoubleSide,
  });
  const distantGrilleMetal = grilleMetal.clone();
  distantGrilleMetal.alphaMap = textures.grille;
  distantGrilleMetal.alphaTest = 0.35;
  distantGrilleMetal.alphaToCoverage = true;
  const driver = new MeshPhysicalMaterial({
    color: 0x80_83_88,
    metalness: 0.86,
    roughness: 0.36,
    roughnessMap: textures.metal.roughness,
    anisotropy: 0.5,
    side: DoubleSide,
  });
  const silver = new MeshPhysicalMaterial({
    color: 0x9f_a3_a8,
    alphaMap: textures.mesh.mask,
    alphaTest: 0.2,
    alphaToCoverage: true,
    metalness: 0.88,
    roughness: 0.44,
    anisotropy: 0.2,
    bumpMap: textures.mesh.height,
    bumpScale: 0.035,
    side: DoubleSide,
  });

  const plate = (
    outline: Shape,
    depth: number,
    position: Position,
    material: Material,
    name: string,
    bevel = 0.5
  ) => {
    const geometry = new ExtrudeGeometry(outline, {
      depth,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 6,
      curveSegments: 96,
    });
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    if (bounds) {
      const positions = geometry.getAttribute("position");
      const uvs = geometry.getAttribute("uv");
      for (let index = 0; index < positions.count; index += 1) {
        uvs.setXY(
          index,
          (positions.getX(index) - bounds.min.x) /
            (bounds.max.x - bounds.min.x),
          (positions.getY(index) - bounds.min.y) / (bounds.max.y - bounds.min.y)
        );
      }
    }
    return parts.mesh(geometry, material, position, name);
  };

  const ovalRing = (
    outer: readonly [number, number],
    inner: readonly [number, number],
    depth: number,
    position: Position,
    material: Material,
    name: string,
    bevel = 0.5
  ) => {
    const shape = ellipticalOutline(...outer);
    const hole = new Path();
    hole.absellipse(0, 0, inner[0] / 2, inner[1] / 2, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
    return plate(shape, depth, position, material, name, bevel);
  };

  const piping = (
    points: Vector3[],
    radius: number,
    material: Material,
    name: string
  ) =>
    parts.mesh(
      new TubeGeometry(
        new CatmullRomCurve3(points, true),
        192,
        radius,
        8,
        true
      ),
      material,
      [0, 0, 0],
      name
    );

  const housingRing = (
    outerInset: number,
    innerInset: number,
    depth: number,
    z: number,
    material: Material,
    name: string,
    bevel = 0.5
  ) => {
    const shape = cupOutline(outerInset);
    const hole = new Path(cupOutline(innerInset).getPoints());
    shape.holes.push(hole);
    return plate(shape, depth, [0, 0, z], material, name, bevel);
  };

  const surfacePrint = (
    geometry: BufferGeometry,
    width: number,
    height: number,
    position: Position,
    draw: (context: CanvasRenderingContext2D) => void,
    name: string
  ) => {
    const decal = parts.print(width, height, [0, 0, 0], draw, name, 1024);
    decal.removeFromParent();
    return parts.mesh(geometry, decal.material, position, name);
  };

  const cable = (points: readonly Position[], name: string) =>
    parts.mesh(
      new TubeGeometry(
        new CatmullRomCurve3(points.map((point) => new Vector3(...point))),
        64,
        1.5,
        16,
        false
      ),
      parts.rubber,
      [0, 0, 0],
      name
    );

  return {
    ...parts,
    matte,
    trim,
    microfiber,
    thread,
    acoustic,
    grilleMetal,
    driver,
    silver,
    plate,
    ovalRing,
    housingRing,
    piping,
    surfacePrint,
    cable,
    pad: () =>
      parts.mesh(
        padGeometry,
        microfiber,
        [0, 0, 0],
        "Contoured microfiber ear pad"
      ),
    pile: () =>
      detail.add(
        parts.mesh(
          new BufferGeometry(),
          pile,
          [0, 0, 0],
          "Short microfiber pile on the ear-pad surface"
        ),
        {
          radius: 65,
          pixels: 250,
          hideLow: true,
          build: () => (detailedPile ??= microfiberPileGeometry()),
        }
      ),
    grille: () =>
      detail.add(
        parts.mesh(
          grilleGeometry,
          distantGrilleMetal,
          [0, 0, 15.1],
          "Domed metal grille with hexagonally arranged round apertures"
        ),
        {
          radius: 28.5,
          pixels: 96,
          highMaterial: grilleMetal,
          build: () => (detailedGrille ??= hd800sPerforatedGrille()),
        }
      ),
    updateDetail: (camera: Camera, viewportHeight: number) =>
      detail.update(camera, viewportHeight),
    dispose() {
      detail.dispose();
      grilleMetal.dispose();
      parts.dispose();
      textures.dispose();
    },
  };
}

export type Hd800sParts = ReturnType<typeof createHd800sParts>;
