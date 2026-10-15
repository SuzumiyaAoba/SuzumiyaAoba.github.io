import {
  BoxGeometry,
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
import { bncBayonetGeometry } from "./bnc-geometry";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";
import type { ModelParts } from "./parts";
import type { CableEndpoint } from "./system-cables";

const cableRadius = 2.1;
const connectorLength = 31;
const insertionDepth = 5.8;

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
      [5.2, 8],
      [6.2, 8],
      [5.3, 9],
      [5.3, 16],
      [3.2, 19],
      [3.2, 22],
      [2.2, 22],
      [2.2, 9],
      [5.2, 8],
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
  const knurlCount = 64;
  const knurl = parts.instanced(
    new BoxGeometry(0.22, 0.16, 1.7),
    parts.turned,
    knurlCount,
    "Fine longitudinal knurl on BNC collar"
  );
  const matrix = new Matrix4();
  for (let index = 0; index < knurlCount; index += 1) {
    const angle = (index / knurlCount) * Math.PI * 2;
    matrix.makeRotationZ(angle);
    matrix.setPosition(Math.cos(angle) * 6.93, Math.sin(angle) * 6.93, 6.4);
    knurl.setMatrixAt(index, matrix);
  }
  knurl.instanceMatrix.needsUpdate = true;
  const shoulder = parts.ring(
    5.35,
    0.3,
    [0, 0, 15.2],
    parts.turned,
    "BNC machined rear shoulder"
  );
  const shrink = parts.lathe(
    [
      [0, 18.5],
      [3.4, 18.5],
      [3.4, 23],
      [2.65, 25.5],
      [2.5, connectorLength],
      [0, connectorLength],
    ],
    [0, 0, 0],
    parts.rubber,
    "Black tapered heat-shrink termination"
  );
  connector.add(sleeve, collar, knurl, shoulder, shrink);
  if (!connected) {
    connector.add(
      parts.cylinder(
        4.55,
        1.2,
        [0, 0, 1.6],
        new MeshStandardMaterial({ color: 0xeb_ea_e6, roughness: 0.75 }),
        "Exposed BNC white dielectric"
      ),
      parts.cylinder(
        0.65,
        1.4,
        [0, 0, 0.95],
        parts.gold,
        "Exposed BNC gold centre pin"
      )
    );
  }
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
  // 照明下の色を写真に合わせ、ACESによる青の色相変化と白い反射を抑える。
  const jacket = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x00_50_a3,
      toneMapped: false,
      roughness: 0.55,
      specularIntensity: 0.15,
      envMapIntensity: 0.3,
      clearcoat: 0.03,
      clearcoatRoughness: 0.5,
    }),
    { scale: [3, 3, 3], relief: 0.006, roughness: 0.04 }
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
