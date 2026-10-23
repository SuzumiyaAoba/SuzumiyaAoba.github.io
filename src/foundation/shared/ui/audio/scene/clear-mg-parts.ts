import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  TubeGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Object3D,
  LatheGeometry,
  Vector2,
  Path,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Material } from "three";
import {
  createClearMgFabricTextures,
  createClearMgPile,
} from "./clear-mg-fabric";
import {
  clearMgBandPerforations,
  clearMgPadPerforations,
  padPoint,
} from "./clear-mg-geometry";
import { createLeatherGrain } from "./leather-grain";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";
import type { Position } from "./parts";

export function clearOval(width: number, height: number) {
  const shape = new Shape();
  shape.absellipse(0, 0, width / 2, height / 2, 0, Math.PI * 2, false, 0);
  return shape;
}

function acousticMeshTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the Clear Mg Professional acoustic mesh.");
  }
  context.fillStyle = "#000000";
  context.fillRect(0, 0, 256, 256);
  context.fillStyle = "#ffffff";
  for (let offset = 0; offset < 256; offset += 4) {
    context.fillRect(offset, 0, 1.1, 256);
    context.fillRect(0, offset, 256, 1.1);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI / 4;
  texture.anisotropy = 8;
  return texture;
}

function createPerforationMask(
  perforations: ReturnType<typeof clearMgPadPerforations>
) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the microfiber perforation mask.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  for (const hole of perforations) {
    for (const wrap of [-1, 0, 1]) {
      context.beginPath();
      context.ellipse(
        (hole.u / (Math.PI * 2) + wrap) * canvas.width,
        (1 - hole.v / (Math.PI * 2)) * canvas.height,
        (hole.radiusU / (Math.PI * 2)) * canvas.width,
        (hole.radiusV / (Math.PI * 2)) * canvas.height,
        0,
        0,
        Math.PI * 2
      );
      context.fill();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

export function createClearMgParts() {
  const parts = createModelParts();
  const fabric = createClearMgFabricTextures();
  const perforationMask = createPerforationMask(clearMgPadPerforations());
  const bandMask = createPerforationMask(clearMgBandPerforations());
  const grain = createLeatherGrain(512, 512, 8);
  grain.repeat.set(8, 2);
  const leatherColor = grain.clone();
  leatherColor.colorSpace = SRGBColorSpace;
  const meshTexture = acousticMeshTexture();
  const coated = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x35_38_3a,
      metalness: 0.55,
      roughness: 0.48,
      specularIntensity: 0.6,
      envMapIntensity: 0.85,
    }),
    { scale: [12, 12, 12], relief: 0.006, roughness: 0.08 }
  );
  const leather = new MeshPhysicalMaterial({
    color: 0x40_42_44,
    map: leatherColor,
    roughness: 0.68,
    specularIntensity: 0.42,
    envMapIntensity: 0.6,
    bumpMap: grain,
    bumpScale: 0.11,
  });
  const microfiber = new MeshPhysicalMaterial({
    color: 0x9e_2f_45,
    roughness: 0.97,
    specularIntensity: 0.15,
    sheen: 0.85,
    sheenColor: 0xb5_57_65,
    sheenRoughness: 0.95,
    map: fabric.color,
    roughnessMap: fabric.roughness,
    bumpMap: fabric.height,
    bumpScale: 0.16,
  });
  const perforatedFabric = microfiber.clone();
  perforatedFabric.alphaMap = perforationMask;
  perforatedFabric.alphaTest = 0.45;
  perforatedFabric.alphaToCoverage = true;
  const bandFabric = perforatedFabric.clone();
  bandFabric.alphaMap = bandMask;
  const pile = new MeshPhysicalMaterial({
    color: 0x97_31_48,
    roughness: 1,
    sheen: 0.8,
    sheenColor: 0xc2_63_74,
    sheenRoughness: 0.95,
    specularIntensity: 0.08,
    side: DoubleSide,
  });
  const pileGeometry = createClearMgPile(padPoint);
  const lining = new MeshStandardMaterial({
    color: 0x35_0b_1d,
    roughness: 0.97,
    bumpMap: fabric.height,
    bumpScale: 0.06,
  });
  const perforation = new MeshBasicMaterial({ color: 0x28_08_14 });
  const perforationWall = new MeshStandardMaterial({
    color: 0x41_10_1a,
    roughness: 1,
  });
  const grille = new MeshStandardMaterial({
    color: 0x5c_5f_61,
    metalness: 0.85,
    roughness: 0.38,
    envMapIntensity: 0.85,
  });
  const polished = new MeshStandardMaterial({
    color: 0xc2_c4_c5,
    metalness: 0.8,
    roughness: 0.29,
  });
  const woven = new MeshStandardMaterial({
    color: 0x2c_2f_31,
    metalness: 0.55,
    roughness: 0.57,
    alphaMap: meshTexture,
    alphaTest: 0.25,
    alphaToCoverage: true,
    side: DoubleSide,
  });
  const magnesium = new MeshStandardMaterial({
    color: 0x52_57_5e,
    metalness: 0.85,
    roughness: 0.62,
    envMapIntensity: 0.5,
    side: DoubleSide,
  });

  const plate = (
    outline: Shape,
    depth: number,
    position: Position,
    material: Material,
    name: string,
    bevel = 0.4
  ) => {
    const geometry = new ExtrudeGeometry(outline, {
      depth,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 5,
      curveSegments: 64,
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
    bevel = 0.4
  ) => {
    const shape = clearOval(...outer);
    const hole = new Path();
    hole.absellipse(0, 0, inner[0] / 2, inner[1] / 2, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
    return plate(shape, depth, position, material, name, bevel);
  };

  return {
    ...parts,
    coated,
    leather,
    microfiber,
    perforatedFabric,
    bandFabric,
    pile: () =>
      parts.mesh(
        pileGeometry,
        pile,
        [0, 0, 0],
        "Short individual red microfiber fibers"
      ),
    lining,
    perforation,
    perforationWall,
    grille,
    polished,
    woven,
    magnesium,
    plate,
    ovalRing,
    dispose() {
      parts.dispose();
      for (const texture of Object.values(fabric)) {
        texture.dispose();
      }
      perforationMask.dispose();
      bandMask.dispose();
      grain.dispose();
      leatherColor.dispose();
      meshTexture.dispose();
    },
  };
}

export type ClearMgParts = ReturnType<typeof createClearMgParts>;

export function createClearFoamCore(
  parts: ClearMgParts,
  surface: BufferGeometry,
  name: string
) {
  const geometry = surface.clone();
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  for (let index = 0; index < positions.count; index += 1) {
    positions.setXYZ(
      index,
      positions.getX(index) - normals.getX(index) * 1.2,
      positions.getY(index) - normals.getY(index) * 1.2,
      positions.getZ(index) - normals.getZ(index) * 1.2
    );
  }
  return parts.mesh(geometry, parts.perforation, [0, 0, 0], name);
}

export function createClearFabricBores(
  parts: ClearMgParts,
  perforations: ReturnType<typeof clearMgPadPerforations>,
  name: string
) {
  const bore = new LatheGeometry(
    [
      new Vector2(0.57, -0.035),
      new Vector2(0.43, -0.08),
      new Vector2(0.33, -0.55),
      new Vector2(0.27, -1.1),
      new Vector2(0, -1.1),
    ],
    16
  );
  bore.rotateX(Math.PI / 2);
  const holes = parts.instanced(
    bore,
    parts.perforationWall,
    perforations.length,
    name
  );
  const placement = new Object3D();
  const normalAxis = new Vector3(0, 0, 1);
  for (const [index, hole] of perforations.entries()) {
    placement.position.copy(hole.position);
    placement.quaternion.setFromUnitVectors(normalAxis, hole.normal);
    placement.updateMatrix();
    holes.setMatrixAt(index, placement.matrix);
  }
  holes.computeBoundingSphere();
  return holes;
}

export function createClearPad(parts: ClearMgParts) {
  const segments = 256;
  const sections = 96;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let segment = 0; segment <= segments; segment += 1) {
    for (let section = 0; section <= sections; section += 1) {
      const point = padPoint(
        (segment / segments) * Math.PI * 2,
        (section / sections) * Math.PI * 2
      );
      const u = (segment / segments) * Math.PI * 2;
      const v = (section / sections) * Math.PI * 2;
      const along = padPoint(u + 0.0001, v).sub(padPoint(u - 0.0001, v));
      const across = padPoint(u, v + 0.0001).sub(padPoint(u, v - 0.0001));
      const normal = new Vector3().crossVectors(along, across).normalize();
      positions.push(point.x, point.y, point.z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(segment / segments, section / sections);
      if (segment < segments && section < sections) {
        const current = segment * (sections + 1) + section;
        const next = current + sections + 1;
        indices.push(current, next, current + 1, next, next + 1, current + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const cushion = parts.mesh(
    geometry,
    parts.perforatedFabric,
    [0, 0, 0],
    "20 mm perforated red microfiber cushion"
  );

  const holes = createClearFabricBores(
    parts,
    clearMgPadPerforations(),
    "Recessed perforation walls and floors beneath the fabric openings"
  );
  const seamPoints = Array.from({ length: 129 }, (_, segment) =>
    padPoint((segment / 128) * Math.PI * 2, 0.44)
  );
  const seam = parts.mesh(
    new TubeGeometry(
      new CatmullRomCurve3(seamPoints, true),
      192,
      0.12,
      6,
      true
    ),
    parts.lining,
    [0, 0, 0],
    "Fine sewn binding around the removable cushion"
  );
  const core = createClearFoamCore(
    parts,
    geometry,
    "Dark memory foam inside the removable ear cushion"
  );
  return { cushion, holes, seam, core };
}
