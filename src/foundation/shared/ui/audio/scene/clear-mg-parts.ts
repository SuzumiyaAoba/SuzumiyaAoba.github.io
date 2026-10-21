import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CatmullRomCurve3,
  TubeGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Object3D,
  Path,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Material } from "three";
import { createClearMgPile } from "./clear-mg-fabric";
import { createLeatherGrain } from "./leather-grain";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";
import type { Position } from "./parts";

export function clearOval(width: number, height: number) {
  const shape = new Shape();
  shape.absellipse(0, 0, width / 2, height / 2, 0, Math.PI * 2, false, 0);
  return shape;
}

function surfaceTexture(woven: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the Clear Mg Professional surface texture.");
  }
  const pixels = context.createImageData(256, 256);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const column = (index / 4) % 256;
    const row = Math.floor(index / 1024);
    const noise = (column * 47 + row * 67 + column * row * 13) % 59;
    const weave = woven && (column % 4 === 0 || row % 4 === 0) ? 12 : 0;
    const shade = (woven ? 180 : 104) + noise + weave;
    pixels.data[index] = shade;
    pixels.data[index + 1] = shade;
    pixels.data[index + 2] = shade;
    pixels.data[index + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture(canvas);
  if (woven) {
    texture.colorSpace = SRGBColorSpace;
  }
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(woven ? 12 : 3, woven ? 3 : 2);
  texture.anisotropy = 8;
  return texture;
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
    context.fillRect(offset, 0, 0.9, 256);
    context.fillRect(0, offset, 256, 0.9);
  }
  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

export function createClearMgParts() {
  const parts = createModelParts();
  const fabric = surfaceTexture(true);
  const grain = createLeatherGrain(512, 512, 14);
  grain.repeat.set(3, 2);
  const meshTexture = acousticMeshTexture();
  const coated = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x0b_0c_0d,
      metalness: 0.35,
      roughness: 0.48,
      specularIntensity: 0.45,
      envMapIntensity: 0.65,
    }),
    { relief: 0.016, roughness: 0.09 }
  );
  const leather = new MeshPhysicalMaterial({
    color: 0x0a_0b_0c,
    roughness: 0.75,
    specularIntensity: 0.3,
    envMapIntensity: 0.4,
    bumpMap: grain,
    bumpScale: 0.2,
  });
  const microfiber = new MeshPhysicalMaterial({
    color: 0x92_27_40,
    roughness: 0.97,
    specularIntensity: 0.15,
    sheen: 0.65,
    sheenColor: 0xbe_65_76,
    sheenRoughness: 0.95,
    map: fabric,
    roughnessMap: fabric,
    bumpMap: fabric,
    bumpScale: 0.085,
  });
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
    bumpMap: fabric,
    bumpScale: 0.06,
  });
  const perforation = new MeshBasicMaterial({ color: 0x28_08_14 });
  const grille = new MeshStandardMaterial({
    color: 0x28_2b_2e,
    metalness: 0.75,
    roughness: 0.46,
    envMapIntensity: 0.65,
  });
  const polished = new MeshStandardMaterial({
    color: 0x92_96_9a,
    metalness: 0.92,
    roughness: 0.28,
  });
  const woven = new MeshStandardMaterial({
    color: 0x14_16_18,
    metalness: 0.4,
    roughness: 0.65,
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
    pile: () =>
      parts.mesh(
        pileGeometry,
        pile,
        [0, 0, 0],
        "Short individual red microfiber fibers"
      ),
    lining,
    perforation,
    grille,
    polished,
    woven,
    magnesium,
    plate,
    ovalRing,
    dispose() {
      parts.dispose();
      fabric.dispose();
      grain.dispose();
      meshTexture.dispose();
    },
  };
}

export type ClearMgParts = ReturnType<typeof createClearMgParts>;

// A softly squared cross-section preserves the broad cushion face and 20 mm depth.
export function padPoint(u: number, v: number) {
  const radial = Math.sign(Math.cos(v)) * Math.abs(Math.cos(v)) ** 0.65;
  const depth = Math.sign(Math.sin(v)) * Math.abs(Math.sin(v)) ** 0.65;
  return new Vector3(
    (35 + 11 * radial) * Math.cos(u),
    (46 + 11 * radial) * Math.sin(u),
    -18 + 10 * depth
  );
}

export function createClearPad(parts: ClearMgParts) {
  const segments = 128;
  const sections = 32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let segment = 0; segment <= segments; segment += 1) {
    for (let section = 0; section <= sections; section += 1) {
      const point = padPoint(
        (segment / segments) * Math.PI * 2,
        (section / sections) * Math.PI * 2
      );
      positions.push(point.x, point.y, point.z);
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
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const cushion = parts.mesh(
    geometry,
    parts.microfiber,
    [0, 0, 0],
    "20 mm perforated red microfiber cushion"
  );

  const rows = [
    -2.85, -2.55, -2.2, -1.85, -1.4, -1.05, -0.7, -0.35, 0.1, 0.5, 2.8,
  ];
  const columns = 80;
  const holes = parts.instanced(
    new CircleGeometry(0.42, 10),
    parts.perforation,
    rows.length * columns,
    "Recessed microfiber perforations"
  );
  const placement = new Object3D();
  const normalAxis = new Vector3(0, 0, 1);
  let index = 0;
  for (const [row, v] of rows.entries()) {
    for (let column = 0; column < columns; column += 1) {
      const u = ((column + (row % 2) * 0.5) / columns) * Math.PI * 2;
      const position = padPoint(u, v);
      const tangentU = padPoint(u + 0.001, v).sub(position);
      const tangentV = padPoint(u, v + 0.001).sub(position);
      const normal = tangentU.cross(tangentV).normalize();
      placement.position.copy(position.addScaledVector(normal, 0.035));
      placement.quaternion.setFromUnitVectors(normalAxis, normal);
      placement.updateMatrix();
      holes.setMatrixAt(index, placement.matrix);
      index += 1;
    }
  }
  holes.computeBoundingSphere();
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
  return { cushion, holes, seam };
}
