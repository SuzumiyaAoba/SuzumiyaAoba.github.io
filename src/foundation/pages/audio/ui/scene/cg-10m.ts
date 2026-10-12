import { createCg10mFront } from "./cg-10m-front";
import { createCg10mRear } from "./cg-10m-rear";
import { createModelParts } from "./parts";
import {
  createReferenceChassis,
  fitReferenceDimensions,
} from "./reference-chassis";

/** Original CG-10M exterior from TEAC photos; unseen/component dimensions are estimated. */
export function createCg10m() {
  const parts = createModelParts();
  parts.root.name = "TEAC CG-10M Silver — millimetres";
  createReferenceChassis(parts, true);
  createCg10mFront(parts);
  createCg10mRear(parts);
  fitReferenceDimensions(parts);
  return { group: parts.root, dispose: () => parts.dispose() };
}
