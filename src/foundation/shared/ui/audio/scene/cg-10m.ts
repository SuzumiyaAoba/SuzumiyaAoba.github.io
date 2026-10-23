import { createCg10mFront } from "./cg-10m-front";
import { createCg10mRear } from "./cg-10m-rear";
import { createReferenceParts } from "./reference-parts";
import {
  createReferenceChassis,
  fitReferenceDimensions,
} from "./reference-chassis";

/** Original CG-10M exterior from TEAC photos; unseen/component dimensions are estimated. */
export function createCg10m() {
  const parts = createReferenceParts();
  parts.root.name = "TEAC CG-10M Silver — millimetres";
  // 底面写真にある基板固定部。細かな部品間隔は写真からの推定。
  createReferenceChassis(parts, [
    [-28, -58],
    [28, -58],
    [-28, -4],
    [28, -4],
    [-28, 50],
    [28, 50],
  ]);
  createCg10mFront(parts);
  createCg10mRear(parts);
  fitReferenceDimensions(parts);
  return { group: parts.root, dispose: () => parts.dispose() };
}
