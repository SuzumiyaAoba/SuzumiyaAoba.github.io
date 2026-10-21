import { Group, MeshStandardMaterial } from "three";
import { ha1aRearGeometry } from "./ha-1a-geometry";
import type { Ha1aParts } from "./ha-1a-parts";

function rca(
  parts: Ha1aParts,
  x: number,
  y: number,
  right: boolean,
  name: string
) {
  const insulator = new MeshStandardMaterial({
    color: right ? 0xac_22_22 : 0xe6_e1_d6,
    roughness: 0.65,
  });
  parts.cylinder(6, 1.2, [x, y, 0.8], parts.steel, `${name} mounting washer`);
  parts.lathe(
    [
      [4.8, 0],
      [4.8, 6.5],
      [4.3, 7.2],
      [3.2, 7.2],
      [3.2, 0],
    ],
    [x, y, 1.5],
    parts.gold,
    `${name} gold-plated RCA socket`
  );
  parts.cylinder(3.2, 0.6, [x, y, 8.5], insulator, `${name} channel insulator`);
  parts.disc(1.45, [x, y, 8.84], parts.cavity, `${name} centre socket`);
  parts.ring(1.6, 0.18, [x, y, 8.88], parts.gold, `${name} centre contact`);
}

function powerInlet(parts: Ha1aParts) {
  // Four separate sides keep the IEC socket recess open.
  parts.box(
    [35, 3, 3],
    [0, 130, 1.5],
    parts.rubber,
    "IEC inlet upper flange",
    0.6
  );
  parts.box(
    [35, 5, 3],
    [0, 104, 1.5],
    parts.rubber,
    "IEC inlet fuse-drawer flange",
    0.6
  );
  for (const x of [-16, 16]) {
    parts.box(
      [3, 24, 3],
      [x, 118, 1.5],
      parts.rubber,
      "IEC inlet side flange",
      0.5
    );
  }
  parts.box(
    [29, 24, 1],
    [0, 118, -8],
    parts.cavity,
    "IEC inlet deep cavity",
    0.8
  );
  for (const [x, y] of [
    [-7, 117],
    [7, 117],
    [0, 123],
  ] as const) {
    parts.box(
      [2, 3.2, 7],
      [x, y, -3.2],
      parts.steel,
      "IEC C14 power-inlet contact",
      0.1
    );
  }
  parts.box(
    [21, 3.2, 0.5],
    [0, 103.7, 3.1],
    parts.charcoal,
    "IEC inlet replaceable fuse drawer",
    0.2
  );
  const red = new MeshStandardMaterial({ color: 0xb5_24_24, roughness: 0.6 });
  parts.box(
    [6, 15, 1.5],
    [-32, 123, 0.8],
    parts.rubber,
    "AC voltage selector housing",
    0.4
  );
  parts.box([4, 6, 1], [-32, 125.5, 1.9], red, "Red AC voltage selector", 0.1);
  parts.screw([-21, 117, 1], "front", true);
  parts.screw([21, 117, 1], "front", true);
}

function rearMarkings(parts: Ha1aParts) {
  parts.print(
    105,
    196,
    [0, 111, 0.3],
    (context) => {
      context.fillStyle = "#c5c7c9";
      context.strokeStyle = "#9b9da0";
      context.lineWidth = 0.3;
      context.textAlign = "center";
      const text = (value: string, x: number, y: number, size = 2.2) => {
        context.font = `${size}px Arial`;
        context.fillText(value, 52.5 + x, 98 - (y - 111));
      };
      text("INPUT", -16, 198);
      text("OUTPUT", 30, 198);
      text("CD", -29, 189);
      text("AUX", -7, 189);
      text("PRE-OUT", 30, 189);
      text("L", -44, 179);
      text("R", -44, 156);
      text("STEREO SOURCE", -9, 143, 1.8);
      context.strokeRect(13.5, 16, 48, 55);
      context.strokeRect(71.5, 16, 23, 55);
      text("AC INPUT", 0, 140);
      text("AC VOLTAGE", -32, 111, 1.4);
      text("65 W", 0, 97);
      text("VACUUM TUBE HEADPHONE AMPLIFIER", 0, 87, 2);
      text("MODEL: HA-1A MK2", 0, 82, 2.4);
      text("CAUTION", 0, 74, 2.2);
      text("RISK OF ELECTRIC SHOCK", 0, 70, 1.6);
      text("DO NOT OPEN", 0, 66, 1.6);
      text("ZHUHAI SPARK ELECTRONIC EQUIPMENT CO., LTD.", 0, 13, 1.75);
    },
    "Rear input, output and model identification labels"
  );
}

export function createHa1aRear(parts: Ha1aParts) {
  const start = parts.root.children.length;
  parts.mesh(
    ha1aRearGeometry(),
    parts.charcoal,
    [0, 111, -1.7],
    "Rear panel with ventilation slots and open IEC inlet"
  );
  for (const [x, name] of [
    [-29, "CD"],
    [-7, "AUX"],
    [30, "PRE-OUT"],
  ] as const) {
    rca(parts, x, 180, false, `${name} left`);
    rca(parts, x, 157, true, `${name} right`);
  }
  powerInlet(parts);
  rearMarkings(parts);
  for (const x of [-48, 48]) {
    for (const y of [20, 202]) {
      parts.screw([x, y, 0.2], "front", true);
    }
  }
  const rear = new Group();
  rear.name = "Rear connection panel";
  for (const child of parts.root.children.slice(start)) {
    rear.add(child);
  }
  rear.rotation.y = Math.PI;
  rear.position.z = -141.5;
  parts.root.add(rear);
}
