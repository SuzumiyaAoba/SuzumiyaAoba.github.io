import { ExtrudeGeometry, MeshPhysicalMaterial, Shape } from "three";
import type { SigmaParts } from "./sigma-pro-parts";
import { SIGMA_BUTTON_X, sigmaOutline, sigmaPlate } from "./sigma-pro-geometry";

function displayGeometry(parts: SigmaParts) {
  const text = (value: string, x: number, y: number, height: number) => {
    const mesh = parts.text(
      value,
      height,
      [-37.8 + x, 19.37, 46.7 + y],
      `OLED vector glyphs: ${value}`,
      parts.screenInk
    );
    mesh.rotation.x = -Math.PI / 2;
  };
  text("31", 7.3, 2.9, 1.1);
  text("H", 12, 2.8, 1);
  text("HP OUT", 17.1, 2.9, 0.85);
  text("100", 27.1, 2.9, 0.85);
  text("768000", 17, 7.4, 3.2);
  text("USB PCM", 17, 11.5, 1.2);
  const polygon = (
    points: readonly (readonly [number, number])[],
    name: string
  ) => {
    const shape = new Shape();
    for (const [index, [x, y]] of points.entries()) {
      if (index === 0) {
        shape.moveTo(x - 17, 7.5 - y);
      } else {
        shape.lineTo(x - 17, 7.5 - y);
      }
    }
    shape.closePath();
    const glyph = parts.mesh(
      new ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: false }),
      parts.screenInk,
      [-20.8, 19.37, 54.2],
      name
    );
    glyph.rotation.x = -Math.PI / 2;
  };
  polygon(
    [
      [4.1, 2.8],
      [4.8, 2.8],
      [5.6, 2.2],
      [5.6, 3.65],
      [4.8, 3.05],
      [4.1, 3.05],
    ],
    "Solid speaker glyph"
  );
  polygon(
    [
      [23.9, 2],
      [23.2, 2.9],
      [23.8, 2.9],
      [23.5, 3.9],
      [24.6, 2.65],
      [24, 2.65],
    ],
    "Solid charging glyph"
  );
  for (const [x, y, w, h] of [
    [11.3, 2.05, 1.4, 0.1],
    [11.3, 3.45, 1.4, 0.1],
    [11.3, 2.05, 0.1, 1.5],
    [12.6, 2.05, 0.1, 1.5],
    [25.4, 2, 3.5, 0.1],
    [25.4, 3.6, 3.5, 0.1],
    [25.4, 2, 0.1, 1.7],
    [28.8, 2, 0.1, 1.7],
    [29, 2.5, 0.3, 0.65],
  ] as const) {
    polygon(
      [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      "OLED status outline segment"
    );
  }
}

export function createSigmaControls(parts: SigmaParts) {
  const frame = sigmaOutline(37.5, 18.8, 2.1);
  frame.holes.push(sigmaOutline(34.8, 16.3, 1.25));
  const bezel = parts.mesh(
    sigmaPlate(frame, 1.15, 0.18),
    parts.aluminium,
    [-20.8, 19.25, 54.2],
    "Deep chamfer around the inset OLED display"
  );
  bezel.rotation.x = -Math.PI / 2;
  parts.box(
    [35.5, 0.65, 16.8],
    [-20.8, 18.8, 54.2],
    parts.cavity,
    "Recessed OLED substrate",
    0.5
  );
  displayGeometry(parts);
  const screenGlass = new MeshPhysicalMaterial({
    color: 0xff_ff_ff,
    transmission: 1,
    thickness: 0.18,
    ior: 1.5,
    roughness: 0.007,
    envMapIntensity: 0.55,
  });
  const pane = parts.mesh(
    sigmaPlate(sigmaOutline(34.3, 15.45, 1.1), 0.18, 0.02),
    screenGlass,
    [-20.8, 19.94, 54.2],
    "Flush glossy OLED glass"
  );
  pane.rotation.x = -Math.PI / 2;
  pane.userData["castShadow"] = false;

  const cap = new MeshPhysicalMaterial({
    color: 0x9f_a6_ab,
    metalness: 1,
    roughness: 0.22,
    envMapIntensity: 1,
  });
  for (const x of SIGMA_BUTTON_X) {
    const seat = parts.lathe(
      [
        [3.55, 0],
        [3.4, 0.15],
        [3.2, -0.35],
        [3.1, -0.6],
      ],
      [x, 20, 57],
      parts.aluminium,
      "Circular CNC button seat"
    );
    seat.rotation.x = 0;
    const button = parts.lathe(
      [
        [0, 0],
        [2.7, 0],
        [2.94, 0.15],
        [3.02, 0.42],
        [2.98, 0.67],
        [2.72, 0.83],
      ],
      [x, 19.48, 57],
      cap,
      "Rounded polished perimeter of the control button"
    );
    button.rotation.x = 0;
    const face = parts.disc(
      2.72,
      [x, 20.31, 57],
      parts.aluminium,
      "Flat anodized control-button face"
    );
    face.rotation.x = -Math.PI / 2;
    const rim = parts.ring(
      2.96,
      0.065,
      [x, 20.1, 57],
      parts.machined,
      "Thin polished edge of button cap"
    );
    rim.rotation.x = -Math.PI / 2;
  }
  for (const [index, label] of [
    "OUTPUT",
    "GAIN",
    "SOURCE",
    "POWER",
  ].entries()) {
    const x = SIGMA_BUTTON_X[index];
    if (x === undefined) {
      continue;
    }
    const lettering = parts.text(
      label,
      0.9,
      [x, 20.13, 64.5],
      "Solid outlines of top-panel control lettering"
    );
    lettering.rotation.x = -Math.PI / 2;
  }
  const wordmark = parts.text(
    "Questyle",
    5.7,
    [19.2, 20.13, 47.4],
    "Questyle wordmark modelled from letter outlines",
    parts.ink,
    "wordmark",
    34.7
  );
  wordmark.rotation.x = -Math.PI / 2;
}
