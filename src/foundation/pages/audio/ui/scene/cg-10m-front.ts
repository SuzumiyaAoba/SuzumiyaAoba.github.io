import {
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Path,
  Shape,
  SphereGeometry,
} from "three";
import type { ModelParts } from "./parts";

const FRONT = 115;
const METER_Y = 44.5;
const METER_RADIUS = 16.8;

function dialFace(parts: ModelParts) {
  const illumination = new MeshBasicMaterial({
    color: 0xb0_d7_f3,
    toneMapped: false,
  });
  parts.disc(
    METER_RADIUS,
    [0, METER_Y, FRONT - 0.6],
    illumination,
    "Backlit blue oven-status dial"
  );
  parts.print(
    METER_RADIUS * 2,
    METER_RADIUS * 2,
    [0, METER_Y, FRONT - 0.55],
    (context) => {
      context.translate(METER_RADIUS, METER_RADIUS);
      context.fillStyle = "#101d29";
      context.strokeStyle = "#263746";
      context.lineWidth = 0.17;
      const radius = 13.3;
      const start = -Math.PI * 0.77;
      const sweep = Math.PI * 0.54;
      for (let index = 0; index <= 20; index += 1) {
        const angle = start + (index / 20) * sweep;
        const tick = index % 4 === 0 ? 1.6 : 0.9;
        context.strokeStyle = index > 12 ? "#aa4252" : "#263746";
        context.beginPath();
        context.moveTo(Math.cos(angle) * radius, 4 + Math.sin(angle) * radius);
        context.lineTo(
          Math.cos(angle) * (radius - tick),
          4 + Math.sin(angle) * (radius - tick)
        );
        context.stroke();
        if (index % 4 === 0) {
          context.save();
          context.translate(
            Math.cos(angle) * (radius + 1.6),
            4 + Math.sin(angle) * (radius + 1.6)
          );
          context.rotate(angle + Math.PI / 2);
          context.fillStyle = index > 12 ? "#aa4252" : "#263746";
          context.font = "1.8px Arial";
          context.textAlign = "center";
          context.fillText(String(index / 2), 0, 0);
          context.restore();
        }
      }
      context.strokeStyle = "#263746";
      context.beginPath();
      context.arc(0, 4, radius, start, start + sweep);
      context.stroke();
      context.beginPath();
      context.arc(0, 4, radius - 1.8, start, start + sweep);
      context.stroke();
      context.fillStyle = "#263746";
      context.font = "2.2px Arial";
      context.textAlign = "center";
      context.fillText("STATUS", 0, -4.8);
      context.font = "1.5px Arial";
      context.fillText("−", -12.6, -5);
      context.fillStyle = "#aa4252";
      context.fillText("+", 12.6, -5);
    },
    "Oven meter scale and legends",
    1024
  );

  const angle = 0.6;
  const needle = parts.box(
    [0.22, 15, 0.12],
    [-Math.sin(angle) * 7.5, METER_Y - 4 + Math.cos(angle) * 7.5, FRONT - 0.3],
    parts.cavity,
    "Static oven-status needle",
    0.02
  );
  needle.rotation.z = angle;

  const cover = new Shape();
  cover.moveTo(-16.8, -1);
  cover.lineTo(-7.5, -1);
  cover.quadraticCurveTo(0, 6, 7.5, -1);
  cover.lineTo(16.8, -1);
  cover.absarc(0, 0, 16.8, -0.06, -Math.PI + 0.06, true);
  cover.closePath();
  parts.mesh(
    new ExtrudeGeometry(cover, {
      depth: 0.4,
      bevelEnabled: false,
      curveSegments: 32,
    }),
    parts.cavity,
    [0, METER_Y, FRONT - 0.2],
    "Raised black meter movement cover"
  );
  parts.print(
    24,
    10,
    [0, METER_Y - 6, FRONT + 0.23],
    (context) => {
      context.font = "2.2px Arial";
      context.fillStyle = "#88929a";
      context.textAlign = "center";
      context.fillText("OVEN", 12, 5.8);
    },
    "Oven legend on meter cover",
    512
  );

  const lensMaterial = new MeshPhysicalMaterial({
    color: 0xe8_f3_ff,
    transparent: true,
    opacity: 0.045,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 0.3,
    specularIntensity: 0.25,
    envMapIntensity: 0.3,
    clearcoatRoughness: 0.06,
    depthWrite: false,
  });
  const lens = parts.mesh(
    new SphereGeometry(METER_RADIUS, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    lensMaterial,
    [0, METER_Y, FRONT + 0.55],
    "Domed meter glass"
  );
  lens.scale.y = 0.025;
  lens.rotation.x = Math.PI / 2;
}

export function createCg10mFront(parts: ModelParts) {
  const plate = new Shape();
  plate.moveTo(-137, 12.5);
  plate.lineTo(137, 12.5);
  plate.lineTo(137, 80.5);
  plate.lineTo(-137, 80.5);
  plate.closePath();
  const meterHole = new Path();
  meterHole.absarc(0, METER_Y, 19.2, 0, Math.PI * 2, true);
  plate.holes.push(meterHole);
  const powerHole = new Path();
  powerHole.moveTo(-120, 35);
  powerHole.lineTo(-120, 43);
  powerHole.absarc(-114, 43, 6, Math.PI, 0, true);
  powerHole.lineTo(-108, 35);
  powerHole.absarc(-114, 35, 6, 0, Math.PI, true);
  plate.holes.push(powerHole);
  const geometry = new ExtrudeGeometry(plate, {
    depth: 3.2,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.3,
    bevelSegments: 3,
    curveSegments: 32,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(
      index,
      (positions.getX(index) + 137) / 274,
      (positions.getY(index) - 12.5) / 68
    );
  }
  parts.mesh(
    geometry,
    parts.silver,
    [0, 0, 111.5],
    "CG-10M machined front plate"
  );
  parts.lathe(
    [
      [19.4, 0],
      [19.4, 0.4],
      [18.4, 1.1],
      [17.2, 0.5],
      [16.8, -0.2],
      [16.8, -2],
    ],
    [0, METER_Y, FRONT],
    parts.turned,
    "Countersunk silver meter bezel"
  );
  parts.ring(
    16.9,
    0.23,
    [0, METER_Y, FRONT + 0.15],
    parts.black,
    "Meter glass gasket"
  );
  dialFace(parts);

  parts.facePlate(
    [11.7, 19.7, 1],
    [-114, 39, FRONT - 0.3],
    parts.steel,
    "Power switch bezel",
    5.5
  );
  parts.facePlate(
    [5.9, 12.2, 1.2],
    [-114, 38.2, FRONT + 0.3],
    parts.cavity,
    "Power switch opening",
    2.9
  );
  const toggle = parts.lathe(
    [
      [0, 0],
      [2.7, 0],
      [2.7, 1],
      [1.6, 1.7],
      [1.6, 7],
      [1.2, 7.5],
      [0, 7.5],
    ],
    [-114, 40.4, FRONT + 1],
    parts.turned,
    "CG-10M power toggle"
  );
  toggle.rotation.x = Math.PI / 2 - 0.12;
  parts.print(
    274,
    68,
    [0, 46.5, FRONT + 0.45],
    (context) => {
      context.textAlign = "center";
      context.font = "bold 8px Georgia, serif";
      context.fillStyle = "#74777a";
      context.fillText("TEAC", 25, 13.5);
      context.fillStyle = "#35383b";
      context.font = "2.2px Arial";
      context.fillText("POWER", 23, 26.5);
      context.font = "1.9px Arial";
      context.fillText("ON", 23, 30.8);
      context.fillText("OFF", 23, 55);
      context.font = "2.5px Arial";
      context.fillText("CG-10M", 256, 64);
    },
    "CG-10M front-panel silk-screen legends"
  );
}
