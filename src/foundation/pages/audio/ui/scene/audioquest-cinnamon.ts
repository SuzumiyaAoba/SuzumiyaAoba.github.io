import {
  CatmullRomCurve3,
  Group,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import {
  cinnamonHousingGeometry,
  cinnamonShieldGeometry,
} from "./cinnamon-geometry";
import type { CinnamonConnector } from "./cinnamon-geometry";
import { cinnamonBraidTexture, drawCinnamonMark } from "./cinnamon-textures";
import { createModelParts } from "./parts";
import type { ModelParts } from "./parts";
import type { CableEndpoint } from "./system-cables";

const cableLength = 1500;
const cableRadius = 3.1;

/** 1.5 m の余長を床面で二巻きにして、両端の接続方向と長さを保つ。 */
export function cinnamonCableCurve(start: CableEndpoint, end: CableEndpoint) {
  const centerX = (start.position.x + end.position.x) / 2 - 25;
  const rearZ = Math.min(start.position.z, end.position.z) - 65;
  const route = (radius: number) => {
    const points = [
      start.position.clone(),
      start.position.clone().addScaledVector(start.direction, 24),
      new Vector3(start.position.x - 60, 80, rearZ),
    ];
    for (let index = 0; index <= 48; index += 1) {
      const progress = index / 48;
      const angle = Math.PI + progress * Math.PI * 4;
      points.push(
        new Vector3(
          centerX + Math.cos(angle) * radius - progress * 9,
          cableRadius + 1 + progress * 8,
          rearZ - radius / 2 + (Math.sin(angle) * radius) / 2
        )
      );
    }
    points.push(
      new Vector3(end.position.x - 55, 30, rearZ + 15),
      end.position.clone().addScaledVector(end.direction, 24),
      end.position.clone()
    );
    const curve = new CatmullRomCurve3(points, false, "centripetal");
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
  cover: MeshPhysicalMaterial
): CableEndpoint {
  const connector = new Group();
  connector.name = `AudioQuest Cinnamon ${type.toUpperCase()} plug`;
  connector.position
    .copy(endpoint.position)
    .addScaledVector(endpoint.direction, -7.5);
  connector.quaternion.setFromUnitVectors(
    new Vector3(0, 0, 1),
    endpoint.direction
  );
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
  connector.add(
    parts.box(
      type === "usb-a" ? [10.5, 1.3, 7] : [4.6, 3.4, 6],
      [0, type === "usb-a" ? 0.8 : -0.8, 4.5],
      parts.black,
      "USB insulating contact tongue",
      0.15
    )
  );
  for (const index of [0, 1, 2, 3]) {
    connector.add(
      parts.box(
        [0.7, 0.15, 4.5],
        type === "usb-a"
          ? [(index - 1.5) * 2.3, 0.08, 3.8]
          : [index % 2 === 0 ? -1.65 : 1.65, index < 2 ? 0.98 : -2.58, 4.5],
        parts.gold,
        "USB gold contact",
        0.03
      )
    );
  }
  const markWidth = type === "usb-a" ? 12 : 9;
  const mark = parts.print(
    markWidth,
    12,
    [0, type === "usb-a" ? 4.45 : 6.05, 16],
    (context) => {
      context.translate(markWidth / 2, 6);
      context.scale(markWidth / 12, 1);
      drawCinnamonMark(context);
    },
    "CINNAMON lettering and USB symbol",
    512
  );
  mark.rotation.x = -Math.PI / 2;
  connector.add(mark);
  parts.root.add(connector);
  return {
    position: connector.position
      .clone()
      .addScaledVector(endpoint.direction, 36),
    direction: endpoint.direction.clone(),
  };
}

/** 外観の参照: dm-importaudio.jp/audioquest/lineup/detail1/index1385.html */
export function createAudioquestCinnamon(
  usbA: CableEndpoint,
  usbB: CableEndpoint
) {
  const parts = createModelParts({ brushed: false });
  parts.root.name = "AudioQuest Cinnamon USB 2.0 A–B 1.5 m — USB2/CIN/1.5";
  const cover = new MeshPhysicalMaterial({
    color: 0x83_16_1c,
    metalness: 0.65,
    roughness: 0.3,
    clearcoat: 0.55,
    clearcoatRoughness: 0.24,
  });
  const start = cinnamonPlug(parts, usbA, "usb-a", cover);
  const end = cinnamonPlug(parts, usbB, "usb-b", cover);
  const curve = cinnamonCableCurve(start, end);
  const braid = cinnamonBraidTexture(curve.getLength(), cableRadius);
  const jacket = new MeshStandardMaterial({
    map: braid,
    bumpMap: braid,
    bumpScale: 0.12,
    roughness: 0.86,
  });
  const cable = parts.mesh(
    new TubeGeometry(curve, 600, cableRadius, 12, false),
    jacket,
    [0, 0, 0],
    "Cinnamon red/black braided cable, 1.5 m"
  );
  cable.userData["lengthMm"] = cableLength;
  return {
    group: parts.root,
    dispose() {
      parts.dispose();
      braid.dispose();
    },
  };
}

export function createStandaloneCinnamon() {
  return createAudioquestCinnamon(
    { position: new Vector3(-35, 14, 160), direction: new Vector3(0, 0, -1) },
    { position: new Vector3(25, 14, 160), direction: new Vector3(0, 0, -1) }
  );
}
