import { DoubleSide, Group, Path, Shape, Vector3 } from "three";
import { clearOval, createClearPad } from "./clear-mg-parts";
import type { ClearMgParts } from "./clear-mg-parts";
import {
  clearMgDriverHeight,
  clearMgGrilleGeometry,
} from "./clear-mg-geometry";
import { focalEmblemGeometry } from "./focal-emblem";
import { clearMgShellGeometry } from "./clear-mg-shell";

function arcText(
  context: CanvasRenderingContext2D,
  text: string,
  radius: number,
  middle: number,
  span: number,
  reverse = false
) {
  const letters = Array.from(
    new Intl.Segmenter("fr", { granularity: "grapheme" }).segment(text),
    ({ segment }) => segment
  );
  for (const [index, letter] of letters.entries()) {
    const angle =
      middle +
      (reverse ? -1 : 1) *
        (-span / 2 + (index / Math.max(1, letters.length - 1)) * span);
    context.save();
    context.translate(
      20 + Math.sin(angle) * radius,
      20 - Math.cos(angle) * radius
    );
    context.rotate(angle + (reverse ? Math.PI : 0));
    context.fillText(letter, 0, 0);
    context.restore();
  }
}

function medallion(parts: ClearMgParts, cup: Group) {
  const shape = clearOval(38.8, 38.8);
  const center = new Path();
  center.absarc(0, 0, 13.8, 0, Math.PI * 2, true);
  shape.holes.push(center);
  const screws = [-Math.PI / 3, Math.PI / 3, Math.PI];
  for (const angle of screws) {
    const aperture = new Path();
    aperture.absarc(
      Math.sin(angle) * 16.8,
      Math.cos(angle) * 16.8,
      1.48,
      0,
      Math.PI * 2,
      true
    );
    shape.holes.push(aperture);
    const screw = parts.screw(
      [Math.sin(angle) * 16.8, Math.cos(angle) * 16.8, 11.7],
      "front",
      true
    );
    screw.scale.setScalar(0.76);
    screw.rotation.z = angle;
    cup.add(screw);
  }
  const mesh = parts.disc(
    13.7,
    [0, 0, 11.1],
    parts.woven,
    "Fine woven mesh beneath the Focal emblem"
  );
  const uv = mesh.geometry.getAttribute("uv");
  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(index, uv.getX(index) / 3, uv.getY(index) / 3);
  }
  cup.add(
    parts.ovalRing(
      [40.5, 40.5],
      [27, 27],
      0.8,
      [0, 0, 10.1],
      parts.coated,
      "Raised medallion mounting collar",
      0.3
    ),
    parts.plate(
      shape,
      0.55,
      [0, 0, 11.35],
      parts.polished,
      "Machined annular medallion with three countersunk screw openings",
      0.12
    ),
    parts.disc(13.8, [0, 0, 10.8], parts.black, "Logo acoustic backing"),
    mesh,
    parts.mesh(
      focalEmblemGeometry(),
      parts.polished,
      [0, 0, 11.2],
      "Raised metal Focal emblem with the original continuous outline"
    ),
    parts.print(
      40,
      40,
      [0, 0, 12.04],
      (context) => {
        context.fillStyle = "#e3e5e7";
        context.textAlign = "center";
        context.font = "2.55px Arial";
        arcText(context, "Clear Mg Professional", 16.5, 0, 2.2);
        context.font = "2.4px Arial";
        arcText(context, "Fabriqué en France", 16.4, -2.14, 1.66, true);
        context.font = "2.1px Arial";
        arcText(context, "Magnesium", 16.4, 2.28, 1.04, true);
      },
      "Circular model and manufacturing engravings",
      1024
    )
  );
}

function outerGrille(parts: ClearMgParts, cup: Group) {
  cup.add(
    parts.mesh(
      clearMgShellGeometry(),
      parts.coated,
      [0, 0, 0],
      "Rounded aluminum ear-cup shell with a true bottom socket opening"
    ),
    parts.ovalRing(
      [92, 114],
      [88, 110],
      2.2,
      [0, 0, 5.5],
      parts.coated,
      "Continuous outer grille mounting rim",
      0.2
    ),
    parts.ovalRing(
      [89.2, 109.2],
      [88, 108],
      0.12,
      [0, 0, 7.75],
      parts.polished,
      "Narrow bright bevel around the outer grille",
      0.12
    ),
    parts.plate(
      clearOval(87, 107),
      0.01,
      [0, 0, 7.1],
      parts.woven,
      "Acoustically open fine grille backing",
      0
    ),
    parts.mesh(
      clearMgGrilleGeometry({
        radiusX: 44,
        radiusY: 54,
        cellRadius: 3.05,
        opening: 16.8,
        depth: 0.6,
        dome: 2.7,
        z: 8.2,
        graded: true,
      }),
      parts.grille,
      [0, 0, 0],
      "Convex graduated external honeycomb grille"
    )
  );
  medallion(parts, cup);
}

function innerDriver(parts: ClearMgParts, cup: Group) {
  const baffle = clearOval(85, 106);
  const opening = new Path();
  opening.absellipse(0, 0, 35, 46, 0, Math.PI * 2, true, 0);
  baffle.holes.push(opening);
  cup.add(
    parts.plate(
      baffle,
      1.3,
      [0, 0, -5.2],
      parts.coated,
      "Open oval acoustic basket surrounding the 40 mm driver",
      0.2
    )
  );
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const support = new Shape();
    for (const [point, radiusX, radiusY, offset] of [
      [0, 20.5, 20.5, -0.09],
      [1, 36, 47, -0.055],
      [2, 36, 47, 0.055],
      [3, 20.5, 20.5, 0.09],
    ] as const) {
      const x = Math.cos(angle + offset) * radiusX;
      const y = Math.sin(angle + offset) * radiusY;
      if (point === 0) {
        support.moveTo(x, y);
      } else {
        support.lineTo(x, y);
      }
    }
    support.closePath();
    cup.add(
      parts.plate(
        support,
        1.4,
        [0, 0, -5.2],
        parts.coated,
        "Six open radial driver basket supports",
        0.25
      )
    );
  }
  cup.add(
    parts.ovalRing(
      [45, 45],
      [40.5, 40.5],
      2.3,
      [0, 0, -8.7],
      parts.black,
      "Circular driver basket mounting rim",
      0.25
    )
  );
  const diaphragm = parts.lathe(
    Array.from({ length: 65 }, (_, index) => {
      const radius = (index / 64) * 20;
      return [radius, clearMgDriverHeight(radius)] as const;
    }),
    [0, 0, -8.1],
    parts.magnesium,
    "40 mm M-profile magnesium diaphragm"
  );
  const innerMesh = parts.mesh(
    clearMgGrilleGeometry({
      radiusX: 21.5,
      radiusY: 21.5,
      cellRadius: 2.9,
      opening: 0,
      depth: 0.45,
      dome: -1.8,
      z: -9.8,
      mProfile: true,
    }),
    parts.grille,
    [0, 0, 0],
    "M-profile internal protective honeycomb"
  );
  // Both sides remain visible through the open ear cup.
  innerMesh.material.side = DoubleSide;
  cup.add(diaphragm, innerMesh);
  const { cushion, holes, seam, core } = createClearPad(parts);
  cup.add(
    cushion,
    holes,
    seam,
    core,
    parts.pile(),
    parts.ovalRing(
      [92, 114],
      [83, 104],
      1.2,
      [0, 0, -7.4],
      parts.coated,
      "Removable ear-pad mounting lip",
      0.4
    ),
    parts.ovalRing(
      [52, 74],
      [48, 70],
      4.5,
      [0, 0, -12.4],
      parts.lining,
      "Deep red inner pad lining",
      0.8
    )
  );
}

function createYoke(parts: ClearMgParts, cup: Group, side: number) {
  const shape = new Shape();
  shape.moveTo(-46, 4);
  shape.bezierCurveTo(-49, 40, -15, 55, -13, 70);
  shape.bezierCurveTo(-13, 78, -8, 80, -8, 86);
  shape.lineTo(8, 86);
  shape.bezierCurveTo(8, 80, 13, 78, 13, 70);
  shape.bezierCurveTo(15, 55, 49, 40, 46, 4);
  shape.lineTo(39.5, 4);
  shape.bezierCurveTo(40, 32, 17, 52, 0, 61);
  shape.bezierCurveTo(-17, 52, -40, 32, -39.5, 4);
  shape.closePath();
  const yoke = parts.plate(
    shape,
    4.2,
    [0, 0, 3],
    parts.coated,
    "Solid aluminum arch yoke and adjustment stem",
    0.8
  );
  // ヨークの上端をヘッドバンド内の回転軸へ曲げる。平板のままだと袖を突き抜ける。
  const capAxis = new Vector3(1, 0, 0).applyAxisAngle(
    new Vector3(0, 0, 1),
    side * 0.267
  );
  const a = new Vector3(1, 0, 0).applyEuler(cup.rotation).dot(capAxis);
  const b = new Vector3(0, 1, 0).applyEuler(cup.rotation).dot(capAxis);
  const c = new Vector3(0, 0, 1).applyEuler(cup.rotation).dot(capAxis);
  const d = cup.position
    .clone()
    .sub(new Vector3(side * 86.5, 152.5, 0))
    .dot(capAxis);
  const positions = yoke.geometry.getAttribute("position");
  const normals = yoke.geometry.getAttribute("normal");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index) + 3;
    const t = Math.max(0, Math.min(1, (y - 72) / 11));
    const blend = t * t * (3 - 2 * t);
    const derivative = (6 * t * (1 - t)) / 11;
    const corrected = (side * 0.8 * (z - 5.1) - a * x - b * y - d) / c;
    positions.setZ(index, z + blend * (corrected - z) - 3);
    const dx = (-blend * a) / c;
    const dy = (-blend * b) / c + derivative * (corrected - z);
    const dz = 1 + blend * ((side * 0.8) / c - 1);
    const normal = new Vector3(
      normals.getX(index) - (dx * normals.getZ(index)) / dz,
      normals.getY(index) - (dy * normals.getZ(index)) / dz,
      normals.getZ(index) / dz
    ).normalize();
    normals.setXYZ(index, normal.x, normal.y, normal.z);
  }
  yoke.geometry.computeBoundingBox();
  yoke.geometry.computeBoundingSphere();
  cup.add(yoke);
  for (const pivotSide of [-1, 1]) {
    cup.add(
      parts.cylinder(
        3.65,
        2.2,
        [pivotSide * 44, 5, 7.7],
        parts.coated,
        "Ear-cup pivot axle"
      ),
      parts.lathe(
        [
          [3.65, -0.8],
          [3.65, -0.3],
          [3.45, -0.08],
          [2.85, 0],
          [0, 0],
        ],
        [pivotSide * 44, 5, 9.15],
        parts.polished,
        "Machined pivot face and chamfer"
      )
    );
  }
}

function socket(parts: ClearMgParts, cup: Group) {
  const jack = new Group();
  jack.name = "Recessed detachable 3.5 mm cable socket";
  jack.position.set(0, -57.7, -0.5);
  jack.rotation.x = Math.PI / 2;
  jack.add(
    parts.lathe(
      [
        [4.1, -7],
        [4.1, 0.3],
        [3.65, 0.55],
        [2.25, 0.55],
        [1.75, 0.15],
        [1.75, -10],
      ],
      [0, 0, 0],
      parts.coated,
      "Hollow recessed connector surround"
    ),
    parts.ring(2.25, 0.38, [0, 0, 0.67], parts.polished, "3.5 mm socket rim"),
    parts.disc(1.75, [0, 0, -10.1], parts.cavity, "Deep 3.5 mm connector bore"),
    parts.box(
      [0.35, 1.1, 3.2],
      [1.6, 0, -5.2],
      parts.gold,
      "Socket spring contact",
      0.04
    )
  );
  cup.add(jack);
}

export function createClearMgCup(parts: ClearMgParts, side: number) {
  const cup = new Group();
  cup.name =
    side === 1
      ? "Clear Mg Professional right ear cup"
      : "Clear Mg Professional left ear cup";
  cup.rotation.set(0, side * (Math.PI / 2 + 0.35), side * -0.25, "ZYX");
  const stem = new Vector3(0, 85.5, 5.1).applyEuler(cup.rotation);
  cup.position.copy(new Vector3(side * 86.5, 149, 0).sub(stem));
  outerGrille(parts, cup);
  innerDriver(parts, cup);
  createYoke(parts, cup, side);
  socket(parts, cup);
  const channel = parts.print(
    5,
    5,
    [0, 73, 2.15],
    (context) => {
      context.fillStyle = "#b3b5b9";
      context.textAlign = "center";
      context.font = "bold 3.5px Arial";
      context.fillText(side === 1 ? "R" : "L", 2.5, 3.8);
    },
    "Inner yoke channel marking",
    256
  );
  channel.rotation.y = Math.PI;
  cup.add(channel);
  parts.root.add(cup);
}
