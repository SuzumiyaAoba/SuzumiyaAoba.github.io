import { Group } from "three";
import type { Vector3 } from "three";
import type { Ie600Parts } from "./ie-600-parts";
import {
  ie600BalancedPlugBodyGeometry,
  ie600BalancedPlugGeometry,
  ie600BalancedPlugDimensions,
  ie600BoreGeometry,
} from "./ie-600-geometry";
import { ie600SymbolPath } from "./ie-600-textures";

export function ie600Splitter(
  parts: Ie600Parts,
  parent: Group,
  position: Vector3
) {
  const splitter = new Group();
  splitter.name = "Silver metal Y splitter and sliding cable cinch";
  splitter.position.copy(position);
  parent.add(splitter);
  splitter.add(
    parts.box(
      [4.7, 3.2, 5],
      [0, 0, 1.5],
      parts.connectorRubber,
      "Black cable cinch above the silver splitter",
      0.5
    ),
    parts.box(
      [5.2, 3.4, 12],
      [0, 0, 10],
      parts.splitterMetal,
      "Brushed silver cable splitter barrel",
      0.55
    ),
    parts.lathe(
      [
        [0.8, 16],
        [2.55, 16],
        [2.5, 16.5],
        [1.2, 21.5],
        [0.85, 22],
        [0.8, 22],
        [0.8, 16],
      ],
      [0, 0, 0],
      parts.connectorRubber,
      "Tapered black splitter tail"
    )
  );
  const tail = splitter.getObjectByName("Tapered black splitter tail");
  if (tail) {
    tail.scale.z = 0.66;
  }
  const emblem = parts.print(
    3,
    3,
    [0, 1.64, 1.4],
    (context) => {
      context.fillStyle = "#bfc1c1";
      context.fillRect(0, 0, 3, 3);
      context.fillStyle = "#525455";
      context.save();
      context.translate(0.5, 0.75);
      context.scale(2 / 24, 1.5 / 18);
      context.translate(0, -3);
      context.fill(new Path2D(ie600SymbolPath));
      context.restore();
    },
    "Sennheiser emblem on the cable cinch",
    256
  );
  emblem.rotation.x = -Math.PI / 2;
  splitter.add(emblem);
}

export function ie600BalancedPlug(
  parts: Ie600Parts,
  parent: Group,
  position: Vector3,
  name = "4.4 mm balanced five-pole plug"
) {
  const plug = new Group();
  plug.name = name;
  plug.position.copy(position);
  parent.add(plug);
  plug.add(
    parts.mesh(
      ie600BalancedPlugBodyGeometry(),
      parts.connectorRubber,
      [0, 0, 0],
      "Right angled balanced plug overmould and tapered strain relief"
    ),
    parts.mesh(
      ie600BalancedPlugGeometry(),
      parts.connectorGold,
      [0, 0, ie600BalancedPlugDimensions.shaftStart],
      `${name} metal collar`
    )
  );
  for (const length of ie600BalancedPlugDimensions.insulators) {
    plug.add(
      parts.mesh(
        ie600BoreGeometry(2.2, 2.1, 0.5),
        parts.black,
        [0, 0, ie600BalancedPlugDimensions.shaftStart + length],
        "Balanced plug insulating ring"
      )
    );
  }
  return plug;
}
