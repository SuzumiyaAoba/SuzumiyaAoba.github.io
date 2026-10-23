import {
  Box3,
  CatmullRomCurve3,
  Group,
  Object3D,
  SphereGeometry,
  ShapeGeometry,
  Vector3,
} from "three";
import {
  ie600BoreGeometry,
  ie600ConnectorGripGeometry,
  ie600GripMarkGeometry,
  ie600ContactSleeveGeometry,
  ie600EarTipRim,
  ie600EarHookRelief,
  ie600EarHookReliefGeometry,
  ie600MmcxPinGeometry,
  ie600SocketRimGeometry,
  ie600BalancedPlugDimensions,
  ie600TipGuardGeometry,
  ie600EarTipGeometry,
  ie600ShellGeometry,
} from "./ie-600-geometry";
import { ie600Cable, ie600CableBranchCurve } from "./ie-600-cable";
import { cableEndpoint } from "./system-cables";
import { createIe600Parts } from "./ie-600-parts";
import type { Ie600Parts } from "./ie-600-parts";

import { ie600BalancedPlug, ie600Splitter } from "./ie-600-hardware";
import { ie600Vent, ie600VentOutline } from "./ie-600-vent";

const socketPosition = new Vector3(4.1, 10.8, 0);
const connectorDirection = new Vector3(-0.4, 1, 0).normalize();
const detachedOffset = 5.5;
const seatedOffset = -0.9;

function nozzle(parts: Ie600Parts, shell: Group) {
  const group = new Group();
  group.name = "IE 600 angled acoustic nozzle and silicone ear tip";
  group.position.set(-6, 0, -2.8);
  group.quaternion.setFromUnitVectors(
    new Vector3(0, 0, 1),
    new Vector3(-0.55, 0.16, -0.82).normalize()
  );
  shell.add(group);
  group.add(
    parts.lathe(
      [
        [1.3, -1.2],
        [3.4, -1.2],
        [3.4, -0.7],
        [3.2, 0],
        [2.85, 0.7],
        [2.6, 1.3],
        [2.6, 2.8],
        [1.3, 2.8],
        [1.3, -1.2],
      ],
      [0, 0, 0],
      parts.zirconium,
      "Rounded zirconium shoulder beneath the sound nozzle"
    ),
    parts.mesh(
      ie600BoreGeometry(2.6, 1.3, 4.5),
      parts.zirconium,
      [0, 0, 0],
      "Open metal sound nozzle"
    ),
    parts.mesh(
      ie600EarTipGeometry(),
      parts.silicone,
      [0, 0, 3],
      "Hollow black silicone ear tip"
    ),
    parts.ring(2.7, 0.15, [0, 0, 2.6], parts.silicone, "Ear tip retaining lip"),
    parts.mesh(
      ie600TipGuardGeometry(),
      parts.connectorRubber,
      [0, 0, 10.75],
      "Two concentric hexagonal sound channel guards"
    )
  );
  group.add(
    parts.ring(
      ie600EarTipRim.radius + 0.006,
      0.012,
      [0, 0, 3 + ie600EarTipRim.depth],
      parts.connectorRubber,
      "Fine silicone mould seam"
    )
  );
  group.add(
    parts.disc(
      1.55,
      [0, 0, 9.9],
      parts.acousticFoam,
      "Recessed acoustic foam behind the ear tip guard"
    )
  );
}

function connector(
  parts: Ie600Parts,
  shell: Group,
  side: number,
  detached: boolean
) {
  const offset = detached ? detachedOffset : seatedOffset;
  const group = new Group();
  group.name = "Recessed Fidelity (+) MMCX connection";
  group.position.copy(socketPosition);
  group.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), connectorDirection);
  shell.add(group);
  group.add(
    parts.mesh(
      ie600SocketRimGeometry(),
      parts.black,
      [0, 0, 0],
      "Recessed MMCX socket rim"
    ),
    parts.mesh(
      ie600BoreGeometry(1.96, 1.84, 1.85),
      parts.cavity,
      [0, 0, -1.35],
      "Dark MMCX socket inner wall"
    ),
    parts.mesh(
      ie600BoreGeometry(1.8, 1.3, 1.6),
      parts.connectorGold,
      [0, 0, -1.15],
      "Recessed gold plated MMCX socket contact"
    ),
    parts.mesh(
      ie600ConnectorGripGeometry(),
      parts.connectorRubber,
      [0, 0, offset],
      "Tapered moulded Fidelity MMCX cable grip"
    ),
    parts.mesh(
      ie600BoreGeometry(2.835, 2.72, 0.32),
      side === 1 ? parts.rightMarker : parts.black,
      [0, 0, 2.2 + offset],
      side === 1
        ? "Right channel red identification ring"
        : "Left channel collar"
    )
  );
  group.add(
    parts.disc(
      1.8,
      [0, 0, -1.6],
      parts.cavity,
      "Dark recessed MMCX socket floor"
    ),
    parts.mesh(
      ie600BoreGeometry(0.4, 0.22, 0.65),
      parts.connectorGold,
      [0, 0, -0.95],
      "Recessed MMCX centre signal contact"
    ),
    parts.mesh(
      ie600BoreGeometry(1.24, 0.4, 0.65),
      parts.contactInsulator,
      [0, 0, -1],
      "Recessed MMCX socket dielectric"
    ),
    parts.mesh(
      ie600ContactSleeveGeometry(),
      parts.connectorGold,
      [0, 0, offset - 0.3],
      "Hollow MMCX male contact sleeve"
    ),
    parts.mesh(
      ie600MmcxPinGeometry(),
      parts.connectorGold,
      [0, 0, offset - 0.05],
      "Rounded MMCX centre signal pin"
    ),
    parts.mesh(
      ie600BoreGeometry(0.78, 0.24, 0.7),
      parts.contactInsulator,
      [0, 0, offset + 0.8],
      "MMCX male pin dielectric bushing"
    ),
    parts.lathe(
      [
        [0.78, 1.7],
        [1.75, 1.7],
        [1.9, 1.8],
        [1.9, 2.05],
        [1.75, 2.15],
        [1.65, 2.3],
        [0.78, 2.3],
        [0.78, 1.7],
      ],
      [0, 0, offset],
      parts.connectorGold,
      "Chamfered MMCX locking shoulder"
    ),
    parts.ring(
      2.82,
      0.018,
      [0, 0, offset + 2.65],
      parts.cavity,
      "Fine connector mould parting seam"
    )
  );
  const lettering = parts.print(
    1.4,
    1.8,
    [0, 0, 0],
    (context) => {
      if (side === -1) {
        context.translate(1.4, 0);
        context.scale(-1, 1);
      }
      context.fillStyle = "#5e6061";
      context.font = "1.55px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(side === -1 ? "L" : "R", 0.7, 0.9);
    },
    "MMCX channel mark texture",
    256
  );
  parts.root.remove(lettering);
  group.add(
    parts.mesh(
      ie600GripMarkGeometry(),
      lettering.material,
      [0, 0, offset],
      "Moulded channel letter on the curved cable grip"
    )
  );
  if (side === -1) {
    group.add(
      parts.mesh(
        new SphereGeometry(0.22, 16, 12),
        parts.black,
        [0, -2.75, 4.25 + offset],
        "Left channel tactile identification dot"
      )
    );
  }
}

function earHook(
  parts: Ie600Parts,
  shell: Group,
  channel: string,
  detached: boolean
) {
  const offset = detached ? detachedOffset : seatedOffset;
  const start = socketPosition
    .clone()
    .addScaledVector(connectorDirection, 10.55 + offset);
  const points = [
    start,
    start.clone().addScaledVector(connectorDirection, 3),
    new Vector3(4, 37, 0.3),
    new Vector3(17, 36.5, 0.4),
    new Vector3(29, 27, 1),
    new Vector3(35, 19, 2),
    new Vector3(39, 15, 6),
  ];
  const curve = new CatmullRomCurve3(points);
  ie600Cable(
    parts,
    shell,
    curve,
    1.22,
    "Adjustable reinforced over ear hook",
    true
  );
  const end = curve.getPoint(1);
  const direction = curve.getTangent(1);
  const relief = parts.mesh(
    ie600EarHookReliefGeometry(),
    parts.connectorRubber,
    [0, 0, 0],
    "Tapered ear hook strain relief"
  );
  relief.position
    .copy(end)
    .addScaledVector(direction, -ie600EarHookRelief.hookInset);
  relief.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), direction);
  shell.add(relief);
  const exit = new Object3D();
  exit.name = `IE 600 ${channel} cable exit`;
  exit.position
    .copy(end)
    .addScaledVector(
      direction,
      ie600EarHookRelief.length - ie600EarHookRelief.hookInset
    );
  exit.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), direction);
  shell.add(exit);
  return exit;
}

function displayCable(parts: Ie600Parts, exits: Object3D[]) {
  const junction = new Vector3(0, 2.8, 44);
  for (const exit of exits) {
    const endpoint = cableEndpoint(exit, [0, 0, 0]);
    const branchEntry = junction.clone();
    branchEntry.x = Math.sign(endpoint.position.x) * 0.65;
    const path = ie600CableBranchCurve(endpoint, branchEntry);
    ie600Cable(
      parts,
      parts.root,
      path,
      ie600EarHookRelief.cableRadius,
      "Shortened detachable earphone cable branch"
    );
  }
  ie600Splitter(parts, parts.root, junction);
  ie600Cable(
    parts,
    parts.root,
    new CatmullRomCurve3([
      new Vector3(0, 2.8, 66),
      new Vector3(0, 2.8, 70),
      new Vector3(-17, 2.8, 72),
      new Vector3(-33, 2.8, 70),
      new Vector3(-38, 2.1, 77),
      new Vector3(
        ie600BalancedPlugDimensions.cableEntry - 4,
        2.1,
        85 + ie600BalancedPlugDimensions.cableDepth
      ),
      new Vector3(
        3 + ie600BalancedPlugDimensions.cableEntry,
        2.1,
        85 + ie600BalancedPlugDimensions.cableDepth
      ),
    ]),
    0.85,
    "Shortened para aramid reinforced main cable"
  );
  ie600BalancedPlug(parts, parts.root, new Vector3(3, 2.1, 85));
}

export function createIe600({ standaloneCable = true } = {}) {
  const parts = createIe600Parts();
  parts.root.name = "Sennheiser IE 600 — estimated millimetres";
  const exits: Object3D[] = [];
  for (const side of [-1, 1]) {
    const channel = side === -1 ? "Left" : "Right";
    const shell = new Group();
    shell.name = `IE 600 ${channel} earpiece`;
    shell.position.set(side * 25, 14, 0);
    shell.scale.x = side;
    parts.root.add(shell);
    shell.add(
      parts.mesh(
        ie600ShellGeometry(),
        side === -1 ? parts.leftHousing : parts.rightHousing,
        [0, 0, 0],
        "Amorphous zirconium ergonomic housing"
      ),
      parts.mesh(
        new ShapeGeometry(ie600VentOutline()),
        parts.cavity,
        [0, 0, ie600Vent.floor],
        "Dark floor inside the shell pressure vent"
      )
    );
    nozzle(parts, shell);
    const detached = standaloneCable && side === -1;
    connector(parts, shell, side, detached);
    exits.push(earHook(parts, shell, channel, detached));
  }
  parts.root.updateMatrixWorld(true);
  if (standaloneCable) {
    displayCable(parts, exits);
  }
  const bounds = new Box3().setFromObject(parts.root);
  parts.root.position.y = -bounds.min.y;
  return { group: parts.root, dispose: () => parts.dispose() };
}
