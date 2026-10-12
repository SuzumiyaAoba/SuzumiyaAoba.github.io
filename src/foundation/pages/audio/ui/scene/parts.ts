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
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type Position = readonly [number, number, number];

function brushedTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot create the aluminium finish texture.");
  }
  context.fillStyle = "#f5f5f5";
  context.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 512; row += 1) {
    const shade = 208 + ((row * 73 + 19) % 43);
    context.fillStyle = `rgb(${shade} ${shade} ${shade} / 0.5)`;
    context.fillRect(0, row, 512, 0.6);
  }
  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

export function createModelParts() {
  const root = new Group();
  root.name = "TEAC UD-505 Silver — millimetres";
  const geometries = new Set<BufferGeometry>();
  const textures = new Set<Texture>();
  const materials = new Set<Material>();
  const brush = brushedTexture();
  textures.add(brush);

  const silver = new MeshPhysicalMaterial({
    color: 0xc9_cb_ce,
    metalness: 0.92,
    roughness: 0.32,
    map: brush,
    bumpMap: brush,
    bumpScale: 0.08,
    anisotropy: 0.45,
    envMapIntensity: 1.1,
  });
  const turned = new MeshPhysicalMaterial({
    color: 0xd1_d3_d6,
    metalness: 1,
    roughness: 0.25,
    envMapIntensity: 1.15,
  });
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
  const black = new MeshStandardMaterial({ color: 0x10_12_16, roughness: 0.7 });
  const rubber = new MeshStandardMaterial({
    color: 0x08_09_0b,
    roughness: 0.95,
  });
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
    resolution = 2048
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = resolution;
    canvas.height = Math.round((height / width) * resolution);
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
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    return mesh(new PlaneGeometry(width, height), material, position, name);
  };

  const screw = (
    position: Position,
    face: "front" | "rear" | "top" | "bottom" | "left" | "right" = "front",
    dark = false
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
    const head = cylinder(
      1.65,
      0.55,
      [0, 0, 0],
      dark ? black : steel,
      "Screw head",
      24
    );
    const slotA = box(
      [1.9, 0.3, 0.15],
      [0, 0, 0.32],
      cavity,
      "Phillips recess",
      0.06
    );
    const slotB = box(
      [0.3, 1.9, 0.15],
      [0, 0, 0.32],
      cavity,
      "Phillips recess",
      0.06
    );
    group.add(head, slotA, slotB);
    root.add(group);
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
