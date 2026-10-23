import { Box3, CylinderGeometry, Group, Matrix4, Shape, Vector3 } from "three";
import { drawSennheiserWordmark } from "./sennheiser-wordmark";
import { createHd800sParts } from "./hd-800s-parts";
import type { Hd800sParts } from "./hd-800s-parts";
import {
  arcLabelGeometry,
  acousticBaffleGeometry,
  baffleBraceGeometry,
  cableLabelGeometry,
  cupContour,
  cupContourPoints,
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
    bandOutline(100, 82, 95, 77),
    28,
    [0, 0, -14],
    parts.trim,
    "Arched matte-black headband"
  );
  for (const z of [-13.5, 12.5]) {
    parts.plate(
      bandOutline(100.4, 82.4, 98.9, 80.9),
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
  for (const angle of [Math.PI * 0.15, Math.PI * 0.85]) {
    const clip = parts.box(
      [7, 8, 36.8],
      [93 * Math.cos(angle), 136 + 75 * Math.sin(angle), 0],
      parts.trim,
      "Moulded retaining cap at the headband cushion end",
      1.3
    );
    clip.rotation.z = angle - Math.PI / 2;
  }
  for (const side of [-1, 1]) {
    const slider = parts.box(
      [8, 22, 24],
      [side * 97, 142, 0],
      parts.trim,
      "Adjustable headband slider",
      0.8
    );
    slider.rotation.z = side * -0.09;
    parts.box(
      [9, 18, 26],
      [side * 96, 143, 0],
      parts.matte,
      "Headband slider sleeve",
      1
    );
    for (let index = 0; index < 5; index += 1) {
      parts.box(
        [0.3, 0.55, 7],
        [side * 101.1, 134 + index * 3, 0],
        parts.black,
        "Headband adjustment index",
        0.1
      );
    }
  }
  parts.surfacePrint(
    headbandLabelGeometry(),
    40,
    5,
    [0, 0, 0],
    (context) => {
      context.fillStyle = "#9da1a5";
      drawSennheiserWordmark(context);
    },
    "Manufacturer marking following the headband curvature"
  );
  for (const z of [-17.3, 17.3]) {
    const seam = Array.from({ length: 100 }, (_, index) => {
      const angle = Math.PI * (0.16 + (index / 99) * 0.68);
      return new Vector3(91 * Math.cos(angle), 136 + 73 * Math.sin(angle), z);
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
    parts.ovalRing(
      [28, 28],
      [16.4, 16.4],
      0.8,
      [0, 0, 9],
      parts.matte,
      "Flat inner driver basket annulus",
      0.12
    ),
    parts.ovalRing(
      [56.6, 56.6],
      [48.6, 48.6],
      1.2,
      [0, 0, 9],
      parts.matte,
      "Flat outer driver basket annulus",
      0.15
    )
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
    parts.lathe(
      [
        [28.5, 12],
        [34.8, 12],
        [35, 13.7],
        [34.8, 14.8],
        [33.6, 15.7],
        [31, 16.1],
        [29, 16.1],
        [28.5, 15.7],
        [28.5, 12],
      ],
      [0, 0, 0],
      parts.matte,
      "Chamfered driver grille bezel"
    ),
    parts.grille()
  );
  const specification = parts.surfacePrint(
    arcLabelGeometry(32.25, 2.4, Math.PI * 1.12, Math.PI * 1.86, -0.4 / 2.6),
    75,
    2.4,
    [0, 0, 15.93],
    (context) => {
      context.fillStyle = "#d7d9dc";
      context.textAlign = "center";
      context.font = "2.5px Arial";
      const text = "High Definition Driver  300 Ω";
      context.translate(37.5, 0);
      context.scale(69 / context.measureText(text).width, 1);
      context.fillText(text, 0, 2.25);
    },
    "Curved driver-bezel specification lettering"
  );
  specification.scale.x = side;
  driver.add(specification);
  const basket = parts.driver.clone();
  basket.color.setHex(0x27_29_2b);
  basket.metalness = 0.08;
  basket.roughness = 0.78;
  driver.add(
    parts.ovalRing(
      [57, 57],
      [49, 49],
      0.8,
      [0, 0, -5.4],
      basket,
      "Inner driver basket outer ring",
      0.15
    ),
    parts.ovalRing(
      [40, 40],
      [37, 37],
      0.8,
      [0, 0, -5.4],
      basket,
      "Inner driver basket intermediate ring",
      0.15
    ),
    parts.ovalRing(
      [18, 18],
      [7.5, 7.5],
      0.8,
      [0, 0, -5.4],
      basket,
      "Inner driver basket hub with absorber opening",
      0.15
    )
  );
  for (let index = 0; index < 12; index += 1) {
    const shape = new Shape();
    shape.moveTo(-1, 8);
    shape.lineTo(1, 8);
    shape.lineTo(1, 13);
    shape.lineTo(3.8, 18);
    shape.lineTo(3.8, 25);
    shape.lineTo(1.8, 25);
    shape.lineTo(1.8, 19);
    shape.lineTo(-1, 14);
    shape.closePath();
    const spoke = parts.plate(
      shape,
      0.8,
      [0, 0, -5.4],
      basket,
      "Swept twelve-spoke inner driver support",
      0.15
    );
    spoke.rotation.z = (index / 12) * Math.PI * 2;
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
  cup.add(
    parts.cylinder(
      2.1,
      0.5,
      [-9, 71, 7],
      parts.turned,
      "Inner headband-yoke pivot pin"
    )
  );
  const pin = parts.cylinder(
    2.1,
    0.65,
    [-9, 78.6, 11.5],
    parts.turned,
    "Polished headband hinge pin cap"
  );
  pin.rotation.set(0, 0, 0);
  cup.add(pin);
  if (cup.name === "Left ear cup") {
    for (let index = 0; index < 3; index += 1) {
      cup.add(
        parts.lathe(
          [
            [0, 0],
            [0.5, 0],
            [0.46, 0.12],
            [0.25, 0.24],
            [0, 0.27],
          ],
          [17, 73 - index * 2.8, 15.85],
          parts.trim,
          "Three tactile dots identifying the left ear cup"
        )
      );
    }
  }
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
  const connector = parts.lathe(
    [
      [0, -12],
      [2.7, -12],
      [2.7, -10.5],
      [2.95, -10.4],
      [2.95, -2.3],
      [3.1, -2.2],
      [3.1, -1.2],
      [2.85, -1],
      [2.85, 0],
      [0, 0],
    ],
    [0, 0, 0],
    parts.turned,
    "Stepped precision ODU cable connector"
  );
  connector.rotation.x = 0;
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
  const channel = parts.surfacePrint(
    cableLabelGeometry(),
    3,
    4,
    [0, 0, 0],
    (context) => {
      context.fillStyle = "#25282b";
      context.textAlign = "center";
      context.font = "2.8px Arial";
      context.fillText(cup.name.startsWith("Right") ? "R" : "L", 1.5, 3.2);
    },
    "Recessed channel marking on the ODU strain relief"
  );
  channel.scale.x = cup.scale.x;
  cable.add(channel);
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
  // 耳側への傾斜をワールド Z 軸で適用し、ヨークの軸をバンドの付け根へ合わせる。
  cup.rotation.set(0.06, side * (Math.PI / 2 - 0.16), side * -0.27, "ZYX");
  const pivot = new Vector3(-9, 71, 11.5)
    .multiply(cup.scale)
    .applyEuler(cup.rotation);
  cup.position.set(side * 97 - pivot.x, 143 - pivot.y, -pivot.z);
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
