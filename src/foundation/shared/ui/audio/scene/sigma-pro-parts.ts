import {
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from "three";
import type { BufferGeometry, Material } from "three";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";
import type { Position } from "./parts";
import { sigmaAluminiumMaterial } from "./sigma-pro-material";
import { sigmaLetteringGeometry } from "./sigma-pro-lettering";
import type { SigmaFont } from "./sigma-pro-lettering";

export function createSigmaParts() {
  const parts = createModelParts({ brushed: false });
  const lettering = new Map<string, BufferGeometry>();
  const aluminium = sigmaAluminiumMaterial();
  const machined = new MeshPhysicalMaterial({
    color: 0x5b_60_64,
    metalness: 0.95,
    roughness: 0.25,
    envMapIntensity: 0.65,
  });
  const plated = new MeshPhysicalMaterial({
    color: 0xe7_c2_73,
    metalness: 0.88,
    roughness: 0.22,
    envMapIntensity: 1,
  });
  const insulator = new MeshStandardMaterial({
    color: 0x06_07_08,
    roughness: 0.67,
    side: DoubleSide,
  });
  const windowGlass = new MeshPhysicalMaterial({
    color: 0xff_ff_ff,
    transmission: 1,
    thickness: 0.45,
    ior: 1.5,
    roughness: 0.007,
    envMapIntensity: 0.55,
    attenuationColor: 0xde_e7_ed,
    attenuationDistance: 35,
  });
  const boardSurface = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x0c_12_14,
      metalness: 0.08,
      roughness: 0.82,
      specularIntensity: 0.3,
      envMapIntensity: 0.25,
      clearcoat: 0.12,
      clearcoatRoughness: 0.7,
    }),
    { scale: [12, 12, 12], relief: 0.004, roughness: 0.06 }
  );
  const packageSurface = applySurfaceFinish(
    new MeshStandardMaterial({
      color: 0x13_16_18,
      metalness: 0.04,
      roughness: 0.78,
    }),
    { scale: [18, 18, 18], relief: 0.006, roughness: 0.12 }
  );
  const ceramic = new MeshStandardMaterial({
    color: 0x91_7e_5b,
    roughness: 0.57,
  });
  const solder = new MeshPhysicalMaterial({
    color: 0xb4_bb_b5,
    metalness: 0.92,
    roughness: 0.28,
  });
  const traces = new MeshStandardMaterial({
    color: 0x28_35_35,
    metalness: 0.3,
    roughness: 0.72,
  });
  const silkscreen = new MeshBasicMaterial({ color: 0x95_a1_9a });
  const ink = new MeshBasicMaterial({ color: 0x77_7b_7e });
  const packageInk = new MeshBasicMaterial({ color: 0x49_50_4c });
  const screenInk = new MeshBasicMaterial({
    color: 0xb8_c1_c8,
    toneMapped: false,
  });
  const text = (
    value: string,
    height: number,
    position: Position,
    name: string,
    material: Material = ink,
    font: SigmaFont = "sans",
    maxWidth = Number.POSITIVE_INFINITY
  ) => {
    const key = `${font}:${height}:${maxWidth}:${value}`;
    let geometry = lettering.get(key);
    if (!geometry) {
      geometry = sigmaLetteringGeometry(value, height, font, maxWidth);
      lettering.set(key, geometry);
    }
    const mesh = parts.mesh(geometry, material, position, name);
    mesh.userData["castShadow"] = false;
    return mesh;
  };
  return {
    ...parts,
    aluminium,
    machined,
    plated,
    insulator,
    windowGlass,
    boardSurface,
    packageSurface,
    ceramic,
    solder,
    traces,
    silkscreen,
    ink,
    packageInk,
    screenInk,
    text,
  };
}

export type SigmaParts = ReturnType<typeof createSigmaParts>;
