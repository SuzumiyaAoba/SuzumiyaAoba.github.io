import {
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Shape,
  TorusGeometry,
  Vector2,
} from "three";
import type { BufferGeometry, Material, Texture } from "three";
import { screwHeadGeometry } from "./hardware-geometry";
import { applySurfaceFinish } from "./surface-finish";
import { createTurnedFace } from "./turned-metal";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

export type Position = readonly [number, number, number];

export function createModelParts({
  brushed = true,
}: { brushed?: boolean } = {}) {
  const root = new Group();
  root.name = "TEAC UD-505 Silver — millimetres";
  // 内部の部品は静的。機器単位で結合しても外側の移動・表示切替を保てる。
  root.userData["audioStaticRoot"] = true;
  const geometries = new Set<BufferGeometry>();
  const textures = new Set<Texture>();
  const materials = new Set<Material>();
  const instances = new Set<InstancedMesh>();
  let screwGeometry: BufferGeometry | undefined;
  let dialFace: ReturnType<typeof createTurnedFace> | undefined;

  const silver = new MeshPhysicalMaterial({
    color: 0xc9_cb_ce,
    metalness: 0.92,
    roughness: 0.32,
    anisotropy: 0.45,
    envMapIntensity: 1.1,
  });
  if (brushed) {
    applySurfaceFinish(silver, {
      scale: [0.08, 7, 7],
      relief: 0.028,
      roughness: 0.16,
    });
  }
  const turned = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0xd1_d3_d6,
      metalness: 1,
      roughness: 0.25,
      envMapIntensity: 1.15,
    }),
    { relief: 0.003, roughness: 0.035 }
  );
  const steel = new MeshStandardMaterial({
    color: 0x70_74_7a,
    metalness: 0.9,
    roughness: 0.3,
  });
  const gold = new MeshStandardMaterial({
    color: 0xcd_a6_53,
    metalness: 0.85,
    roughness: 0.28,
  });
  const footMetal = new MeshStandardMaterial({
    color: 0xc8_cc_d0,
    metalness: 0.75,
    roughness: 0.4,
    envMapIntensity: 1.2,
  });
  const black = applySurfaceFinish(
    new MeshStandardMaterial({ color: 0x10_12_16, roughness: 0.7 })
  );
  const rubber = applySurfaceFinish(
    new MeshStandardMaterial({
      color: 0x08_09_0b,
      roughness: 0.95,
    }),
    { scale: [5, 5, 5], relief: 0.007, roughness: 0.04 }
  );
  const cavity = new MeshBasicMaterial({ color: 0x03_04_05 });
  const rear = new MeshStandardMaterial({
    color: 0x1d_20_24,
    metalness: 0.3,
    roughness: 0.5,
  });
  const glass = new MeshPhysicalMaterial({
    color: 0x03_06_09,
    metalness: 0.15,
    roughness: 0.19,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const blue = new MeshBasicMaterial({
    color: 0x52_ad_ff,
    toneMapped: false,
  });
  for (const material of [
    silver,
    turned,
    steel,
    footMetal,
    gold,
    black,
    rubber,
    cavity,
    rear,
    glass,
    blue,
  ]) {
    materials.add(material);
  }

  const mesh = (
    geometry: BufferGeometry,
    material: Material,
    position: Position,
    name: string
  ) => {
    // 押し出し形状の面取りを滑らかにつなぎ、端子穴などの直角は残す。
    // 同じねじ形状を再利用するときは法線を再計算しない。
    if (geometry instanceof ExtrudeGeometry && !geometries.has(geometry)) {
      const originalNormals = geometry.getAttribute("normal").clone();
      toCreasedNormals(geometry, Math.PI / 4);
      const normals = geometry.getAttribute("normal");
      for (let index = 0; index < normals.count; index += 1) {
        const x = originalNormals.getX(index);
        const y = originalNormals.getY(index);
        const z = originalNormals.getZ(index);
        // 平面へ面取りの法線を広げると、長い三角形の対角線が反射に現れる。
        if (Math.abs(x) === 1 || Math.abs(y) === 1 || Math.abs(z) === 1) {
          normals.setXYZ(index, x, y, z);
        }
      }
    }
    geometries.add(geometry);
    materials.add(material);
    const part = new Mesh(geometry, material);
    part.name = name;
    part.position.set(...position);
    root.add(part);
    return part;
  };

  const box = (
    size: Position,
    position: Position,
    material: Material,
    name: string,
    radius = 0.5
  ) =>
    mesh(
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(radius, ...size.map((side) => side / 2))
      ),
      material,
      position,
      name
    );

  const instanced = (
    geometry: BufferGeometry,
    material: Material,
    count: number,
    name: string
  ) => {
    geometries.add(geometry);
    materials.add(material);
    const part = new InstancedMesh(geometry, material, count);
    instances.add(part);
    part.name = name;
    root.add(part);
    return part;
  };

  const facePlate = (
    size: Position,
    position: Position,
    material: Material,
    name: string,
    radius: number
  ) => {
    const [width, height, depth] = size;
    const x = -width / 2;
    const y = -height / 2;
    const shape = new Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    const bevel = Math.min(0.15, depth / 4);
    const geometry = new ExtrudeGeometry(shape, {
      depth: depth - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 16,
    });
    const positions = geometry.getAttribute("position");
    const uvs = geometry.getAttribute("uv");
    for (let index = 0; index < positions.count; index += 1) {
      uvs.setXY(
        index,
        (positions.getX(index) - x) / width,
        (positions.getY(index) - y) / height
      );
    }
    return mesh(
      geometry,
      material,
      [position[0], position[1], position[2] - depth / 2 + bevel],
      name
    );
  };

  const cylinder = (
    radius: number,
    depth: number,
    position: Position,
    material: Material,
    name: string,
    segments = 48
  ) => {
    const part = mesh(
      new CylinderGeometry(radius, radius, depth, segments),
      material,
      position,
      name
    );
    part.rotation.x = Math.PI / 2;
    return part;
  };

  const disc = (
    radius: number,
    position: Position,
    material: Material,
    name: string
  ) => mesh(new CircleGeometry(radius, 64), material, position, name);

  const ring = (
    radius: number,
    thickness: number,
    position: Position,
    material: Material,
    name: string
  ) =>
    mesh(
      new TorusGeometry(radius, thickness, 12, 64),
      material,
      position,
      name
    );

  const lathe = (
    profile: readonly (readonly [number, number])[],
    position: Position,
    material: Material,
    name: string
  ) => {
    const part = mesh(
      new LatheGeometry(
        profile.map(([radius, length]) => new Vector2(radius, length)),
        96
      ),
      material,
      position,
      name
    );
    part.rotation.x = Math.PI / 2;
    return part;
  };

  const print = (
    width: number,
    height: number,
    position: Position,
    draw: (context: CanvasRenderingContext2D) => void,
    name: string,
    resolution = 2048,
    illuminated = false
  ) => {
    const canvas = document.createElement("canvas");
    // 縦長の印字も長辺を上限とし、画像とミップマップの過大な確保を避ける。
    const pixelsPerMillimetre = resolution / Math.max(width, height);
    canvas.width = Math.max(1, Math.round(width * pixelsPerMillimetre));
    canvas.height = Math.max(1, Math.round(height * pixelsPerMillimetre));
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Cannot create the product lettering texture.");
    }
    context.scale(canvas.width / width, canvas.height / height);
    draw(context);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    textures.add(texture);
    const material = illuminated
      ? new MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        })
      : new MeshStandardMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          roughness: 0.72,
          metalness: 0.08,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
    const lettering = mesh(
      new PlaneGeometry(width, height),
      material,
      position,
      name
    );
    lettering.userData["castShadow"] = false;
    return lettering;
  };

  const screw = (
    position: Position,
    face: "front" | "rear" | "top" | "bottom" | "left" | "right" = "front",
    dark = false,
    finish?: Material
  ) => {
    const group = new Group();
    group.position.set(...position);
    if (face === "rear") {
      group.rotation.y = Math.PI;
    }
    if (face === "top") {
      group.rotation.x = -Math.PI / 2;
    }
    if (face === "bottom") {
      group.rotation.x = Math.PI / 2;
    }
    if (face === "right") {
      group.rotation.y = Math.PI / 2;
    }
    if (face === "left") {
      group.rotation.y = -Math.PI / 2;
    }
    screwGeometry ??= screwHeadGeometry();
    const head = mesh(
      screwGeometry,
      finish ?? (dark ? black : steel),
      [0, 0, 0],
      "Beveled screw head with a recessed Phillips drive"
    );
    const recess = disc(
      1.58,
      [0, 0, -0.08],
      cavity,
      "Dark floor beneath the screw drive"
    );
    group.add(head, recess);
    root.add(group);
    return group;
  };

  return {
    root,
    mesh,
    box,
    instanced,
    facePlate,
    cylinder,
    disc,
    ring,
    lathe,
    print,
    screw,
    silver,
    turned,
    turnedFace() {
      dialFace ??= createTurnedFace();
      materials.add(dialFace.material);
      for (const texture of dialFace.textures) {
        textures.add(texture);
      }
      return dialFace.material;
    },
    steel,
    footMetal,
    gold,
    black,
    rubber,
    cavity,
    rear,
    glass,
    blue,
    dispose() {
      for (const instance of instances) {
        instance.dispose();
      }
      for (const geometry of geometries) {
        geometry.dispose();
      }
      for (const material of materials) {
        material.dispose();
      }
      for (const texture of textures) {
        texture.dispose();
      }
    },
  };
}

export type ModelParts = ReturnType<typeof createModelParts>;
