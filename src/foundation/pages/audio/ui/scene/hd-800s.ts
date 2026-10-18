import {
  Box3,
  CylinderGeometry,
  Group,
  Matrix4,
  Path,
  Shape,
  Vector3,
} from "three";
import { createHd800sParts } from "./hd-800s-parts";
import type { Hd800sParts } from "./hd-800s-parts";
import {
  arcLabelGeometry,
  acousticBaffleGeometry,
  baffleBraceGeometry,
  cupContour,
  cupContourPoints,
  cupOutline,
  hd800sDriver,
  headbandCushionGeometry,
  headbandLabelGeometry,
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
  parts.mesh(
    headbandCushionGeometry(),
    parts.microfiber,
    [0, 0, 0],
    "Rounded microfiber cushion beneath the headband"
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
    const hinge = parts.cylinder(
      2.6,
      16,
      [side * 89, 145, 0],
      parts.trim,
      "Headband-to-yoke swivel axle"
    );
    hinge.rotation.y = Math.PI / 2;
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

function createDriver(parts: Hd800sParts, cup: Group, side: number) {
  const driver = new Group();
  driver.name = "Angled ring-radiator assembly";
  driver.position.set(hd800sDriver.x, hd800sDriver.y, 0);
  driver.rotation.y = hd800sDriver.tilt;
  cup.add(driver);
  driver.add(
    parts.cylinder(28, 5, [0, 0, 2.5], parts.black, "Driver acoustic chamber")
  );
  driver.add(
    parts.disc(28, [0, 0, 5], parts.black, "Recessed driver rear cavity")
  );
  driver.add(
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
      8.2,
      2,
      [0, 0, 8.5],
      parts.driver,
      "Central transducer back plate"
    ),
    parts.disc(
      8,
      [0, 0, 9.6],
      parts.driver,
      "Central transducer back plate face"
    ),
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
    driver.add(spoke);
  }
  driver.add(
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
    parts.grille()
  );
  const specification = parts.surfacePrint(
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
  );
  specification.scale.x = side;
  driver.add(specification);
  driver.add(
    parts.ring(22.5, 1.25, [0, 0, -5], parts.trim, "Inner driver basket rim"),
    parts.ovalRing(
      [24, 24],
      [14, 14],
      0.8,
      [0, 0, -5],
      parts.trim,
      "Inner driver basket hub",
      0.15
    )
  );
  for (let index = 0; index < 6; index += 1) {
    const spoke = parts.box(
      [2, 13, 1],
      [0, 17.5, -5],
      parts.trim,
      "Inner driver basket spoke",
      0.25
    );
    const angle = (index / 6) * Math.PI * 2;
    spoke.position.set(-17.5 * Math.sin(angle), 17.5 * Math.cos(angle), -5);
    spoke.rotation.z = angle;
    driver.add(spoke);
  }
  const innerGrille = parts.disc(
    31,
    [0, 0, -7.5],
    parts.acoustic,
    "Inner driver protective mesh"
  );
  innerGrille.rotation.y = Math.PI;
  driver.add(innerGrille);
}

function createCupFrame(parts: Hd800sParts, cup: Group) {
  cup.add(
    parts.housingRing(
      0,
      6.5,
      6,
      -3,
      parts.matte,
      "Swept ear-cup perimeter",
      1.1
    ),
    parts.housingRing(1, 3.2, 1.5, 3.8, parts.trim, "Outer ear-cup bevel", 0.5),
    parts.mesh(
      acousticBaffleGeometry(),
      parts.silver,
      [0, 0, 0],
      "Sloping stainless-steel acoustic mesh baffle"
    )
  );
  for (const angle of [0.3, 0.68, 1.18, 1.68]) {
    cup.add(
      parts.mesh(
        baffleBraceGeometry(angle * Math.PI),
        parts.matte,
        [0, 0, 0],
        "Radial brace joining the bezel to the housing"
      )
    );
  }
  const yoke = new Shape();
  yoke.moveTo(-15, 58);
  yoke.lineTo(-16, 78);
  yoke.quadraticCurveTo(3, 80, 22, 69);
  yoke.bezierCurveTo(48, 55, 59, 25, 54, -7);
  yoke.quadraticCurveTo(52, -29, 43, -41);
  yoke.lineTo(34, -35);
  yoke.bezierCurveTo(48, -13, 50, 15, 40, 37);
  yoke.quadraticCurveTo(29, 61, 10, 62);
  yoke.lineTo(-15, 58);
  yoke.closePath();
  cup.add(
    parts.plate(
      yoke,
      7,
      [0, 0, 8],
      parts.matte,
      "Continuous curved single-sided ear-cup yoke",
      0.8
    ),
    parts.box(
      [15, 21, 14],
      [38, -34, 12],
      parts.matte,
      "Lower yoke pivot and cable socket housing",
      1
    )
  );
  cup.add(
    parts.pad(),
    parts.pile(),
    parts.piping(
      cupContourPoints(0.9, -11.5),
      0.42,
      parts.thread,
      "Ear-pad outer seam piping"
    ),
    parts.piping(
      cupContourPoints(16.7, -11.5),
      0.28,
      parts.black,
      "Ear-pad inner edge binding"
    ),
    parts.housingRing(
      16,
      18.5,
      8,
      -11,
      parts.black,
      "Inner ear-pad lining",
      0.7
    )
  );
  const innerBaffle = cupOutline(16);
  const driverOpening = new Path();
  driverOpening.absarc(
    hd800sDriver.x,
    hd800sDriver.y,
    28.5,
    0,
    Math.PI * 2,
    true
  );
  innerBaffle.holes.push(driverOpening);
  cup.add(
    parts.plate(
      innerBaffle,
      0.8,
      [0, 0, -6.5],
      parts.black,
      "Recessed inner baffle surrounding the driver opening",
      0.2
    )
  );
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
    const point = cupContour(angle, 1.2, -11.8);
    const tangent = cupContour(angle + 0.01, 1.2).sub(point.clone().setZ(0));
    transform.makeRotationZ(Math.atan2(tangent.y, tangent.x) - Math.PI / 2);
    transform.setPosition(point);
    stitches.setMatrixAt(index, transform);
  }
  cup.add(stitches);
  createFrameDetails(parts, cup);
}

function createFrameDetails(parts: Hd800sParts, cup: Group) {
  cup.add(
    parts.piping(
      cupContourPoints(0.9, -0.4),
      0.32,
      parts.black,
      "Housing parting line"
    ),
    parts.piping(
      cupContourPoints(4.4, 4.9),
      0.26,
      parts.trim,
      "Inset perimeter highlight"
    )
  );
  for (const [x, y, z] of [
    [-9, 71, 15.9],
    [10, 69, 15.9],
    [38, -30, 19.4],
  ] as const) {
    const head = parts.cylinder(
      1.6,
      0.6,
      [x, y, z],
      parts.trim,
      "Recessed pivot fastener",
      32
    );
    const slot = parts.box(
      [1.8, 0.28, 0.15],
      [x, y, z + 0.37],
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
        [17, 73 - index * 2, 15.85],
        parts.black,
        "Yoke adjustment witness mark"
      )
    );
  }
  const channel = parts.print(
    5,
    5,
    [-1, 70, 15.85],
    (context) => {
      context.fillStyle = "#a5a9ad";
      context.textAlign = "center";
      context.font = "bold 3px Arial";
      context.fillText(cup.name === "Right ear cup" ? "R" : "L", 2.5, 3.7);
    },
    "Left or right channel identification",
    256
  );
  channel.scale.x = cup.scale.x;
  cup.add(channel);
}

function createCupCable(parts: Hd800sParts, cup: Group) {
  const cable = new Group();
  cable.name = "Angled detachable ODU cable assembly";
  cable.position.set(34, -43, 14);
  cable.rotation.z = -0.28;
  cup.add(cable);
  const socket = parts.ring(
    3.25,
    0.5,
    [0, 0, 0],
    parts.black,
    "Recessed cable socket rim"
  );
  socket.rotation.x = Math.PI / 2;
  cable.add(socket);
  const connector = parts.cylinder(
    2.9,
    12,
    [0, -6, 0],
    parts.turned,
    "Detachable cable connector"
  );
  connector.rotation.x = 0;
  for (const y of [-1.3, -2.5, -10.7]) {
    const collar = parts.ring(
      2.91,
      0.16,
      [0, y, 0],
      parts.trim,
      "Connector sleeve circumferential groove"
    );
    collar.rotation.x = Math.PI / 2;
    cable.add(collar);
  }
  const sleeve = parts.lathe(
    [
      [1.5, -28],
      [1.65, -25],
      [2.25, -18],
      [2.7, -13],
      [2.7, -12],
    ],
    [0, 0, 0],
    parts.rubber,
    "Smooth tapered cable strain relief"
  );
  sleeve.rotation.x = 0;
  cable.add(
    connector,
    sleeve,
    parts.cable(
      [
        [0, -28, 0],
        [-0.6, -43, 0],
        [-4, -66, 1],
        [-8, -90, 2],
      ],
      "Shortened cable for display"
    )
  );
  const exit = new Group();
  exit.name = `HD 800 S ${cup.name.startsWith("Right") ? "Right" : "Left"} cable exit`;
  exit.position.set(-8, -90, 2);
  exit.quaternion.setFromUnitVectors(
    new Vector3(0, 0, 1),
    new Vector3(-4, -24, 1).normalize()
  );
  cable.add(exit);
}

function createEarCup(parts: Hd800sParts, side: number) {
  const cup = new Group();
  cup.name = side === 1 ? "Right ear cup" : "Left ear cup";
  cup.scale.x = side;
  createCupFrame(parts, cup);
  createDriver(parts, cup, side);
  createCupCable(parts, cup);
  const modelName = parts.print(
    28,
    4,
    [1, 76, 15.9],
    (context) => {
      context.fillStyle = "#c0c4c8";
      context.textAlign = "center";
      context.font = "2px Arial";
      context.fillText("HD 800 S", 14, 3);
    },
    "Ear-cup model marking",
    512
  );
  modelName.scale.x = side;
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
  return {
    group: parts.root,
    updateDetail: parts.updateDetail,
    dispose: () => parts.dispose(),
  };
}
