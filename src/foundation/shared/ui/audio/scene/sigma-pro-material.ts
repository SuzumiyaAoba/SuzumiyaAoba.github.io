import { MeshPhysicalMaterial } from "three";
import { applySurfaceFinish } from "./surface-finish";

/** 微細な梨地の黒色アルマイト。加工の粒度を実寸でそろえる。 */
export function sigmaAluminiumMaterial() {
  return applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x1b_1d_20,
      metalness: 0.65,
      roughness: 0.54,
      envMapIntensity: 0.6,
    }),
    { scale: [18, 18, 18], relief: 0.0035, roughness: 0.055 }
  );
}
