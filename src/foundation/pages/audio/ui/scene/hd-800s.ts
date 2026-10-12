import {
  Box3,
  CylinderGeometry,
  Group,
  Matrix4,
  Path,
  Shape,
  Vector3,
} from "three";
import { createHd800sParts, ellipticalOutline } from "./hd-800s-parts";
import type { Hd800sParts } from "./hd-800s-parts";
import {
  arcLabelGeometry,
  headbandLabelGeometry,
  ovalPoints,
} from "./hd-800s-geometry";

function bandOutline(
  outerX: number,
  outerY: number,
  innerX: number,
  innerY: number,
  start = 0,
  end = Math.PI
) {
  const shape = new Shape();
  shape.absellipse(0, 136, outerX, outerY, start, end, false, 0);
  shape.absellipse(0, 136, innerX, innerY, end, start, true, 0);
  shape.closePath();
  return shape;
}

function createHeadband(parts: Hd800sParts) {
  parts.plate(
    bandOutline(85, 89, 80, 84),
    28,
    [0, 0, -14],
    parts.trim,
    "Arched matte-black headband"
  );
  for (const z of [-13.5, 12.5]) {
    parts.plate(
      bandOutline(85.4, 89.4, 83.9, 87.9),
      1,
      [0, 0, z],
      parts.trim,
      "Headband edge seam",
      0.2
    );
  }
  parts.plate(
    bandOutline(79.8, 83.8, 72.8, 76.8, 0.15 * Math.PI, 0.85 * Math.PI),
    25,
    [0, 0, -12.5],
    parts.microfiber,
    "Microfiber cushion beneath the headband",
    1.2
  );
  for (const side of [-1, 1]) {
    const slider = parts.box(
      [8, 37, 24],
      [side * 82, 128, 0],
      parts.trim,
      "Adjustable headband slider",
      0.8
    );
    slider.rotation.z = side * -0.09;
    parts.box(
      [9, 18, 26],
      [side * 81, 143, 0],
      parts.matte,
      "Headband slider sleeve",
      1
    );
    for (let index = 0; index < 5; index += 1) {
      parts.box(
        [0.3, 0.55, 7],
        [side * 86.1, 118 + index * 3, 0],
        parts.black,
        "Headband adjustment index",
        0.1
      );
    }
    parts.screw([side * 86.3, 139, 0], side === 1 ? "right" : "left", true);
  }
  parts.surfacePrint(
    headbandLabelGeometry(),
    40,
    5,
    [0, 0, 0],
    (context) => {
      context.fillStyle = "#9da1a5";
      context.textAlign = "center";
      context.font = "bold 3.5px Arial";
      context.fillText("SENNHEISER", 20, 3.8);
    },
    "Manufacturer marking following the headband curvature"
  );
  for (const z of [-12.2, 12.2]) {
    const seam = Array.from({ length: 100 }, (_, index) => {
      const angle = Math.PI * (0.16 + (index / 99) * 0.68);
      return new Vector3(75.8 * Math.cos(angle), 136 + 80 * Math.sin(angle), z);
    });
    seam.push(
      ...seam
        .toReversed()
        .map((point) => new Vector3(point.x, point.y + 0.55, point.z))
    );
    parts.piping(seam, 0.28, parts.thread, "Headband cushion edge binding");
  }
}

function createDriver(parts: Hd800sParts, cup: Group) {
  cup.add(
    parts.disc(28, [0, 0, 5], parts.black, "Recessed driver rear cavity")
  );
  cup.add(
    parts.ovalRing(
      [56, 56],
      [28, 28],
      1.8,
      [0, 0, 6.5],
      parts.driver,
      "56 mm ring-radiator transducer",
      0.2
    ),
    parts.cylinder(
      10.5,
      2,
      [0, 0, 8.5],
      parts.driver,
      "Central transducer back plate"
    ),
    parts.disc(8.5, [0, 0, 9.6], parts.trim, "Central absorber cover"),
    parts.ring(13.6, 1.1, [0, 0, 9], parts.matte, "Inner driver basket ring"),
    parts.ring(26.5, 1.2, [0, 0, 9], parts.matte, "Outer driver basket ring")
  );
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const shape = new Shape();
    shape.moveTo(-1.6, 12.7);
    shape.lineTo(1.6, 12.7);
    shape.lineTo(3.2, 17.5);
    shape.lineTo(8, 22.8);
    shape.lineTo(6.2, 26.8);
    shape.lineTo(2.8, 22.2);
    shape.lineTo(-0.8, 18.4);
    shape.closePath();
    const spoke = parts.plate(
      shape,
      1.2,
      [0, 0, 9],
      parts.trim,
      "Swept six-spoke driver basket",
      0.3
    );
    spoke.rotation.z = angle;
    cup.add(spoke);
  }
  cup.add(
    parts.ovalRing(
      [70, 70],
      [57, 57],
      3,
      [0, 0, 12],
      parts.matte,
      "Wide driver grille bezel",
      0.65
    ),
    parts.ring(29, 0.45, [0, 0, 15.15], parts.trim, "Grille retaining lip"),
    parts.ring(
      34.2,
      0.35,
      [0, 0, 15.1],
      parts.trim,
      "Bezel machined outer edge"
    ),
    parts.grille(),
    parts.surfacePrint(
      arcLabelGeometry(32.4, 2.3, Math.PI * 1.02, Math.PI * 1.88),
      87,
      2.3,
      [0, 0, 15.68],
      (context) => {
        context.fillStyle = "#d7d9dc";
        context.textAlign = "center";
        context.font = "2px Arial";
        context.fillText("High Definition Driver  300 Ω", 43.5, 1.85);
      },
      "Curved driver-bezel specification lettering"
    )
  );
  const innerGrille = parts.disc(
    31,
    [0, 0, -7.5],
    parts.acoustic,
    "Inner driver protective mesh"
  );
  cup.add(innerGrille);
}

function createCupFrame(parts: Hd800sParts, cup: Group) {
  cup.add(
    parts.ovalRing(
      [100, 126],
      [82, 108],
      6,
      [0, 0, -2],
      parts.matte,
      "Open elliptical ear-cup perimeter",
      1.5
    ),
    parts.ovalRing(
      [96, 122],
      [91, 116],
      1.5,
      [0, 0, 5],
      parts.trim,
      "Outer ear-cup bevel",
      0.5
    ),
    parts.ovalRing(
      [83, 105],
      [63, 72],
      2,
      [0, 0, 2.5],
      parts.silver,
      "Fine-grooved stainless acoustic baffle",
      0.4
    )
  );
  for (const side of [-1, 1]) {
    const bridge = parts.box(
      [8, 24, 5],
      [side * 24, side * 34, 6],
      parts.matte,
      "Angled bridge across the silver ear-cup opening",
      1
    );
    bridge.rotation.z = -0.55;
    cup.add(bridge);
  }
  const yoke = new Shape();
  yoke.moveTo(-24, 56);
  yoke.lineTo(-17, 83);
  yoke.lineTo(16, 79);
  yoke.quadraticCurveTo(43, 62, 48, 29);
  yoke.lineTo(38, 33);
  yoke.quadraticCurveTo(33, 52, 17, 61);
  yoke.lineTo(-24, 56);
  yoke.closePath();
  cup.add(
    parts.plate(
      yoke,
      6,
      [0, 0, 6],
      parts.matte,
      "Angled upper ear-cup yoke",
      1
    ),
    parts.box(
      [16, 25, 9],
      [41, -30, 7],
      parts.matte,
      "Lower ear-cup pivot block",
      1
    )
  );
  cup.add(
    parts.pad(),
    parts.pile(),
    parts.piping(
      ovalPoints(48.8, 61.8, -12.8),
      0.42,
      parts.thread,
      "Ear-pad outer seam piping"
    ),
    parts.piping(
      ovalPoints(33.3, 44.3, -12.8),
      0.28,
      parts.black,
      "Ear-pad inner edge binding"
    ),
    parts.ovalRing(
      [69, 91],
      [63, 85],
      7,
      [0, 0, -9],
      parts.black,
      "Inner ear-pad lining",
      0.7
    )
  );
  const baffle = ellipticalOutline(63, 85);
  const driverOpening = new Path();
  driverOpening.absarc(0, 0, 28, 0, Math.PI * 2, true);
  baffle.holes.push(driverOpening);
  const inner = parts.plate(
    baffle,
    0.4,
    [0, 0, -1],
    parts.black,
    "Angled inner acoustic baffle",
    0
  );
  inner.rotation.y = 0.14;
  cup.add(inner);
  const stitchCount = 128;
  const stitches = parts.instanced(
    new CylinderGeometry(0.105, 0.105, 1.1, 6),
    parts.thread,
    stitchCount,
    "Individual ear-pad seam stitches"
  );
  const transform = new Matrix4();
  for (let index = 0; index < stitchCount; index += 1) {
    const angle = (index / stitchCount) * Math.PI * 2;
    transform.makeRotationZ(angle);
    transform.setPosition(
      48.5 * Math.cos(angle),
      61.5 * Math.sin(angle),
      -13.1
    );
    stitches.setMatrixAt(index, transform);
  }
  cup.add(stitches);
  createFrameDetails(parts, cup);
}

function createFrameDetails(parts: Hd800sParts, cup: Group) {
  cup.add(
    parts.piping(
      ovalPoints(48.1, 61.1, 0.3),
      0.32,
      parts.black,
      "Housing parting line"
    ),
    parts.piping(
      ovalPoints(45.5, 57.8, 6.3),
      0.26,
      parts.trim,
      "Inset perimeter highlight"
    )
  );
  for (const [x, y] of [
    [-9, 71],
    [10, 69],
    [38, -24],
  ] as const) {
    const head = parts.cylinder(
      1.6,
      0.6,
      [x, y, 12.65],
      parts.trim,
      "Recessed pivot fastener",
      32
    );
    const slot = parts.box(
      [1.8, 0.28, 0.15],
      [x, y, 13.02],
      parts.black,
      "Pivot fastener slot",
      0.06
    );
    cup.add(head, slot);
  }
  for (let index = 0; index < 4; index += 1) {
    cup.add(
      parts.disc(
        0.65,
        [9, 74 - index * 2, 13.03],
        parts.black,
        "Yoke adjustment witness mark"
      )
    );
  }
  const channel = parts.print(
    5,
    5,
    [-7, 69, 13.04],
    (context) => {
      context.fillStyle = "#a5a9ad";
      context.textAlign = "center";
      context.font = "bold 3px Arial";
      context.fillText(cup.name === "Right ear cup" ? "R" : "L", 2.5, 3.7);
    },
    "Left or right channel identification",
    256
  );
  cup.add(channel);
}

function createCupCable(parts: Hd800sParts, cup: Group) {
  const connector = parts.cylinder(
    3.2,
    14,
    [16, -58, 8],
    parts.turned,
    "Detachable cable connector"
  );
  connector.rotation.x = Math.PI;
  for (const y of [-53, -55, -61]) {
    const collar = parts.ring(
      3.2,
      0.22,
      [16, y, 8],
      parts.trim,
      "Connector sleeve circumferential groove"
    );
    collar.rotation.x = Math.PI / 2;
    cup.add(collar);
  }
  const sleeve = parts.cylinder(
    2.8,
    15,
    [16, -72, 8],
    parts.rubber,
    "Cable strain relief"
  );
  sleeve.rotation.x = Math.PI;
  for (let index = 0; index < 6; index += 1) {
    const rib = parts.ring(
      2.8,
      0.28,
      [16, -67 - index * 1.65, 8],
      parts.black,
      "Molded strain-relief rib"
    );
    rib.rotation.x = Math.PI / 2;
    cup.add(rib);
  }
  cup.add(
    connector,
    sleeve,
    parts.cable(
      [
        [16, -79, 8],
        [15, -93, 9],
        [9, -112, 10],
        [4, -129, 12],
      ],
      "Shortened cable for display"
    )
  );
}

function createEarCup(parts: Hd800sParts, side: number) {
  const cup = new Group();
  cup.name = side === 1 ? "Right ear cup" : "Left ear cup";
  createCupFrame(parts, cup);
  createDriver(parts, cup);
  createCupCable(parts, cup);
  const modelName = parts.print(
    28,
    4,
    [0, -44, 6],
    (context) => {
      context.fillStyle = "#c0c4c8";
      context.textAlign = "center";
      context.font = "3px Arial";
      context.fillText("HD 800 S", 14, 3.2);
    },
    "Ear-cup model marking",
    512
  );
  cup.add(modelName);
  cup.position.set(side * 82, 72, 0);
  cup.rotation.set(0.06, side * (Math.PI / 2 - 0.16), side * -0.1);
  parts.root.add(cup);
}

/** Exterior estimated from Sennheiser photos; cables are shortened for display. */
export function createHd800s() {
  const parts = createHd800sParts();
  parts.root.name = "Sennheiser HD 800 S Matte Black — estimated millimetres";
  createHeadband(parts);
  createEarCup(parts, -1);
  createEarCup(parts, 1);
  const bounds = new Box3().setFromObject(parts.root);
  parts.root.position.y = -bounds.min.y;
  return { group: parts.root, dispose: () => parts.dispose() };
}
