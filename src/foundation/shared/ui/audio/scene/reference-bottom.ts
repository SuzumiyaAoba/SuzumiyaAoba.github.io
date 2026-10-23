import { ExtrudeGeometry, MeshStandardMaterial, Path, Shape } from "three";
import type { ModelParts } from "./parts";
import { applySurfaceFinish } from "./surface-finish";

export type BottomMount = readonly [number, number];

export function createReferenceBottom(
  parts: ModelParts,
  mounts: readonly BottomMount[]
) {
  parts.box(
    [274, 1.6, 224],
    [0, 13.3, 0.5],
    parts.rear,
    "Folded chassis base surrounding the inset steel panel",
    0.3
  );
  const panel = new Shape();
  panel.moveTo(-133.5, -108.5);
  panel.lineTo(133.5, -108.5);
  panel.lineTo(133.5, 108.5);
  panel.lineTo(-133.5, 108.5);
  panel.closePath();
  for (const [x, z] of mounts) {
    const hole = new Path();
    hole.absarc(x, 0.5 - z, 1.2, 0, Math.PI * 2, true);
    panel.holes.push(hole);
  }
  const steel = applySurfaceFinish(
    new MeshStandardMaterial({
      color: 0x9b_a4_aa,
      metalness: 0.78,
      roughness: 0.36,
    }),
    { scale: [10, 10, 10], relief: 0.002, roughness: 0.035 }
  );
  const base = parts.mesh(
    new ExtrudeGeometry(panel, {
      depth: 0.65,
      bevelEnabled: true,
      bevelSize: 0.85,
      bevelThickness: 0.3,
      bevelSegments: 4,
      curveSegments: 32,
    }),
    steel,
    [0, 12.6, 0.5],
    "Pressed zinc-coated steel bottom panel with folded edges"
  );
  base.rotation.x = -Math.PI / 2;
  if (mounts.length === 0) {
    return;
  }
  const mount = new Shape();
  for (let vertex = 0; vertex < 6; vertex += 1) {
    const angle = (vertex * Math.PI) / 3;
    const x = 2.3 * Math.cos(angle);
    const y = 2.3 * Math.sin(angle);
    if (vertex === 0) {
      mount.moveTo(x, y);
    } else {
      mount.lineTo(x, y);
    }
  }
  mount.closePath();
  const bore = new Path();
  bore.absarc(0, 0, 1.05, 0, Math.PI * 2, true);
  mount.holes.push(bore);
  const geometry = new ExtrudeGeometry(mount, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
    curveSegments: 24,
  });
  for (const [x, z] of mounts) {
    const seat = parts.mesh(
      geometry,
      parts.steel,
      [x, 12.3, z],
      "Hexagonal clinch-nut seat for the internal board mount"
    );
    seat.rotation.x = Math.PI / 2;
    const hole = parts.disc(
      1.06,
      [x, 12.31, z],
      parts.cavity,
      "Recessed mounting-thread bore"
    );
    hole.rotation.x = Math.PI / 2;
  }
}
