import { Group, Path, RingGeometry, Shape } from "three";
import type { SigmaParts } from "./sigma-pro-parts";
import { createSigmaSocket } from "./sigma-pro-sockets";
import {
  SIGMA_REAR,
  sigmaInputs,
  sigmaOutline,
  sigmaPlate,
  sigmaRearGeometry,
} from "./sigma-pro-geometry";

function usbPort(parts: SigmaParts, rear: Group, x: number, y: number) {
  const port = new Group();
  port.name = "Vertical USB-C port with internal tongue and 24 contacts";
  port.position.set(x, y, 0);
  port.rotation.z = Math.PI / 2;
  const surround = sigmaOutline(8.7, 3.35, 1.6);
  surround.holes.push(sigmaOutline(8.1, 2.85, 1.35));
  port.add(
    parts.mesh(
      sigmaPlate(surround, 1.65, 0.045),
      parts.machined,
      [0, 0, 0.1],
      "Open capsule-shaped USB-C metal shell"
    )
  );
  port.add(
    parts.box(
      [6.6, 0.6, 2.8],
      [0, 0, -0.95],
      parts.insulator,
      "USB-C tongue recessed inside socket",
      0.15
    )
  );
  for (let index = 0; index < 12; index += 1) {
    for (const row of [-0.36, 0.36]) {
      port.add(
        parts.box(
          [0.17, 0.06, 1.9],
          [-2.75 + index * 0.5, row, -1],
          parts.plated,
          "USB-C tongue contact",
          0.02
        )
      );
    }
  }
  port.add(
    parts.box(
      [7.9, 2.6, 0.2],
      [0, 0, -2.75],
      parts.cavity,
      "Dark USB-C socket interior",
      1
    )
  );
  rear.add(port);
}

function coaxialPort(parts: SigmaParts, rear: Group, x: number, y: number) {
  const port = new Group();
  port.name = "RCA coaxial digital input";
  port.position.set(x, y, 0.87);
  port.add(
    parts.lathe(
      [
        [6.7, -0.1],
        [6.5, 0.12],
        [4.95, -0.35],
        [4.65, -0.7],
      ],
      [0, 0, 0],
      parts.aluminium,
      "CNC counterbore around the RCA socket"
    )
  );
  const nut = new Shape();
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = Math.PI / 6 + (corner * Math.PI) / 3;
    const px = Math.cos(angle) * 5.25;
    const py = Math.sin(angle) * 5.25;
    if (corner === 0) {
      nut.moveTo(px, py);
    } else {
      nut.lineTo(px, py);
    }
  }
  nut.closePath();
  const bore = new Path();
  bore.absarc(0, 0, 4.1, 0, Math.PI * 2, true);
  nut.holes.push(bore);
  port.add(
    parts.mesh(
      sigmaPlate(nut, 0.5, 0.06),
      parts.plated,
      [0, 0, 0.3],
      "Hexagonal gold-plated RCA retaining nut"
    )
  );
  port.add(
    parts.lathe(
      [
        [4.4, -0.45],
        [4.4, 0.95],
        [4.2, 1.2],
        [2.75, 1.2],
        [2.55, 0.95],
        [2.55, -0.7],
      ],
      [0, 0, 0],
      parts.plated,
      "Hollow RCA outer contact barrel"
    )
  );
  port.add(
    parts.mesh(
      new RingGeometry(2.75, 4.2, 96),
      parts.plated,
      [0, 0, 1.21],
      "RCA gold contact mouth"
    ),
    parts.mesh(
      new RingGeometry(0.9, 2.55, 96),
      parts.insulator,
      [0, 0, 0.5],
      "RCA insulating inner ring"
    ),
    parts.mesh(
      new RingGeometry(0.85, 1.2, 64),
      parts.plated,
      [0, 0, 0.55],
      "RCA centre receptacle"
    ),
    parts.disc(0.85, [0, 0, -2.4], parts.cavity, "Open RCA centre contact")
  );
  rear.add(port);
}

function inputLabels(parts: SigmaParts, rear: Group) {
  for (const [value, x, y, height] of [
    ["5V 2A", -32, 14.3, 0.8],
    ["TYPE-C", -32, 2.3, 0.8],
    ["UAC 2.0", -22.5, 15.6, 0.8],
    ["USB IN", -22.5, 13.8, 0.8],
    ["S/PDIF INPUT", -10.7, 15.6, 0.8],
    ["OPT INPUT", 4.8, 15.6, 0.8],
    ["BAL", 19, 17.6, 0.8],
    ["SE", 32.5, 17.6, 0.8],
    ["DIGITAL INPUT", -9, 1.5, 0.65],
    ["ANALOG INPUT", 25.8, 4.4, 0.8],
  ] as const) {
    rear.add(
      parts.text(
        value,
        height,
        [x, y, 0.88],
        "Solid rear-panel input lettering"
      )
    );
  }
  for (const [x, y, w, h] of [
    [-22, 3.85, 0.1, 0.9],
    [-18, 3.8, 8, 0.1],
    [-0.1, 3.8, 8.8, 0.1],
    [4.8, 3.85, 0.1, 0.9],
    [18.9, 5.95, 0.1, 0.9],
    [20.45, 5.9, 3.1, 0.1],
    [31, 5.9, 3, 0.1],
    [32.5, 5.95, 0.1, 0.9],
  ] as const) {
    rear.add(
      parts.box(
        [w, h, 0.006],
        [x, y, 0.88],
        parts.ink,
        "Solid input-group bracket",
        0
      )
    );
  }
  const lightning = new Shape();
  lightning.moveTo(-31.85, 17.65);
  lightning.lineTo(-32.5, 16.55);
  lightning.lineTo(-31.85, 16.55);
  lightning.lineTo(-32.25, 15.4);
  lightning.lineTo(-31.2, 16.9);
  lightning.lineTo(-31.9, 16.9);
  lightning.closePath();
  rear.add(
    parts.mesh(
      sigmaPlate(lightning, 0.008, 0),
      parts.ink,
      [0, 0, 0.885],
      "Solid charging lightning symbol"
    )
  );
}

export function createSigmaRear(parts: SigmaParts) {
  const rear = new Group();
  rear.name =
    "Digital, analogue and charging inputs aligned to the Questyle brochure";
  rear.position.set(0, 0, SIGMA_REAR + 0.65);
  rear.rotation.y = Math.PI;
  parts.root.add(rear);
  rear.add(
    parts.mesh(
      sigmaRearGeometry(),
      parts.aluminium,
      [0, 10, 0],
      "Rear panel with open input bores"
    )
  );
  for (const input of sigmaInputs) {
    if (input.label === "DC 5V" || input.label === "USB") {
      usbPort(parts, rear, input.x, input.y);
    } else if (input.label === "S/PDIF") {
      coaxialPort(parts, rear, input.x, input.y);
    } else if ("radius" in input) {
      rear.add(
        createSigmaSocket(
          parts,
          input.x,
          input.y,
          0.86,
          input.radius,
          input.bezel,
          input.label,
          input.label === "4.4mm"
        )
      );
    }
  }
  const optical = sigmaOutline(9.6, 8.4, 0.6);
  optical.holes.push(sigmaOutline(7.4, 6.4, 0.35));
  rear.add(
    parts.mesh(
      sigmaPlate(optical, 1.4, 0.06),
      parts.insulator,
      [4.8, 10.3, 0.45],
      "Toslink moulded connector rim"
    ),
    parts.box(
      [7.2, 6.2, 0.25],
      [4.8, 10.3, -0.6],
      parts.rear,
      "Inset spring-loaded optical dust shutter",
      0.15
    ),
    parts.box(
      [5.9, 0.16, 0.25],
      [4.8, 13.2, -0.4],
      parts.machined,
      "Optical shutter hinge",
      0.07
    )
  );
  inputLabels(parts, rear);
}
