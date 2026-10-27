import {
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Path,
  PointLight,
  Shape,
  TubeGeometry,
  Vector3,
} from "three";
import type { Ha1aParts } from "./ha-1a-parts";

const BASE = 127;

function micaGeometry(radius: number) {
  const mica = new Shape();
  for (let step = 0; step <= 144; step += 1) {
    const angle = (step / 144) * Math.PI * 2;
    const edge = radius * (0.94 + 0.045 * Math.cos(angle * 9));
    if (step === 0) {
      mica.moveTo(Math.cos(angle) * edge, Math.sin(angle) * edge);
    } else {
      mica.lineTo(Math.cos(angle) * edge, Math.sin(angle) * edge);
    }
  }
  mica.closePath();
  for (const x of [-3.4, 3.4]) {
    const aperture = new Path();
    aperture.moveTo(x - 2.5, -2.7);
    aperture.lineTo(x - 2.5, 2.7);
    aperture.lineTo(x + 2.5, 2.7);
    aperture.lineTo(x + 2.5, -2.7);
    aperture.closePath();
    mica.holes.push(aperture);
  }
  return new ExtrudeGeometry(mica, {
    depth: 0.3,
    bevelEnabled: false,
    curveSegments: 24,
  });
}

function tube(
  parts: Ha1aParts,
  x: number,
  z: number,
  height: number,
  radius: number,
  name: string
) {
  const ceramic = new MeshStandardMaterial({
    color: 0x92_88_74,
    roughness: 0.86,
  });
  const plates = new MeshStandardMaterial({
    color: 0x43_45_43,
    metalness: 0.68,
    roughness: 0.53,
  });
  const mica = new MeshStandardMaterial({
    color: 0xae_a5_8a,
    metalness: 0.1,
    roughness: 0.79,
  });
  const getter = new MeshStandardMaterial({
    color: 0x55_5b_5e,
    metalness: 1,
    roughness: 0.17,
  });
  const socket = parts.cylinder(
    radius + 1,
    3.2,
    [x, BASE - 0.4, z],
    ceramic,
    `${name} ceramic valve socket`
  );
  socket.rotation.x = 0;
  const glassBase = BASE + 2;
  const envelope = parts.lathe(
    [
      [0, 0],
      [radius - 0.8, 0],
      [radius - 0.1, 1],
      [radius, 3],
      [radius, height - 7],
      [radius - 0.5, height - 4],
      [radius - 2, height - 2],
      [radius - 4.5, height - 0.5],
      [1.25, height],
      [0.85, height + 1.3],
      [0.45, height + 2],
      [0, height + 2.2],
    ],
    [x, glassBase, z],
    parts.tubeGlass,
    `${name} rounded glass envelope and evacuation tip`
  );
  envelope.rotation.x = 0;
  envelope.userData["castShadow"] = false;
  const mirror = parts.lathe(
    [
      [radius - 0.35, height - 8],
      [radius - 0.35, height - 7],
      [radius - 0.9, height - 4],
      [radius - 2.4, height - 2],
      [radius - 4.8, height - 0.8],
      [1.2, height - 0.25],
    ],
    [x, glassBase, z],
    getter,
    `${name} silver getter deposit following the glass shoulder`
  );
  mirror.rotation.x = 0;

  const plateHeight = height - 18;
  const plateY = glassBase + 8 + plateHeight / 2;
  for (const dx of [-3.4, 3.4]) {
    for (const dz of [-2.8, 2.8]) {
      parts.box(
        [5.2, plateHeight, 0.35],
        [x + dx, plateY, z + dz],
        plates,
        `${name} folded nickel anode plate`,
        0.09
      );
      for (const side of [-1, 1]) {
        parts.box(
          [0.45, plateHeight - 2, 0.6],
          [x + dx + side * 2.05, plateY, z + dz + Math.sign(dz) * 0.22],
          plates,
          `${name} anode reinforcing fold`,
          0.05
        );
      }
    }
    for (const side of [-1, 1]) {
      parts.box(
        [0.3, plateHeight, 5.5],
        [x + dx + side * 2.4, plateY, z],
        plates,
        `${name} anode channel side`,
        0.04
      );
    }
    parts.box(
      [0.3, height - 7, 0.3],
      [x + dx, glassBase + height / 2, z + 3.7],
      parts.steel,
      `${name} electrode support rod`,
      0.04
    );
    for (const elevation of [4.2, height - 8.5]) {
      const heater = new CatmullRomCurve3([
        new Vector3(x + dx - 0.7, glassBase + elevation + 1.2, z + 0.6),
        new Vector3(x + dx - 0.4, glassBase + elevation, z + 1),
        new Vector3(x + dx + 0.4, glassBase + elevation, z + 1),
        new Vector3(x + dx + 0.7, glassBase + elevation + 1.2, z + 0.6),
      ]);
      parts.mesh(
        new TubeGeometry(heater, 16, 0.13, 6, false),
        parts.filament,
        [0, 0, 0],
        `${name} small glowing U-shaped heater`
      );
    }
  }
  const support = micaGeometry(radius - 0.5);
  for (const y of [glassBase + 6, glassBase + height - 9]) {
    const disc = parts.mesh(
      support,
      mica,
      [x, y, z],
      `${name} scalloped mica support with electrode apertures`
    );
    disc.rotation.x = -Math.PI / 2;
  }
  for (let pin = 0; pin < 9; pin += 1) {
    const angle = (pin / 9) * Math.PI * 2;
    const dx = Math.cos(angle) * 6.4;
    const dz = Math.sin(angle) * 6.4;
    const contact = parts.cylinder(
      0.36,
      4.6,
      [x + dx, BASE + 2, z + dz],
      parts.steel,
      `${name} glass-sealed lead and socket pin`,
      16
    );
    contact.rotation.x = 0;
  }
  const lettering = parts.print(
    13,
    8,
    [0, 0, 0],
    (context) => {
      context.fillStyle = "#c4bea9";
      context.font = "1.7px Arial";
      context.textAlign = "center";
      context.fillText(
        name.includes("EL84")
          ? "EL84EH"
          : name.includes("12AU7")
            ? "12AU7"
            : "12DT5",
        6.5,
        3.4
      );
      context.font = "1.1px Arial";
      if (name.includes("EL84")) {
        context.fillText("Electro-Harmonix", 6.5, 5.3);
      }
    },
    `${name} valve identification`,
    512
  );
  lettering.removeFromParent();
  lettering.material.transparent = false;
  lettering.material.alphaTest = 0.3;
  lettering.material.depthWrite = true;
  const print = parts.mesh(
    new CylinderGeometry(
      radius + 0.015,
      radius + 0.015,
      8,
      48,
      1,
      true,
      -0.65,
      1.3
    ),
    lettering.material,
    [x, glassBase + height - 15, z],
    `${name} curved glass identification print`
  );
  print.userData["castShadow"] = false;
}

export function createHa1aTubes(parts: Ha1aParts) {
  tube(parts, -19, 109, 44, 9.5, "Left 12AU7");
  tube(parts, 19, 109, 44, 9.5, "Right 12AU7");
  tube(parts, -21, 59, 68, 10.4, "Left EL84EH");
  tube(parts, 21, 59, 68, 10.4, "Right EL84EH");
  tube(parts, 0, 13, 70, 10.2, "12DT5 regulator");
  for (const x of [-19, 19]) {
    const light = new PointLight(0xff_6c_21, 420, 58, 2);
    light.position.set(x, BASE + 5, 112);
    parts.root.add(light);
  }
  // 窓越しに見える左右の EL84 も、足元を暖色のヒーター光で照らす。
  for (const x of [-21, 21]) {
    const light = new PointLight(0xff_6c_21, 300, 65, 2);
    light.position.set(x, BASE + 8, 62);
    parts.root.add(light);
  }
}
