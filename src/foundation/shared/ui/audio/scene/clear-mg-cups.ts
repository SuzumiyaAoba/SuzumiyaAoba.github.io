import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Path,
  Shape,
  Vector3,
} from "three";
import type { Material } from "three";
import { clearOval, createClearPad } from "./clear-mg-parts";
import type { ClearMgParts } from "./clear-mg-parts";

type GrilleOptions = {
  radiusX: number;
  radiusY: number;
  cellRadius: number;
  opening: number;
  depth: number;
  dome: number;
  z: number;
  graded?: boolean;
};

function grillePoint(
  x: number,
  y: number,
  options: GrilleOptions,
  back: boolean
) {
  const warpedX = options.graded
    ? x + 0.18 * ((x * x) / options.radiusX - options.radiusX)
    : x;
  const ellipse = (warpedX / options.radiusX) ** 2 + (y / options.radiusY) ** 2;
  return new Vector3(
    warpedX,
    y,
    options.z +
      options.dome * Math.max(0, 1 - ellipse) -
      (back ? options.depth : 0)
  );
}

function addCellFaces(indices: number[], offset: number) {
  for (let vertex = 0; vertex < 6; vertex += 1) {
    const next = (vertex + 1) % 6;
    for (const [a, b, c, d] of [
      [vertex, next, next + 6, vertex + 6],
      [vertex + 12, vertex + 18, next + 18, next + 12],
      [vertex, vertex + 12, next + 12, next],
      [vertex + 6, next + 6, next + 18, vertex + 18],
    ] as const) {
      indices.push(
        offset + a,
        offset + b,
        offset + c,
        offset + a,
        offset + c,
        offset + d
      );
    }
  }
}

// The complete honeycomb is one mesh, including aperture walls and a convex face.
function honeycomb(
  parts: ClearMgParts,
  options: GrilleOptions,
  material: Material,
  name: string
) {
  const positions: number[] = [];
  const indices: number[] = [];
  const columnCount =
    Math.ceil(options.radiusX / (options.cellRadius * 1.5)) + 3;
  const rowCount =
    Math.ceil(options.radiusY / (options.cellRadius * Math.sqrt(3))) + 2;
  for (let column = -columnCount; column <= columnCount; column += 1) {
    for (let row = -rowCount; row <= rowCount; row += 1) {
      const centerX = column * options.cellRadius * 1.5;
      const centerY =
        (row + (column % 2) * 0.5) * options.cellRadius * Math.sqrt(3);
      const edge: Vector3[] = [];
      for (let vertex = 0; vertex < 6; vertex += 1) {
        const angle = (vertex * Math.PI) / 3;
        edge.push(
          grillePoint(
            centerX + Math.cos(angle) * options.cellRadius,
            centerY + Math.sin(angle) * options.cellRadius,
            options,
            false
          )
        );
      }
      const fits = edge.every(
        (point) =>
          (point.x / options.radiusX) ** 2 + (point.y / options.radiusY) ** 2 <=
            1 && Math.hypot(point.x, point.y) >= options.opening
      );
      if (!fits) {
        continue;
      }
      const offset = positions.length / 3;
      for (const back of [false, true]) {
        for (const radius of [options.cellRadius, options.cellRadius - 0.38]) {
          for (let vertex = 0; vertex < 6; vertex += 1) {
            const angle = (vertex * Math.PI) / 3;
            const point = grillePoint(
              centerX + Math.cos(angle) * radius,
              centerY + Math.sin(angle) * radius,
              options,
              back
            );
            positions.push(point.x, point.y, point.z);
          }
        }
      }
      addCellFaces(indices, offset);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return parts.mesh(geometry, material, [0, 0, 0], name);
}

function arcText(
  context: CanvasRenderingContext2D,
  text: string,
  radius: number,
  middle: number,
  span: number
) {
  const letters = Array.from(
    new Intl.Segmenter("fr", { granularity: "grapheme" }).segment(text),
    ({ segment }) => segment
  );
  for (const [index, letter] of letters.entries()) {
    const angle =
      middle - span / 2 + (index / Math.max(1, letters.length - 1)) * span;
    context.save();
    context.translate(
      20 + Math.sin(angle) * radius,
      20 - Math.cos(angle) * radius
    );
    context.rotate(angle);
    context.fillText(letter, 0, 0);
    context.restore();
  }
}

function focalLogo(context: CanvasRenderingContext2D) {
  context.fillStyle = "#eeeeef";
  context.beginPath();
  context.moveTo(6, 3);
  context.quadraticCurveTo(13, 1.3, 20, 3);
  context.lineTo(18, 6.6);
  context.quadraticCurveTo(12, 4.3, 6.5, 5.5);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(9, 7.2);
  context.quadraticCurveTo(14.4, 6.1, 17.2, 8.4);
  context.lineTo(15.4, 11.1);
  context.quadraticCurveTo(13, 9.5, 8.4, 9.1);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(14.4, 12);
  context.bezierCurveTo(6.3, 10.5, 6, 17.4, 11.2, 22);
  context.bezierCurveTo(9.5, 17.8, 12.2, 14.8, 14.4, 12);
  context.closePath();
  context.fill();
}

function medallion(parts: ClearMgParts, cup: Group) {
  cup.add(
    parts.ovalRing(
      [39, 39],
      [28, 28],
      1.7,
      [0, 0, 13.3],
      parts.polished,
      "Machined central medallion",
      0.55
    ),
    parts.ring(
      19.2,
      0.35,
      [0, 0, 15.2],
      parts.turned,
      "Polished medallion perimeter"
    ),
    parts.disc(13.8, [0, 0, 14.3], parts.black, "Logo acoustic backing"),
    parts.disc(
      13.7,
      [0, 0, 14.45],
      parts.woven,
      "Fine mesh beneath the Focal emblem"
    ),
    parts.print(26, 25, [0, 0, 14.6], focalLogo, "Focal emblem", 512),
    parts.print(
      40,
      40,
      [0, 0, 15.6],
      (context) => {
        context.fillStyle = "#e3e5e7";
        context.textAlign = "center";
        context.font = "1.85px Arial";
        arcText(context, "Clear Mg Professional", 16.5, 0, 2.25);
        arcText(context, "Fabriqué en France", 16.4, -2.1, 1.75);
        context.font = "1.5px Arial";
        arcText(context, "Magnesium", 16.4, 2.25, 1.02);
      },
      "Circular model and manufacturing engravings",
      1024
    )
  );
  for (const angle of [-Math.PI / 3, Math.PI / 3, Math.PI]) {
    const recess = parts.disc(
      1.65,
      [Math.sin(angle) * 16.8, Math.cos(angle) * 16.8, 15.61],
      parts.cavity,
      "Medallion screw recess"
    );
    const head = parts.cylinder(
      0.9,
      0.32,
      [Math.sin(angle) * 16.8, Math.cos(angle) * 16.8, 15.66],
      parts.coated,
      "Recessed medallion screw"
    );
    const slot = parts.box(
      [1.05, 0.18, 0.1],
      [Math.sin(angle) * 16.8, Math.cos(angle) * 16.8, 15.86],
      parts.cavity,
      "Medallion screw slot",
      0.03
    );
    slot.rotation.z = angle;
    cup.add(recess, head, slot);
  }
}

function outerGrille(parts: ClearMgParts, cup: Group) {
  cup.add(
    parts.ovalRing(
      [94, 116],
      [85, 106],
      8.5,
      [0, 0, -4],
      parts.coated,
      "Rounded open aluminum ear-cup shell",
      1.2
    ),
    parts.ovalRing(
      [92, 114],
      [88, 110],
      0.8,
      [0, 0, 5.8],
      parts.polished,
      "Bright bevel around the outer grille",
      0.2
    ),
    parts.plate(
      clearOval(87, 107),
      0.01,
      [0, 0, 7.1],
      parts.woven,
      "Acoustically open fine grille backing",
      0
    ),
    honeycomb(
      parts,
      {
        radiusX: 44,
        radiusY: 54,
        cellRadius: 3.05,
        opening: 16.8,
        depth: 0.6,
        dome: 2.7,
        z: 8.2,
        graded: true,
      },
      parts.grille,
      "Convex graduated external honeycomb grille"
    )
  );
  medallion(parts, cup);
}

function innerDriver(parts: ClearMgParts, cup: Group) {
  const baffle = clearOval(85, 106);
  const opening = new Path();
  opening.absarc(0, 0, 21, 0, Math.PI * 2, true);
  baffle.holes.push(opening);
  cup.add(
    parts.plate(
      baffle,
      1.3,
      [0, 0, -5.2],
      parts.coated,
      "Open acoustic baffle surrounding the 40 mm driver",
      0.2
    )
  );
  const diaphragm = parts.lathe(
    [
      [0, 0.25],
      [4, 0.5],
      [11, 1.8],
      [14, 1.05],
      [18, 2.6],
      [20, 0.4],
    ],
    [0, 0, -5.5],
    parts.magnesium,
    "40 mm M-profile magnesium diaphragm"
  );
  diaphragm.rotation.x = -Math.PI / 2;
  const innerMesh = honeycomb(
    parts,
    {
      radiusX: 21.5,
      radiusY: 21.5,
      cellRadius: 2.4,
      opening: 0,
      depth: 0.45,
      dome: -1.8,
      z: -9.8,
    },
    parts.grille,
    "M-profile internal protective honeycomb"
  );
  // Both sides remain visible through the open ear cup.
  innerMesh.material.side = DoubleSide;
  cup.add(diaphragm, innerMesh);
  const { cushion, holes, seam } = createClearPad(parts);
  cup.add(
    cushion,
    holes,
    seam,
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

function createYoke(parts: ClearMgParts, cup: Group) {
  const shape = new Shape();
  shape.moveTo(-46, 4);
  shape.bezierCurveTo(-49, 40, -25, 50, -13, 70);
  shape.lineTo(-13, 88);
  shape.lineTo(13, 88);
  shape.lineTo(13, 70);
  shape.bezierCurveTo(25, 50, 49, 40, 46, 4);
  shape.lineTo(39.5, 4);
  shape.bezierCurveTo(40, 32, 17, 52, 0, 61);
  shape.bezierCurveTo(-17, 52, -40, 32, -39.5, 4);
  shape.closePath();
  cup.add(
    parts.plate(
      shape,
      4.2,
      [0, 0, 3],
      parts.coated,
      "Solid aluminum arch yoke and adjustment stem",
      0.8
    )
  );
  for (let index = 0; index < 5; index += 1) {
    cup.add(
      parts.box(
        [7, 0.25, 0.12],
        [0, 74 + index * 2.2, 8.08],
        parts.black,
        "Adjustment stem index",
        0.02
      )
    );
  }
  for (const side of [-1, 1]) {
    cup.add(
      parts.cylinder(
        3.65,
        2.2,
        [side * 44, 5, 7.7],
        parts.coated,
        "Ear-cup pivot axle"
      ),
      parts.ring(
        3.5,
        0.45,
        [side * 44, 5, 9],
        parts.polished,
        "Polished pivot trim"
      ),
      parts.disc(2.9, [side * 44, 5, 9.05], parts.coated, "Dark pivot cap")
    );
  }
}

function socket(parts: ClearMgParts, cup: Group) {
  const jack = new Group();
  jack.name = "Recessed detachable 3.5 mm cable socket";
  jack.position.set(0, -59.4, -0.5);
  jack.rotation.x = Math.PI / 2;
  jack.add(
    parts.lathe(
      [
        [4.1, -3],
        [4.1, 0.3],
        [3.65, 0.55],
        [2.25, 0.55],
        [1.75, 0.15],
        [1.75, -4],
      ],
      [0, 0, 0],
      parts.coated,
      "Hollow recessed connector surround"
    ),
    parts.ring(2.25, 0.38, [0, 0, 0.67], parts.polished, "3.5 mm socket rim"),
    parts.disc(1.75, [0, 0, -4.1], parts.cavity, "Deep 3.5 mm connector bore"),
    parts.box(
      [0.35, 1, 0.2],
      [1.6, 0, -1.8],
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
  outerGrille(parts, cup);
  innerDriver(parts, cup);
  createYoke(parts, cup);
  socket(parts, cup);
  const channel = parts.print(
    5,
    5,
    [0, 73, -0.02],
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
  cup.position.set(side * 61, 62, 0);
  cup.rotation.set(0, side * (Math.PI / 2 - 0.12), side * -0.25, "ZYX");
  parts.root.add(cup);
}
