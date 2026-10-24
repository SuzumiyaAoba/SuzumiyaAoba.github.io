import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  Vector2,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const btr17Dimensions = {
  width: 41.2,
  height: 86.6,
  depth: 16.3,
} as const;
export const btr17Outputs = [
  { x: -10.8, bore: 2.2, rim: 3.25, label: "BAL" },
  { x: 0.5, bore: 1.75, rim: 2.65, label: "PO" },
] as const;
export const btr17UsbPositions = [-8.4, 8.4] as const;
const btr17SideOpenings = [
  { y: 58.5, width: 4.7, height: 3.7 },
  { y: 50.2, width: 4.7, height: 3.7 },
  { y: 42, width: 4.7, height: 3.7 },
  { y: 32.5, width: 3.8, height: 6.7 },
  { y: 21.3, width: 3.8, height: 5.3 },
] as const;

function btr17RoundedRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  shape.closePath();
  return shape;
}

/** 端面を塞がず、前面の段差とノブの切り欠きを一体の金属フレームにする。 */
export function btr17FrameGeometry() {
  const sections: (readonly [number, number, number, number, number])[] = [
    [0, -17.8, 17.8, 5.6, 5.6],
    [2.8, -20.6, 20.6, 8.15, 8.15],
    [38, -20.6, 20.6, 8.15, 8.15],
  ];
  for (let step = 1; step <= 24; step += 1) {
    const fraction = step / 24;
    const easing = fraction * fraction * (3 - 2 * fraction);
    sections.push([
      38 + 5.4 * fraction,
      -20.6,
      20.6,
      8.15 - 0.75 * easing,
      8.15,
    ]);
  }
  sections.push(
    [74.8, -20.6, 20.6, 7.4, 8.15],
    [78.3, -20.6, 13.5, 7.4, 8.15],
    [83.8, -20.6, 13.5, 7.4, 8.15],
    [86.6, -17.8, 13.5, 5.6, 5.6]
  );
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [y, left, right, front, back] of sections) {
    const bevel = 1.1;
    for (const [x, z] of [
      [left + bevel, front],
      [right - bevel, front],
      [right, front - bevel],
      [right, -back + bevel],
      [right - bevel, -back],
      [left + bevel, -back],
      [left, -back + bevel],
      [left, front - bevel],
    ] as const) {
      positions.push(x, y, z);
    }
  }
  for (let section = 0; section < sections.length - 1; section += 1) {
    const y = sections[section]?.[0] ?? 0;
    for (let side = 0; side < 8; side += 1) {
      if (
        (side === 0 && y >= 43.4 && y < 83.8) ||
        (side === 4 && y >= 2.8 && y < 83.8) ||
        (side === 2 && y >= 2.8 && y < 74.8)
      ) {
        continue;
      }
      const a = section * 8 + side;
      const b = section * 8 + ((side + 1) % 8);
      indices.push(a, b, a + 8, b, b + 8, a + 8);
    }
  }
  const indexed = new BufferGeometry();
  indexed.setAttribute("position", new Float32BufferAttribute(positions, 3));
  indexed.setIndex(indices);
  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  geometry.computeVertexNormals();
  const panels = btr17PerforatedPanels(sections);
  const result = mergeGeometries([geometry, ...panels]);
  for (const panel of [geometry, ...panels]) {
    panel.dispose();
  }
  return result;
}

function btr17PerforatedPanels(
  sections: readonly (readonly [number, number, number, number, number])[]
) {
  const front = new Shape([
    new Vector2(-19.5, 43.4),
    new Vector2(19.5, 43.4),
    new Vector2(19.5, 74.8),
    new Vector2(12.4, 78.3),
    new Vector2(12.4, 83.8),
    new Vector2(-19.5, 83.8),
  ]);
  front.holes.push(new Path(btr17FrontOutline().getPoints()));
  const rear = new Shape([
    new Vector2(-19.5, 2.8),
    new Vector2(19.5, 2.8),
    new Vector2(19.5, 74.8),
    new Vector2(12.4, 78.3),
    new Vector2(12.4, 83.8),
    new Vector2(-19.5, 83.8),
  ]);
  rear.holes.push(new Path(btr17RearOutline().getPoints()));
  const edge = sections.filter(([y]) => y >= 2.8 && y <= 74.8);
  const side = new Shape([
    ...edge.map((section) => new Vector2(-section[3] + 1.1, section[0])),
    new Vector2(7.05, 74.8),
    new Vector2(7.05, 2.8),
  ]);
  for (const { y, width, height } of btr17SideOpenings) {
    side.holes.push(
      new Path(
        btr17RoundedRectangle(
          -width / 2,
          y - height / 2,
          width,
          height,
          0.4
        ).getPoints(16)
      )
    );
  }
  const microphone = new Path();
  microphone.absarc(0, 63.8, 0.32, 0, Math.PI * 2, true);
  side.holes.push(microphone);
  const panels = [front, rear, side].map((shape) => {
    shape.closePath();
    const panel = new ExtrudeGeometry(shape, {
      depth: 0.65,
      bevelEnabled: false,
      curveSegments: 24,
    });
    panel.deleteAttribute("uv");
    return panel;
  });
  panels[0]?.translate(0, 0, 6.75);
  panels[1]?.translate(0, 0, -8.15);
  panels[2]?.translate(0, 0, -0.65);
  panels[2]?.rotateY(Math.PI / 2);
  panels[2]?.translate(20.6, 0, 0);
  return panels;
}

/** 実際に穴の開いた端面。ヘッドホン出力と二つのUSB端子を埋めない。 */
export function btr17EndPlateGeometry(top: boolean) {
  const right = top ? 13.5 : 17.8;
  const outline = btr17RoundedRectangle(-17.8, -5.6, right + 17.8, 11.2, 1.1);
  if (top) {
    for (const output of btr17Outputs) {
      const hole = new Path();
      hole.absarc(output.x, 0, output.rim, 0, Math.PI * 2, true);
      outline.holes.push(hole);
    }
  } else {
    for (const x of btr17UsbPositions) {
      outline.holes.push(
        new Path(
          btr17RoundedRectangle(x - 4.5, -1.65, 9, 3.3, 1.6).getPoints(16)
        )
      );
    }
  }
  const geometry = new ExtrudeGeometry(outline, {
    depth: 0.9,
    bevelEnabled: false,
    curveSegments: 48,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function btr17JackGeometry(bore: number, rim: number) {
  const shape = new Shape();
  shape.absarc(0, 0, rim, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(0, 0, bore, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new ExtrudeGeometry(shape, {
    depth: 10.8,
    bevelEnabled: false,
    curveSegments: 48,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -10.8, 0);
  return geometry;
}

export function btr17UsbRimGeometry() {
  const outline = btr17RoundedRectangle(-4.5, -1.65, 9, 3.3, 1.6);
  outline.holes.push(
    new Path(btr17RoundedRectangle(-4.3, -1.45, 8.6, 2.9, 1.4).getPoints(16))
  );
  const geometry = new ExtrudeGeometry(outline, {
    depth: 6.2,
    bevelEnabled: false,
    curveSegments: 24,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function btr17UsbLinerGeometry() {
  const outline = btr17RoundedRectangle(-4.3, -1.45, 8.6, 2.9, 1.4);
  outline.holes.push(
    new Path(btr17RoundedRectangle(-4.15, -1.3, 8.3, 2.6, 1.25).getPoints(16))
  );
  const geometry = new ExtrudeGeometry(outline, {
    depth: 1.2,
    bevelEnabled: false,
    curveSegments: 24,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function btr17FrontOutline() {
  const shape = new Shape([
    new Vector2(-17.7, 43.8),
    new Vector2(16.5, 43.8),
    new Vector2(16.5, 74.3),
    new Vector2(12.2, 77.5),
    new Vector2(-17.7, 77.5),
  ]);
  shape.closePath();
  return shape;
}

export function btr17FrontGlassGeometry() {
  const shape = btr17FrontOutline();
  return new ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.05,
    bevelSegments: 3,
  });
}

function btr17RearOutline() {
  const shape = new Shape([
    new Vector2(-16.2, 3.2),
    new Vector2(16.2, 3.2),
    new Vector2(18.1, 5.1),
    new Vector2(18.1, 73.8),
    new Vector2(12.2, 78.1),
    new Vector2(12.2, 83.3),
    new Vector2(-17.1, 83.3),
    new Vector2(-18.1, 81.5),
    new Vector2(-18.1, 5.1),
  ]);
  shape.closePath();
  return shape;
}

export function btr17RearLeatherGeometry() {
  const shape = btr17RearOutline();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelSize: 0.18,
    bevelThickness: 0.08,
    bevelSegments: 3,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(
      index,
      (positions.getX(index) + 20.6) / 41.2,
      positions.getY(index) / 86.6
    );
  }
  return geometry;
}
