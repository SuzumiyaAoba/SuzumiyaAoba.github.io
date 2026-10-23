import { CatmullRomCurve3, Vector3 } from "three";
import type { Object3D } from "three";
import { ie600BalancedPlugDimensions } from "./ie-600-geometry";
import { ie600BalancedPlug, ie600Splitter } from "./ie-600-hardware";
import { createIe600Parts } from "./ie-600-parts";
import { ie600Cable } from "./ie-600-cable";
import { cableEndpoint, getConnectionPoint } from "./system-cables";

/** 単体と接続図で同じ純正プラグ・分岐部・被覆を使う。 */
export function createIe600SystemCable(model: Object3D, dac: Object3D) {
  const parts = createIe600Parts();
  parts.root.name = "Connected IE 600 balanced cable";
  const socket = cableEndpoint(dac, [25.5, 30.8, 115.9]);
  const plug = ie600BalancedPlug(
    parts,
    parts.root,
    socket.position
      .clone()
      .addScaledVector(
        socket.direction,
        ie600BalancedPlugDimensions.shaftStart + 0.5
      ),
    "IE 600 4.4 mm balanced cable plug in UD-505"
  );
  plug.quaternion.setFromUnitVectors(
    new Vector3(0, 0, 1),
    socket.direction.clone().negate()
  );
  plug.rotateZ(Math.PI);
  const start = cableEndpoint(
    plug,
    [
      ie600BalancedPlugDimensions.cableEntry,
      0,
      ie600BalancedPlugDimensions.cableDepth,
    ],
    [-1, 0, 0]
  );
  const junction = new Vector3(295, 10, 220);
  ie600Splitter(parts, parts.root, junction);
  const tail = junction.clone().add(new Vector3(0, 0, 22));
  ie600Cable(
    parts,
    parts.root,
    new CatmullRomCurve3([
      start.position,
      start.position.clone().addScaledVector(start.direction, 18),
      new Vector3(-35, 8, 235),
      new Vector3(245, 7, 275),
      tail.clone().add(new Vector3(0, 0, 18)),
      tail,
    ]),
    0.85,
    "UD-505 4.4 mm balanced output to the silver IE 600 splitter"
  );
  for (const [side, offset] of [
    ["Left", -0.65],
    ["Right", 0.65],
  ] as const) {
    const endpoint = cableEndpoint(
      getConnectionPoint(model, `IE 600 ${side} cable exit`),
      [0, 0, 0]
    );
    const branch = junction.clone().add(new Vector3(offset, 0, 0));
    ie600Cable(
      parts,
      parts.root,
      new CatmullRomCurve3([
        branch,
        branch.clone().add(new Vector3(0, 0, -18)),
        new Vector3(endpoint.position.x, 6, 145),
        new Vector3(endpoint.position.x + 12, 7, 70),
        endpoint.position.clone().addScaledVector(endpoint.direction, 18),
        endpoint.position,
      ]),
      0.6,
      `${side} connected IE 600 cable branch`
    );
  }
  return { group: parts.root, dispose: () => parts.dispose() };
}
