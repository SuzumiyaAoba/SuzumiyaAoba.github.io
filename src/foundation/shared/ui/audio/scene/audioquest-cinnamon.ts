import {
  CatmullRomCurve3,
  Group,
  MeshPhysicalMaterial,
  ExtrudeGeometry,
  Path,
  Shape,
  TubeGeometry,
  Vector3,
} from "three";
import {
  cinnamonHousingGeometry,
  cinnamonMarkGeometry,
  cinnamonShoulder,
  cinnamonTail,
  cinnamonShieldGeometry,
} from "./cinnamon-geometry";
import type { CinnamonConnector } from "./cinnamon-geometry";
import { cinnamonBraidTextures, drawCinnamonMark } from "./cinnamon-textures";
import { createModelParts } from "./parts";
import type { ModelParts } from "./parts";
import { applySurfaceFinish } from "./surface-finish";
import type { CableEndpoint } from "./system-cables";

const cableLength = 1500;
const cableRadius = 3.1;

/** The cable settles onto the floor with a smooth tangent at first contact. */
class FloorCableCurve extends CatmullRomCurve3 {
  override getPoint(t: number, target = new Vector3()) {
    const point = super.getPoint(t, target);
    const clearance = Math.max(0, point.y - cableRadius - 1);
    if (clearance < 2) {
      point.y = cableRadius + 1 + (clearance ** 2 * (4 - clearance)) / 4;
    }
    return point;
  }
}

/** 1.5 m の余長を床面で二巻きにして、両端の接続方向と長さを保つ。 */
export function cinnamonCableCurve(start: CableEndpoint, end: CableEndpoint) {
  const centerX = (start.position.x + end.position.x) / 2 - 25;
  const rearZ = Math.min(start.position.z, end.position.z) - 65;
  const highDrop = start.position.y - end.position.y > 50;
  const route = (radius: number) => {
    const points = [
      start.position.clone(),
      start.position.clone().addScaledVector(start.direction, 24),
      new Vector3(
        start.position.x - (highDrop ? 40 : 20),
        cableRadius + 1,
        rearZ + (highDrop ? 40 : 30)
      ),
      new Vector3(start.position.x - 60, cableRadius + 1, rearZ),
    ];
    for (let index = 0; index <= 48; index += 1) {
      const progress = index / 48;
      const angle = Math.PI + progress * Math.PI * 4;
      points.push(
        new Vector3(
          centerX + Math.cos(angle) * radius - progress * 9,
          cableRadius + 1 + progress * 16,
          rearZ - radius / 2 + (Math.sin(angle) * radius) / 2
        )
      );
    }
    points.push(
      new Vector3(end.position.x - 55, 40, rearZ + 15),
      end.position.clone().addScaledVector(end.direction, 24),
      end.position.clone()
    );
    const curve = new FloorCableCurve(points, false, "centripetal");
    curve.arcLengthDivisions = 2048;
    return curve;
  };
  let minimum = 20;
  let maximum = 180;
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const radius = (minimum + maximum) / 2;
    if (route(radius).getLength() < cableLength) {
      minimum = radius;
    } else {
      maximum = radius;
    }
  }
  return route((minimum + maximum) / 2);
}

function cinnamonPlug(
  parts: ModelParts,
  endpoint: CableEndpoint,
  type: CinnamonConnector,
  cover: MeshPhysicalMaterial,
  flipped = false
): CableEndpoint {
  const connector = new Group();
  connector.name = `AudioQuest Cinnamon ${type.toUpperCase()} plug`;
  connector.position
    .copy(endpoint.position)
    .addScaledVector(endpoint.direction, -(cinnamonShoulder - 0.5));
  connector.quaternion.setFromUnitVectors(
    new Vector3(0, 0, 1),
    endpoint.direction
  );
  if (flipped) {
    connector.rotateZ(Math.PI);
  }
  connector.add(
    parts.mesh(
      cinnamonShieldGeometry(type),
      parts.gold,
      [0, 0, 0],
      "Hollow gold-plated USB shield"
    ),
    parts.mesh(
      cinnamonHousingGeometry(type, "cover"),
      cover,
      [0, 0, 0],
      "Cinnamon red metallic rounded cover"
    ),
    parts.mesh(
      cinnamonHousingGeometry(type, "boot"),
      parts.rubber,
      [0, 0, 0],
      "Black tapered strain-relief boot"
    )
  );
  if (type === "usb-a") {
    connector.add(
      parts.box(
        [10.7, 1.6, 11.2],
        [0, 0.95, 6.2],
        parts.black,
        "USB-A insulating contact tongue",
        0.12
      )
    );
    for (const index of [0, 1, 2, 3]) {
      connector.add(
        parts.box(
          [1, 0.13, index === 0 || index === 3 ? 6.8 : 5.8],
          [(index - 1.5) * 2.5, 0.105, 5.5],
          parts.gold,
          "USB-A gold contact",
          0.025
        )
      );
    }
  } else {
    const carrier = new Shape();
    carrier.moveTo(-3.65, -3.28);
    carrier.lineTo(3.65, -3.28);
    carrier.lineTo(3.65, 1.8);
    carrier.lineTo(2.2, 3.28);
    carrier.lineTo(-2.2, 3.28);
    carrier.lineTo(-3.65, 1.8);
    carrier.closePath();
    const cavity = new Path();
    cavity.moveTo(-2.65, -2.2);
    cavity.lineTo(-2.65, 1.6);
    cavity.lineTo(2.65, 1.6);
    cavity.lineTo(2.65, -2.2);
    cavity.closePath();
    carrier.holes.push(cavity);
    connector.add(
      parts.mesh(
        new ExtrudeGeometry(carrier, { depth: 10.7, bevelEnabled: false }),
        parts.black,
        [0, 0, 0.6],
        "USB-B hollow molded insulator"
      )
    );
    connector.add(
      parts.box(
        [5.3, 3.8, 0.6],
        [0, -0.3, 11.1],
        parts.black,
        "USB-B recessed contact floor",
        0.02
      )
    );
    for (const x of [-1.25, 1.25]) {
      for (const y of [-2.15, 1.55]) {
        connector.add(
          parts.box(
            [0.8, 0.18, 7.5],
            [x, y, 6],
            parts.gold,
            "USB-B gold contact",
            0.035
          )
        );
      }
    }
  }
  const markWidth = type === "usb-a" ? 12 : 9;
  const mark = parts.print(
    markWidth,
    12,
    [0, 0, 0],
    (context) => {
      context.translate(markWidth / 2, 6);
      context.scale(markWidth / 12, 1);
      drawCinnamonMark(context);
    },
    "CINNAMON lettering and USB symbol",
    512
  );
  const curvedMark = parts.mesh(
    cinnamonMarkGeometry(type),
    mark.material,
    [0, 0, 0],
    mark.name
  );
  curvedMark.userData["castShadow"] = false;
  mark.removeFromParent();
  connector.add(curvedMark);
  parts.root.add(connector);
  return {
    position: connector.position
      .clone()
      .addScaledVector(endpoint.direction, cinnamonTail),
    direction: endpoint.direction.clone(),
  };
}

/** 外観の参照: dm-importaudio.jp/audioquest/lineup/detail1/index1385.html */
export function createAudioquestCinnamon(
  usbA: CableEndpoint,
  usbB: CableEndpoint,
  { usbAFlipped = false }: { usbAFlipped?: boolean } = {}
) {
  const parts = createModelParts({ brushed: false });
  parts.root.name = "AudioQuest Cinnamon USB 2.0 A–B 1.5 m — USB2/CIN/1.5";
  const cover = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x78_12_18,
      metalness: 0.55,
      roughness: 0.38,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
    }),
    { scale: [18, 18, 18], relief: 0.002, roughness: 0.1 }
  );
  parts.gold.color.setHex(0xe5_c6_83);
  parts.gold.metalness = 0.9;
  parts.gold.roughness = 0.28;
  applySurfaceFinish(parts.gold, {
    scale: [20, 20, 20],
    relief: 0.0015,
    roughness: 0.06,
  });
  parts.rubber.color.setHex(0x1a_1b_1d);
  parts.rubber.roughness = 0.68;
  const start = cinnamonPlug(parts, usbA, "usb-a", cover, usbAFlipped);
  const end = cinnamonPlug(parts, usbB, "usb-b", cover);
  const curve = cinnamonCableCurve(start, end);
  const braid = cinnamonBraidTextures(curve.getLength(), cableRadius);
  const jacket = new MeshPhysicalMaterial({
    color: 0xd0_d0_d0,
    map: braid.color,
    bumpMap: braid.height,
    roughnessMap: braid.roughness,
    bumpScale: 0.09,
    roughness: 0.92,
    sheen: 0.16,
    sheenColor: 0x60_45_42,
    sheenRoughness: 0.8,
  });
  const cable = parts.mesh(
    new TubeGeometry(curve, 600, cableRadius, 24, false),
    jacket,
    [0, 0, 0],
    "Cinnamon red/black braided cable, 1.5 m"
  );
  cable.userData["lengthMm"] = cableLength;
  return {
    group: parts.root,
    dispose() {
      parts.dispose();
      for (const texture of Object.values(braid)) {
        texture.dispose();
      }
    },
  };
}

export function createStandaloneCinnamon() {
  return createAudioquestCinnamon(
    { position: new Vector3(-35, 14, 160), direction: new Vector3(0, 0, -1) },
    { position: new Vector3(25, 14, 160), direction: new Vector3(0, 0, -1) }
  );
}
