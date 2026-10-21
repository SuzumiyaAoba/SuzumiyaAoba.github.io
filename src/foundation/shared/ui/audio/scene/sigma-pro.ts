import { Group } from "three";
import { createSigmaBoard } from "./sigma-pro-board";
import { createSigmaFront } from "./sigma-pro-front";
import { createSigmaControls } from "./sigma-pro-controls";
import { createSigmaRear } from "./sigma-pro-rear";
import { createSigmaParts } from "./sigma-pro-parts";
import type { SigmaParts } from "./sigma-pro-parts";
import {
  SIGMA_HEIGHT,
  SIGMA_WIDTH,
  SIGMA_WINDOW,
  sigmaOutline,
  sigmaPlate,
  sigmaSideGeometry,
  sigmaTopGeometry,
} from "./sigma-pro-geometry";

function chassis(parts: SigmaParts) {
  const bottom = parts.mesh(
    sigmaPlate(sigmaOutline(SIGMA_WIDTH - 0.5, 145.7, 2.15), 1.65, 0.18),
    parts.aluminium,
    [0, 0.95, -5],
    "Bevelled aluminium bottom cover"
  );
  bottom.rotation.x = -Math.PI / 2;
  for (const x of [-41.25, 41.25]) {
    const side = parts.mesh(
      sigmaSideGeometry(),
      parts.aluminium,
      [x, SIGMA_HEIGHT / 2, 0],
      "Machined side wall with open protective front slot"
    );
    side.rotation.y = Math.PI / 2;
    for (const y of [5.7, 14.3]) {
      const screw = new Group();
      screw.name = "Recessed side-panel Phillips screw";
      screw.position.set(x < 0 ? -42.46 : 42.46, y, 59.5);
      screw.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2;
      screw.add(
        parts.cylinder(
          1.05,
          0.28,
          [0, 0, 0],
          parts.machined,
          "Countersunk screw head",
          32
        ),
        parts.cylinder(
          0.85,
          0.15,
          [0, 0, 0.15],
          parts.insulator,
          "Black oxide screw head",
          32
        ),
        parts.box(
          [0.95, 0.2, 0.06],
          [0, 0, 0.25],
          parts.cavity,
          "Phillips screw recess",
          0.04
        ),
        parts.box(
          [0.2, 0.95, 0.06],
          [0, 0, 0.25],
          parts.cavity,
          "Phillips screw recess",
          0.04
        )
      );
      parts.root.add(screw);
    }
  }
  const top = parts.mesh(
    sigmaTopGeometry(),
    parts.aluminium,
    [0, 19.4, -5],
    "CNC top frame with circuit, OLED and button openings"
  );
  top.rotation.x = -Math.PI / 2;
  // The black seal and glass are flush with the top; the board sits three millimetres below.
  const seal = sigmaOutline(
    SIGMA_WINDOW.width - 0.2,
    SIGMA_WINDOW.depth - 0.2,
    1.9
  );
  const inner = sigmaOutline(
    SIGMA_WINDOW.width - 1.2,
    SIGMA_WINDOW.depth - 1.2,
    1.7
  );
  seal.holes.push(inner);
  const gasket = parts.mesh(
    sigmaPlate(seal, 0.2, 0.02),
    parts.insulator,
    [0, 19.75, SIGMA_WINDOW.z],
    "Fine black glass perimeter seal"
  );
  gasket.rotation.x = -Math.PI / 2;
  const glass = parts.mesh(
    sigmaPlate(
      sigmaOutline(SIGMA_WINDOW.width - 0.5, SIGMA_WINDOW.depth - 0.5, 1.85),
      0.42,
      0.025
    ),
    parts.windowGlass,
    [0, 19.79, SIGMA_WINDOW.z],
    "Flush clear glass with physical reflections"
  );
  glass.rotation.x = -Math.PI / 2;
  glass.renderOrder = 2;
}

/** SIGMA Pro Black, reconstructed from Questyle's product photographs in millimetres. */
export function createSigmaPro() {
  const parts = createSigmaParts();
  parts.root.name =
    "Questyle SIGMA Pro Black — geometry-only circuit and enclosure model";
  chassis(parts);
  createSigmaBoard(parts);
  createSigmaFront(parts);
  createSigmaControls(parts);
  createSigmaRear(parts);
  return { group: parts.root, dispose: () => parts.dispose() };
}
