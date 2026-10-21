import { createFront } from "./front";
import { createRear } from "./rear";
import { createModelParts } from "./parts";
import {
  createReferenceChassis,
  fitReferenceDimensions,
} from "./reference-chassis";

/** Original AK4497 UD-505 exterior, in millimetres, reconstructed from TEAC photos. */
export function createUd505() {
  const parts = createModelParts();
  parts.root.name = "TEAC UD-505 Silver — millimetres";
  createReferenceChassis(parts);
  createFront(parts);
  createRear(parts);
  fitReferenceDimensions(parts);
  return { group: parts.root, dispose: () => parts.dispose() };
}
