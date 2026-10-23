import { createModelParts } from "./parts";
import { applySurfaceFinish } from "./surface-finish";

export function createReferenceParts() {
  const parts = createModelParts({ brushed: false });
  parts.silver.color.setHex(0xcd_cf_d1);
  parts.silver.metalness = 0.82;
  parts.silver.roughness = 0.38;
  parts.silver.anisotropy = 0.35;
  parts.silver.envMapIntensity = 1;
  applySurfaceFinish(parts.silver, {
    scale: [0.16, 12, 12],
    relief: 0.0035,
    roughness: 0.08,
  });
  parts.footMetal.color.setHex(0xb4_b2_aa);
  parts.footMetal.metalness = 1;
  parts.footMetal.roughness = 0.25;
  parts.gold.color.setHex(0xd1_ad_62);
  parts.gold.metalness = 1;
  parts.gold.roughness = 0.24;
  return parts;
}
