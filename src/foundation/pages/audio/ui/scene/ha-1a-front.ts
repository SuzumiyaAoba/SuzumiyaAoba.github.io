import { PointLight, SphereGeometry } from "three";
import {
  HA1A_FRONT,
  HA1A_WINDOW_RADIUS,
  HA1A_WINDOW_Y,
  ha1aFrontGeometry,
} from "./ha-1a-geometry";
import type { Ha1aParts } from "./ha-1a-parts";
import { createHa1aKnob } from "./ha-1a-knobs";

function tube(
  parts: Ha1aParts,
  x: number,
  z: number,
  height: number,
  name: string
) {
  const baseY = 127;
  const radius = 8.5;
  const socket = parts.cylinder(
    10.5,
    4,
    [x, baseY, z],
    parts.rubber,
    `${name} ceramic socket`
  );
  socket.rotation.x = 0;
  const bulb = parts.lathe(
    [
      [0, 0],
      [radius - 1, 0],
      [radius, 2],
      [radius, height - 8],
      [radius - 0.6, height - 5],
      [radius - 3, height - 2],
      [1.2, height],
      [0, height + 1.2],
    ],
    [x, baseY + 2, z],
    parts.tubeGlass,
    `${name} glass envelope`
  );
  bulb.rotation.x = 0;
  const getter = parts.cylinder(
    7.6,
    1,
    [x, baseY + height - 3, z],
    parts.steel,
    `${name} silver getter`
  );
  getter.rotation.x = 0;
  for (const offset of [-3.2, 3.2]) {
    parts.box(
      [4.8, height - 20, 6.4],
      [x + offset, baseY + height / 2 + 3, z],
      parts.rubber,
      `${name} anode plate`,
      0.5
    );
    parts.box(
      [0.4, height - 9, 0.4],
      [x + offset, baseY + height / 2, z + 3.8],
      parts.steel,
      `${name} support rod`,
      0.04
    );
    parts.box(
      [0.5, 4, 0.5],
      [x + offset, baseY + 7, z + 3.9],
      parts.filament,
      `${name} illuminated heater`,
      0.05
    );
    parts.box(
      [0.4, 3, 0.4],
      [x + offset, baseY + height - 10, z + 3.7],
      parts.glow,
      `${name} upper heater`,
      0.05
    );
  }
  for (const y of [baseY + 5, baseY + height - 8]) {
    const mica = parts.cylinder(
      7.6,
      0.5,
      [x, y, z],
      parts.steel,
      `${name} mica support`
    );
    mica.rotation.x = 0;
  }
  const heater = parts.ring(
    5.6,
    0.65,
    [x, baseY + 5.8, z],
    parts.glow,
    `${name} warm heater reflection`
  );
  heater.rotation.x = -Math.PI / 2;
  const warmGlass = parts.cylinder(
    7.6,
    2.4,
    [x, baseY + 3, z],
    parts.glow,
    `${name} glowing heater base`
  );
  warmGlass.rotation.x = 0;
  const tip = parts.mesh(
    new SphereGeometry(1, 12, 8),
    parts.tubeGlass,
    [x, baseY + height + 3, z],
    `${name} glass tip`
  );
  tip.scale.y = 1.8;
}

function window(parts: Ha1aParts) {
  parts.lathe(
    [
      [HA1A_WINDOW_RADIUS, -5],
      [HA1A_WINDOW_RADIUS, 0],
      [38, 0.4],
      [38, 1.8],
      [35.5, 3],
      [32.5, 1.8],
      [32.5, -5],
    ],
    [0, HA1A_WINDOW_Y, HA1A_FRONT],
    parts.turned,
    "Machined circular tube-window bezel"
  );
  parts.lathe(
    [
      [32.4, 0],
      [32.4, -12],
      [34.2, -12],
      [34.2, 0],
    ],
    [0, HA1A_WINDOW_Y, HA1A_FRONT - 4],
    parts.rubber,
    "Recessed tube-window lining"
  );
  parts.disc(
    32.3,
    [0, HA1A_WINDOW_Y, HA1A_FRONT + 1.6],
    parts.windowGlass,
    "Protective tube-window glass"
  );
  tube(parts, -19, 109, 44, "Left 12AU7");
  tube(parts, 19, 109, 44, "Right 12AU7");
  tube(parts, -21, 59, 68, "Left EL84EH");
  tube(parts, 21, 59, 68, "Right EL84EH");
  tube(parts, 0, 13, 65, "12DT5 regulator");
  parts.box(
    [108, 2, 148],
    [0, 123, 58],
    parts.rubber,
    "Internal tube mounting deck",
    0.3
  );
  parts.box(
    [111, 202, 1],
    [0, 111, -7],
    parts.cavity,
    "Dark internal transformer partition",
    0.3
  );
  for (const x of [-55, 55]) {
    parts.box(
      [1, 88, 145],
      [x, 168, 63],
      parts.cavity,
      "Dark internal side lining",
      0.1
    );
  }
  const heaterLight = new PointLight(0xff_4b_0b, 6500, 115, 2);
  heaterLight.position.set(0, 133, 105);
  parts.root.add(heaterLight);
}

function frontMarkings(parts: Ha1aParts) {
  parts.print(
    116,
    200,
    [0, 111, HA1A_FRONT + 0.19],
    (context) => {
      context.fillStyle = "#252629";
      context.textAlign = "center";
      const text = (value: string, x: number, y: number, size = 2.15) => {
        context.font = `${size}px Arial`;
        context.fillText(value, 58 + x, 100 - (y - 111));
      };
      context.font = "italic 8px 'Brush Script MT', 'Apple Chancery', cursive";
      context.fillText("Cayin", 58, 9);
      text("®", 14, 204, 2);
      text("VOLUME", 0, 112);
      text("MIN", -12.5, 87, 1.8);
      text("MAX", 12.5, 87, 1.8);
      text("CD • AUX", -36, 83, 1.9);
      text("INPUT", -36, 54, 2);
      text("SELECTOR", -36, 51, 2);
      text("IMPEDANCE", 36, 54, 2);
      text("SELECTOR", 36, 51, 2);
      for (const [value, x, y] of [
        ["8–32Ω", 22, 78],
        ["33–64Ω", 25, 83],
        ["65–150Ω", 36, 87],
        ["151–300Ω", 48, 83],
        ["600Ω", 51, 78],
      ] as const) {
        text(value, x, y, 1.65);
      }
      text("POWER", 0, 42, 2);
      text("ON • OFF", 0, 20, 1.9);
      text("PHONES A", -36, 20, 1.85);
      text("PHONES B", 36, 20, 1.85);
      text("VACUUM TUBE HEADPHONE AMPLIFIER HA-1A MK2", 0, 12, 2.1);
    },
    "Cayin front-panel labels and control scales"
  );
}

export function createHa1aFront(parts: Ha1aParts) {
  parts.mesh(
    ha1aFrontGeometry(),
    parts.aluminium,
    [0, 111, HA1A_FRONT - 4.78],
    "Brushed front panel with open tube window and headphone sockets"
  );
  window(parts);
  createHa1aKnob(parts, 0, 99, 10, (-Math.PI * 2) / 3, "Volume control");
  createHa1aKnob(parts, -36, 69, 8, Math.PI / 2, "CD / AUX input selector");
  createHa1aKnob(
    parts,
    36,
    69,
    8,
    Math.PI / 3,
    "Five-position impedance selector"
  );
  for (const x of [-36, 36]) {
    parts.lathe(
      [
        [4.5, -3],
        [4.5, 0.3],
        [5.2, 0.3],
        [5.2, 0.7],
        [3.2, 0.7],
        [3.2, -5],
      ],
      [x, 31, HA1A_FRONT],
      parts.steel,
      `6.35 mm PHONES ${x < 0 ? "A" : "B"} socket`
    );
    parts.disc(
      3.2,
      [x, 31, HA1A_FRONT - 4],
      parts.cavity,
      "Recessed headphone socket interior"
    );
    parts.box(
      [0.45, 1.5, 1.4],
      [x + 2.7, 31, HA1A_FRONT - 2],
      parts.gold,
      "Headphone socket spring contact",
      0.08
    );
  }
  parts.cylinder(
    6.3,
    0.7,
    [0, 31, HA1A_FRONT + 0.4],
    parts.steel,
    "Power switch mounting ring"
  );
  parts.ring(
    5.1,
    0.45,
    [0, 31, HA1A_FRONT + 0.9],
    parts.turned,
    "Polished power-switch rim"
  );
  parts.cylinder(
    4.6,
    0.6,
    [0, 31, HA1A_FRONT + 0.9],
    parts.turned,
    "Power push button"
  );
  parts.disc(
    0.7,
    [0, 37.3, HA1A_FRONT + 0.4],
    parts.blue,
    "Power status indicator"
  );
  frontMarkings(parts);
}
