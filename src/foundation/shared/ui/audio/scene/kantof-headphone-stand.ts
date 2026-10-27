import {
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  Vector2,
} from "three";
import { createPreparedTexture } from "./prepared-textures";
import { applySurfaceFinish } from "./surface-finish";

export const kantofStandPosition = [390, 0, 25] as const;
export const kantofCradleName = "Curved walnut headphone cradle";

function cradleGeometry() {
  const outline = new Shape();
  outline.moveTo(-49, 269);
  outline.bezierCurveTo(-43, 276, -24, 289, 0, 289);
  outline.bezierCurveTo(24, 289, 43, 276, 49, 269);
  outline.quadraticCurveTo(50, 266, 47, 266);
  outline.lineTo(32, 266);
  outline.bezierCurveTo(20, 266, 17, 274, 0, 274);
  outline.bezierCurveTo(-17, 274, -20, 266, -32, 266);
  outline.lineTo(-47, 266);
  outline.quadraticCurveTo(-50, 266, -49, 269);
  const geometry = new ExtrudeGeometry(outline, {
    depth: 63,
    bevelEnabled: true,
    bevelSize: 1,
    bevelThickness: 1,
    bevelSegments: 3,
    curveSegments: 32,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    // 表面と面取りで投影を連続させ、木目の継ぎ目を目立たせない。
    uvs.setXY(index, (x + 50) / 100, (z + (y - 265) * 1.5 + 1) / 103);
  }
  return geometry;
}

/** 公表寸法は mm。木部の曲率と支柱径は製品写真から推定。 */
export function createKantofHeadphoneStand() {
  const group = new Group();
  group.name = "kantof headphone stand — millimetres";
  group.userData["audioStaticRoot"] = true;
  const woodTexture = createPreparedTexture("kantof-wood", true);
  const wood = new MeshPhysicalMaterial({
    map: woodTexture,
    color: 0xb6_9c_87,
    roughness: 0.62,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
  });
  const metal = applySurfaceFinish(
    new MeshStandardMaterial({
      color: 0x22_23_25,
      metalness: 0.78,
      roughness: 0.42,
    }),
    { scale: [10, 0.4, 10], relief: 0.002, roughness: 0.045 }
  );
  const baseGeometry = new LatheGeometry(
    [
      [0, 0],
      [58.5, 0],
      [60, 1.2],
      [60, 6.8],
      [58.5, 8],
      [0, 8],
    ].map(([radius, height]) => new Vector2(radius, height)),
    96
  );
  const base = new Mesh(baseGeometry, metal);
  base.name = "Black aluminium circular base";
  const postGeometry = new CylinderGeometry(4, 4, 266, 48);
  const post = new Mesh(postGeometry, metal);
  post.name = "Black aluminium support post";
  post.position.y = 141;
  const woodGeometry = cradleGeometry();
  const cradle = new Mesh(woodGeometry, wood);
  cradle.name = kantofCradleName;
  cradle.position.z = -31.5;
  group.add(base, post, cradle);
  return {
    group,
    dispose() {
      baseGeometry.dispose();
      postGeometry.dispose();
      woodGeometry.dispose();
      metal.dispose();
      wood.dispose();
      woodTexture.dispose();
    },
  };
}
