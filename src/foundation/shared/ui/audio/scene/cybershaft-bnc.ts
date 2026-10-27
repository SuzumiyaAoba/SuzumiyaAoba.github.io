import {
  ExtrudeGeometry,
  Shape,
  CubicBezierCurve3,
  CurvePath,
  Group,
  LineCurve3,
  Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { bncBayonetGeometry, bncGroundContactGeometry } from "./bnc-geometry";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";
import type { ModelParts } from "./parts";
import type { CableEndpoint } from "./system-cables";

const cableRadius = 2.1;
const connectorLength = 33;
const insertionDepth = 8.3;

/** セミリジッドの形状を保ち、端子直後の直線から緩やかな弧につなぐ。 */
export function cybershaftCableCurve(start: CableEndpoint, end: CableEndpoint) {
  const startLead = start.position.clone().addScaledVector(start.direction, 18);
  const endLead = end.position.clone().addScaledVector(end.direction, 18);
  const bendDepth = Math.max(90, startLead.distanceTo(endLead));
  const curve = new CurvePath<Vector3>();
  curve.add(new LineCurve3(start.position.clone(), startLead));
  curve.add(
    new CubicBezierCurve3(
      startLead,
      startLead.clone().addScaledVector(start.direction, bendDepth),
      endLead.clone().addScaledVector(end.direction, bendDepth),
      endLead
    )
  );
  curve.add(new LineCurve3(endLead, end.position.clone()));
  return curve;
}

function bncPlug(
  parts: ModelParts,
  endpoint: CableEndpoint,
  name: string,
  connected: boolean
) {
  const connector = new Group();
  connector.name = `Cybershaft 50Ω BNC plug — ${name}`;
  connector.position
    .copy(endpoint.position)
    .addScaledVector(endpoint.direction, connected ? -insertionDepth : 0);
  connector.quaternion.setFromUnitVectors(
    new Vector3(0, 0, 1),
    endpoint.direction
  );
  const sleeve = parts.lathe(
    [
      [4.07, 8.7],
      [5.45, 12.5],
      [5.45, 13.3],
      [5.2, 13.55],
      [5.2, 14.5],
      [5.4, 14.7],
      [5.4, 15.1],
      [5, 15.4],
      [3.15, 17.2],
      [3.15, 21.8],
      [2.1, 21.8],
      [2.1, 9],
      [4.07, 8.7],
    ],
    [0, 0, 0],
    parts.turned,
    "Nickel-plated BNC bayonet sleeve seated over socket"
  );
  const collar = parts.mesh(
    bncBayonetGeometry(),
    parts.turned,
    [0, 0, 0],
    "BNC rotating collar with two open L shaped bayonet slots"
  );
  const knurlCount = 96;
  const tooth = new Shape();
  tooth.moveTo(6.86, -0.14);
  tooth.lineTo(7.04, 0);
  tooth.lineTo(6.86, 0.14);
  tooth.closePath();
  const knurl = parts.instanced(
    new ExtrudeGeometry(tooth, {
      depth: 3.85,
      bevelEnabled: true,
      bevelSize: 0.018,
      bevelThickness: 0.05,
      bevelSegments: 2,
    }),
    parts.turned,
    knurlCount,
    "Fine longitudinal knurl on BNC collar"
  );
  const matrix = new Matrix4();
  for (let index = 0; index < knurlCount; index += 1) {
    matrix.makeRotationZ((index / knurlCount) * Math.PI * 2);
    matrix.setPosition(0, 0, 7.95);
    knurl.setMatrixAt(index, matrix);
  }
  knurl.instanceMatrix.needsUpdate = true;
  const shrink = parts.lathe(
    [
      [3.18, 18],
      [3.48, 18],
      [3.53, 18.25],
      [3.48, 20],
      [3.35, 22.2],
      [3.2, 23],
      [2.6, 24.2],
      [2.48, 25.3],
      [2.48, 30.7],
      [2.5, 32.6],
      [2.42, 33],
      [2.1, 33],
      [2.1, 25.3],
      [2.3, 24],
      [3.18, 22.2],
      [3.18, 18],
    ],
    [0, 0, 0],
    parts.rubber,
    "Black tapered heat-shrink termination"
  );
  connector.add(sleeve, collar, knurl, shrink);
  connector.add(
    parts.mesh(
      bncGroundContactGeometry(),
      parts.turned,
      [0, 0, 0.5],
      "Four slotted BNC ground spring contacts"
    )
  );
  const ptfe = new MeshStandardMaterial({ color: 0xf1_f0_e8, roughness: 0.64 });
  // 50 Ω interface: 7 mm dielectric around a 4.93 mm mating bore.
  connector.add(
    parts.lathe(
      [
        [2.465, 5.4],
        [2.465, 0.5],
        [3.45, 0.5],
        [3.48, 0.6],
        [3.48, 8.9],
        [0.68, 8.9],
        [0.68, 5.4],
        [2.465, 5.4],
      ],
      [0, 0, 0],
      ptfe,
      "Exposed BNC white dielectric"
    )
  );
  connector.add(
    parts.lathe(
      [
        [0, 0.45],
        [0.25, 0.53],
        [0.5, 0.85],
        [0.675, 1.3],
        [0.675, 7.8],
        [0, 7.8],
      ],
      [0, 0, 0],
      parts.gold,
      "Exposed BNC gold centre pin"
    )
  );
  parts.root.add(connector);
  return {
    position: connector.position
      .clone()
      .addScaledVector(endpoint.direction, connectorLength),
    direction: endpoint.direction.clone(),
  };
}

/** メーカー写真を基にした外観。部品寸法・配線の長さは表示用の推定値。
 * https://www.cybershaft.jp/option01/semirg02.html
 */
export function createCybershaftBnc(
  clockOutput: CableEndpoint,
  clockInput: CableEndpoint,
  { connected = true }: { connected?: boolean } = {}
) {
  const parts = createModelParts({ brushed: false });
  parts.root.name = "Cybershaft 50Ω BNC semi-rigid cable — RG402";
  parts.turned.color.setHex(0xd5_d6_d5);
  parts.turned.roughness = 0.3;
  parts.turned.metalness = 0.96;
  parts.rubber.color.setHex(0x30_31_38);
  parts.rubber.roughness = 0.7;
  const start = bncPlug(
    parts,
    clockOutput,
    connected ? "CG-10M 10 MHz OUT 1" : "First connector",
    connected
  );
  const end = bncPlug(
    parts,
    clockInput,
    connected ? "UD-505 CLOCK SYNC IN" : "Second connector",
    connected
  );
  // 青い樹脂被覆の弱い光沢と細かな成形肌。
  const jacket = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x00_4c_bf,
      roughness: 0.48,
      specularIntensity: 0.35,
      envMapIntensity: 0.65,
      clearcoat: 0.04,
      clearcoatRoughness: 0.35,
    }),
    { scale: [8, 8, 8], relief: 0.002, roughness: 0.04 }
  );
  parts.mesh(
    new TubeGeometry(
      cybershaftCableCurve(start, end),
      160,
      cableRadius,
      24,
      false
    ),
    jacket,
    [0, 0, 0],
    "Cybershaft blue semi-rigid coaxial cable"
  );
  return {
    group: parts.root,
    dispose() {
      parts.dispose();
    },
  };
}

export function createStandaloneCybershaftBnc() {
  return createCybershaftBnc(
    { position: new Vector3(-35, 7.2, 65), direction: new Vector3(0, 0, -1) },
    { position: new Vector3(35, 7.2, 65), direction: new Vector3(0, 0, -1) },
    { connected: false }
  );
}
