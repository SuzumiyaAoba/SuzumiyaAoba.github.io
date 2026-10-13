import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  Group,
  Object3D,
  SphereGeometry,
  Vector3,
} from "three";
import {
  ie600BoreGeometry,
  ie600ConnectorGripGeometry,
  ie600ContactSleeveGeometry,
  ie600EarTipRim,
  ie600MmcxPinGeometry,
  ie600SocketRimGeometry,
  ie600BalancedPlugGeometry,
  ie600BalancedPlugBodyGeometry,
  ie600BalancedPlugDimensions,
  ie600TipGuardGeometry,
  ie600EarTipGeometry,
  ie600ShellGeometry,
} from "./ie-600-geometry";
import { ie600Cable } from "./ie-600-cable";
import { createIe600Parts } from "./ie-600-parts";
import type { Ie600Parts } from "./ie-600-parts";

const socketPosition = new Vector3(4.1, 10.8, 0);
const connectorDirection = new Vector3(-0.4, 1, 0).normalize();
const detachedOffset = 5.5;
const seatedOffset = -0.7;

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
      "Six aperture silicone sound channel guard"
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
  for (const offset of [-0.7, 0, 0.7]) {
    const chord = 2 * Math.sqrt(1.3 ** 2 - offset ** 2);
    group.add(
      parts.mesh(
        new BoxGeometry(chord, 0.16, 0.15),
        parts.steel,
        [0, offset, 4.7],
        "Recessed acoustic grille web"
      )
    );
  }
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
  ie600Cable(
    parts,
    shell,
    new CatmullRomCurve3(points),
    0.9,
    "Adjustable reinforced over ear hook"
  );
  const relief = parts.cylinder(
    1.15,
    4.6,
    [37.6, 16.4, 4.6],
    parts.black,
    "Ear hook strain relief"
  );
  relief.quaternion.setFromUnitVectors(
    new Vector3(0, 1, 0),
    new Vector3(4, -4, 4).normalize()
  );
  shell.add(relief);
  const exit = new Object3D();
  exit.name = `IE 600 ${channel} cable exit`;
  exit.position.set(39, 15, 6);
  exit.quaternion.setFromUnitVectors(
    new Vector3(0, 0, 1),
    new Vector3(4, -4, 4).normalize()
  );
  shell.add(exit);
  return exit;
}

function displayCable(parts: Ie600Parts, exits: Object3D[]) {
  const junction = new Vector3(0, 2.1, 48);
  for (const exit of exits) {
    const start = exit.getWorldPosition(new Vector3());
    const path = new CatmullRomCurve3([
      start,
      new Vector3(start.x * 0.94, start.y - 3, start.z + 4),
      new Vector3(start.x * 0.75, 3, 26),
      new Vector3(start.x * 0.4, 2.1, 40),
      junction,
    ]);
    ie600Cable(
      parts,
      parts.root,
      path,
      0.6,
      "Shortened detachable earphone cable branch"
    );
  }
  parts.lathe(
    [
      [0.65, 0],
      [1.2, 0],
      [1.8, 1.1],
      [1.9, 4.6],
      [1.4, 6.5],
      [0.8, 6.5],
      [0.65, 0],
    ],
    [0, 2.1, 46.5],
    parts.connectorRubber,
    "Tapered cable Y splitter"
  );
  ie600Cable(
    parts,
    parts.root,
    new CatmullRomCurve3([
      junction,
      new Vector3(0, 2.1, 60),
      new Vector3(-12, 2.1, 73),
      new Vector3(-18, 2.1, 83),
      new Vector3(ie600BalancedPlugDimensions.cableEntry - 4, 2.1, 85),
      new Vector3(3 + ie600BalancedPlugDimensions.cableEntry, 2.1, 85),
    ]),
    0.85,
    "Shortened para aramid reinforced main cable"
  );
  const plug = new Group();
  plug.name = "4.4 mm balanced five-pole plug";
  plug.position.set(3, 2.1, 85);
  parts.root.add(plug);
  plug.add(
    parts.mesh(
      ie600BalancedPlugBodyGeometry(),
      parts.connectorRubber,
      [0, 0, 0],
      "Right angled balanced plug overmould and tapered strain relief"
    ),
    parts.mesh(
      ie600BalancedPlugGeometry(),
      parts.connectorGold,
      [0, 0, ie600BalancedPlugDimensions.shaftStart],
      "Machined 4.4 mm gold plated five-pole plug"
    )
  );
  for (const length of ie600BalancedPlugDimensions.insulators) {
    plug.add(
      parts.mesh(
        ie600BoreGeometry(2.2, 2.1, 0.5),
        parts.black,
        [0, 0, ie600BalancedPlugDimensions.shaftStart + length],
        "Balanced plug insulating ring"
      )
    );
  }
  for (const [length, radius] of [
    [-8.7, 1.37],
    [-10.1, 1.3],
    [-11.5, 1.22],
  ] as const) {
    const rib = parts.ring(
      radius,
      0.09,
      [length, 0, 0],
      parts.connectorRubber,
      "Balanced plug flexible strain relief rib"
    );
    rib.rotation.y = Math.PI / 2;
    plug.add(rib);
  }
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
