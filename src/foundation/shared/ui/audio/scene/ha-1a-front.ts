import { PointLight, RingGeometry } from "three";
import { createHa1aTubes } from "./ha-1a-tubes";
import { createCayinWordmark } from "./cayin-wordmark";
import {
  HA1A_FRONT,
  HA1A_WINDOW_RADIUS,
  HA1A_WINDOW_Y,
  ha1aFrontGeometry,
} from "./ha-1a-geometry";
import type { Ha1aParts } from "./ha-1a-parts";
import { createHa1aKnob } from "./ha-1a-knobs";

function window(parts: Ha1aParts) {
  parts.lathe(
    [
      [HA1A_WINDOW_RADIUS, -5],
      [HA1A_WINDOW_RADIUS, -0.2],
      [37.6, -0.2],
      [38, 0.2],
      [38, 0.9],
      [37.5, 1.3],
    ],
    [0, HA1A_WINDOW_Y, HA1A_FRONT],
    parts.turned,
    "Machined circular tube-window bezel"
  );
  parts.mesh(
    new RingGeometry(33, 37.5, 128),
    parts.knobFace,
    [0, HA1A_WINDOW_Y, HA1A_FRONT + 1.3],
    "Flat radially machined tube-window bezel face"
  );
  parts.lathe(
    [
      [33, 1.3],
      [32.5, 0.7],
      [32.5, -5],
    ],
    [0, HA1A_WINDOW_Y, HA1A_FRONT],
    parts.turned,
    "Polished inner bevel of the tube window"
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
  const glass = parts.disc(
    32.3,
    [0, HA1A_WINDOW_Y, HA1A_FRONT - 0.8],
    parts.windowGlass,
    "Protective tube-window glass"
  );
  glass.userData["castShadow"] = false;
  createHa1aTubes(parts);
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
  const heaterLight = new PointLight(0xff_5b_14, 450, 85, 2);
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
        [5.5, -3],
        [5.5, 0.3],
        [5.8, 0.5],
        [5.6, 0.9],
        [4.8, 0.9],
        [4.8, -8],
      ],
      [x, 31, HA1A_FRONT],
      parts.steel,
      `6.35 mm PHONES ${x < 0 ? "A" : "B"} socket`
    );
    parts.lathe(
      [
        [4.8, -10],
        [4.8, 0.75],
        [3.45, 0.75],
        [3.175, 0.2],
        [3.175, -11.9],
      ],
      [x, 31, HA1A_FRONT],
      parts.black,
      "Neutrik headphone-jack insulating sleeve"
    );
    parts.disc(
      3.2,
      [x, 31, HA1A_FRONT - 12],
      parts.cavity,
      "Recessed headphone socket interior"
    );
    parts.box(
      [0.3, 1.5, 3],
      [x + 2.95, 31, HA1A_FRONT - 6],
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
  parts.lathe(
    [
      [0, -0.3],
      [4.6, -0.3],
      [4.6, 0.3],
      [4.55, 0.35],
    ],
    [0, 31, HA1A_FRONT + 0.9],
    parts.turned,
    "Power push button"
  );
  parts.disc(
    4.55,
    [0, 31, HA1A_FRONT + 1.25],
    parts.knobFace,
    "Radially machined power-button face"
  );
  parts.disc(
    0.7,
    [0, 47.5, HA1A_FRONT + 0.4],
    parts.blue,
    "Power status indicator"
  );
  createCayinWordmark(parts, [0, 205, HA1A_FRONT + 0.2]);
  frontMarkings(parts);
}
