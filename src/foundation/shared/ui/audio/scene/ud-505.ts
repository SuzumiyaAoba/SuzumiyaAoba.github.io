import { createFront } from "./front";
import { createRear } from "./rear";
import { createReferenceParts } from "./reference-parts";
import {
  createReferenceChassis,
  fitReferenceDimensions,
} from "./reference-chassis";

/** Original AK4497 UD-505 exterior, in millimetres, reconstructed from TEAC photos. */
export function createUd505() {
  const parts = createReferenceParts();
  parts.root.name = "TEAC UD-505 Silver — millimetres";
  // 底面写真で確認できる基板取付座。位置は写真からの推定値。
  createReferenceChassis(parts, [
    [-40, -101],
    [-44, 53],
    [-38, 63],
    [50, 17],
  ]);
  for (const [x, z] of [
    [-29, 102],
    [-14, 95],
    [-11, 78],
    [19, 68],
    [57, 39],
  ] as const) {
    const stamp = parts.cylinder(
      1.65,
      0.08,
      [x, 12.25, z],
      parts.footMetal,
      "Circular pressed bottom-panel fixing"
    );
    stamp.rotation.x = 0;
  }
  createFront(parts);
  createRear(parts);
  fitReferenceDimensions(parts);
  return { group: parts.root, dispose: () => parts.dispose() };
}
