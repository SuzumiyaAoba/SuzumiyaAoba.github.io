import { CylinderGeometry, Group, RingGeometry } from "three";
import type { SigmaParts } from "./sigma-pro-parts";

export function createSigmaSocket(
  parts: SigmaParts,
  x: number,
  y: number,
  z: number,
  radius: number,
  bezel: number,
  name: string,
  gold = true
) {
  const group = new Group();
  group.name = `${name} recessed socket assembly`;
  group.position.set(x, y, z);
  group.add(
    parts.lathe(
      [
        [bezel, -0.08],
        [bezel - 0.05, 0.12],
        [bezel - 0.35, 0.24],
        [radius + 0.85, -0.48],
        [radius + 0.48, -0.85],
      ],
      [0, 0, 0],
      parts.aluminium,
      `${name} conical CNC counterbore`
    )
  );
  group.add(
    parts.lathe(
      [
        [radius + 0.05, -11.1],
        [radius + 0.05, -1.3],
        [radius + 0.18, -0.91],
        [radius + 0.43, -0.79],
      ],
      [0, 0, 0],
      gold ? parts.plated : parts.machined,
      `${name} recessed contact sleeve`
    )
  );
  const barrel = parts.mesh(
    new CylinderGeometry(radius, radius, 10.3, 64, 1, true),
    parts.insulator,
    [0, 0, -6],
    `${name} hollow socket barrel`
  );
  barrel.rotation.x = Math.PI / 2;
  group.add(
    barrel,
    parts.disc(
      radius,
      [0, 0, -11.2],
      parts.cavity,
      `${name} dark socket interior`
    )
  );
  group.add(
    parts.mesh(
      new RingGeometry(radius + 0.05, radius + 0.52, 96),
      gold ? parts.plated : parts.insulator,
      [0, 0, -0.28],
      `${name} flat recessed contact lip`
    )
  );
  for (const depth of [-4.2, -8.5]) {
    group.add(
      parts.box(
        [0.2, radius * 0.55, 2.3],
        [radius - 0.11, 0, depth],
        gold ? parts.plated : parts.machined,
        `${name} recessed spring contact`,
        0.04
      )
    );
  }
  parts.root.add(group);
  return group;
}
