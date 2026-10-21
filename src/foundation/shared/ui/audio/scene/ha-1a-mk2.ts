import { Box3, Vector3 } from "three";
import { createHa1aFront } from "./ha-1a-front";
import { ha1aTopGeometry } from "./ha-1a-geometry";
import { createHa1aParts } from "./ha-1a-parts";
import type { Ha1aParts } from "./ha-1a-parts";
import { createHa1aRear } from "./ha-1a-rear";

function woodSides(parts: Ha1aParts) {
  for (const x of [-59.8, 59.8]) {
    parts.box(
      [6.5, 207, 282],
      [x, 111, -1],
      parts.steel,
      "Metal backing visible in the wood-panel seams",
      0.6
    );
    for (let board = 0; board < 5; board += 1) {
      const panel = parts.box(
        [6.7, 40.2, 282],
        [x, 28.1 + board * 41.3, -1],
        parts.wood,
        "Lacquered wood side panel",
        1
      );
      const positions = panel.geometry.getAttribute("position");
      const uvs = panel.geometry.getAttribute("uv");
      for (let vertex = 0; vertex < positions.count; vertex += 1) {
        uvs.setXY(
          vertex,
          positions.getZ(vertex) / 282 + 0.5,
          (positions.getY(vertex) + panel.position.y - 7) / 208
        );
      }
    }
    for (const z of [-128, 127]) {
      parts.screw([Math.sign(x) * 55.8, 10, z], "bottom", true);
    }
  }
}

function topCover(parts: Ha1aParts) {
  const top = parts.mesh(
    ha1aTopGeometry(),
    parts.charcoal,
    [0, 213.7, -1],
    "Top cover with open cooling slots"
  );
  top.rotation.x = -Math.PI / 2;
  const markings = parts.print(
    90,
    76,
    [0, 215.02, -1],
    (context) => {
      context.strokeStyle = "#737679";
      context.fillStyle = "#8b8d90";
      context.lineWidth = 0.3;
      context.textAlign = "center";
      for (const [x, y, name] of [
        [23, 57, "12AU7"],
        [67, 57, "12AU7"],
        [23, 33, "EL84EH"],
        [67, 33, "EL84EH"],
        [45, 10, "12DT5"],
      ] as const) {
        context.beginPath();
        context.ellipse(x, y, 9.5, 7.5, 0, 0, Math.PI * 2);
        context.stroke();
        context.font = "1.7px Arial";
        context.fillText(name, x, y + 0.6);
      }
    },
    "Five tube-position diagrams on the top cover",
    1024
  );
  markings.rotation.x = -Math.PI / 2;
}

function underside(parts: Ha1aParts) {
  parts.box(
    [112, 2.1, 282],
    [0, 8.2, -1],
    parts.charcoal,
    "Bottom chassis plate",
    0.4
  );
  for (const [x, z] of [
    [-39, 107],
    [39, 107],
    [0, -110],
  ] as const) {
    const foot = parts.cylinder(
      11.5,
      5.6,
      [x, 4.2, z],
      parts.steel,
      "Independent supporting foot"
    );
    foot.rotation.x = 0;
    const pad = parts.cylinder(
      10.8,
      1.4,
      [x, 0.7, z],
      parts.rubber,
      "Non-slip foot pad"
    );
    pad.rotation.x = 0;
  }
  for (const x of [-49, 49]) {
    for (const z of [-120, 0, 120]) {
      parts.screw([x, 7, z], "bottom", true);
    }
  }
}

/** Manufacturer dimensions; exterior details and internal tube placement are estimated from photos. */
export function createHa1aMk2() {
  const parts = createHa1aParts();
  parts.root.name = "Cayin HA-1A MK2 Silver / Wood — millimetres";
  woodSides(parts);
  topCover(parts);
  underside(parts);
  for (const x of [-26, 26]) {
    parts.box(
      [43, 94, 258],
      [x, 59, -1],
      parts.rubber,
      "Shielded transformer compartment",
      2
    );
  }
  parts.box(
    [102, 89, 126],
    [0, 163, -72],
    parts.rubber,
    "Rear power-supply compartment",
    1
  );
  createHa1aFront(parts);
  createHa1aRear(parts);
  const bounds = new Box3().setFromObject(parts.root);
  const size = bounds.getSize(new Vector3());
  parts.root.scale.set(126.5 / size.x, 215 / size.y, 304 / size.z);
  parts.root.position.y = -bounds.min.y * parts.root.scale.y;
  return { group: parts.root, dispose: () => parts.dispose() };
}
