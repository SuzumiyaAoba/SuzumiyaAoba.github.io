import {
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import type { BufferGeometry, Object3D } from "three";

export type CableEndpoint = { position: Vector3; direction: Vector3 };
type Plug = "rca" | "bnc" | "headphone" | "mini";
const plugDimensions: Record<Plug, readonly [number, number]> = {
  rca: [5.5, 25],
  bnc: [7, 28],
  headphone: [6.5, 38],
  mini: [3.8, 16],
};

/** モデルの寸法調整と背面パネルの回転を反映して、端子位置を求める。 */
export function cableEndpoint(
  panel: Object3D,
  position: readonly [number, number, number],
  direction: readonly [number, number, number] = [0, 0, 1]
): CableEndpoint {
  panel.updateWorldMatrix(true, false);
  return {
    position: panel.localToWorld(new Vector3(...position)),
    direction: new Vector3(...direction).transformDirection(panel.matrixWorld),
  };
}

export function createSystemCables() {
  const group = new Group();
  group.name = "Connected signal cables";
  const geometries: BufferGeometry[] = [];
  const materials: MeshStandardMaterial[] = [];
  const jacket = new MeshStandardMaterial({
    color: 0x20_23_28,
    roughness: 0.82,
  });
  const metal = new MeshStandardMaterial({
    color: 0xbf_c3_c8,
    metalness: 0.9,
    roughness: 0.3,
  });
  materials.push(jacket, metal);

  const cylinder = (
    endpoint: CableEndpoint,
    radius: number,
    length: number,
    offset: number,
    material: MeshStandardMaterial,
    name: string
  ) => {
    const geometry = new CylinderGeometry(radius, radius, length, 24);
    geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.quaternion.setFromUnitVectors(
      new Vector3(0, 1, 0),
      endpoint.direction
    );
    mesh.position
      .copy(endpoint.position)
      .addScaledVector(endpoint.direction, offset);
    group.add(mesh);
  };

  const plug = (
    endpoint: CableEndpoint,
    type: Plug,
    color: number,
    name: string
  ) => {
    const [radius, length] = plugDimensions[type];
    const marker = new MeshStandardMaterial({ color, roughness: 0.6 });
    materials.push(marker);
    cylinder(endpoint, radius, 9, 4.5, metal, `${name} metal collar`);
    cylinder(
      endpoint,
      radius * 0.9,
      length - 9,
      (length + 9) / 2,
      jacket,
      `${name} plug grip`
    );
    cylinder(
      endpoint,
      radius * 0.94,
      3,
      12,
      marker,
      `${name} identification ring`
    );
    cylinder(
      endpoint,
      radius * 0.58,
      7,
      length + 3.5,
      jacket,
      `${name} strain relief`
    );
    return {
      position: endpoint.position
        .clone()
        .addScaledVector(endpoint.direction, length + 7),
      direction: endpoint.direction,
    };
  };

  const usbPlug = (
    endpoint: CableEndpoint,
    type: "usb-a" | "usb-b",
    name: string
  ): CableEndpoint => {
    // 金属シェルをソケット内部に収め、グリップを端子面に近づける。
    const insertionDepth = 7.5;
    const seatedEndpoint: CableEndpoint = {
      position: endpoint.position
        .clone()
        .addScaledVector(endpoint.direction, -insertionDepth),
      direction: endpoint.direction,
    };
    const connector = new Group();
    connector.name = name;
    connector.position.copy(seatedEndpoint.position);
    connector.quaternion.setFromUnitVectors(
      new Vector3(0, 0, 1),
      endpoint.direction
    );
    const shieldGeometry =
      type === "usb-a"
        ? new BoxGeometry(12, 4.5, 8)
        : new ExtrudeGeometry(
            new Shape(
              [
                [-3.3, -3.4],
                [3.3, -3.4],
                [3.3, 1.5],
                [1.6, 3.2],
                [-1.6, 3.2],
                [-3.3, 1.5],
              ].map(([x, y]) => new Vector2(x, y))
            ),
            { depth: 8, bevelEnabled: false }
          );
    const shield = new Mesh(shieldGeometry, metal);
    shield.name = `${name} metal shield`;
    shield.position.z = type === "usb-a" ? 4 : 0;
    const gripGeometry = new BoxGeometry(
      type === "usb-a" ? 16 : 11,
      type === "usb-a" ? 8 : 12,
      20
    );
    const grip = new Mesh(gripGeometry, jacket);
    grip.name = `${name} molded rectangular grip`;
    grip.position.z = 18;
    geometries.push(shieldGeometry, gripGeometry);
    connector.add(shield, grip);
    group.add(connector);
    cylinder(seatedEndpoint, 2.8, 8, 32, jacket, `${name} strain relief`);
    return {
      position: seatedEndpoint.position
        .clone()
        .addScaledVector(endpoint.direction, 36),
      direction: endpoint.direction,
    };
  };

  const cable = (
    name: string,
    start: CableEndpoint,
    end: CableEndpoint,
    waypoints: readonly Vector3[],
    radius = 2.2
  ) => {
    const path = new CatmullRomCurve3(
      [
        start.position,
        start.position.clone().addScaledVector(start.direction, 18),
        ...waypoints,
        end.position.clone().addScaledVector(end.direction, 18),
        end.position,
      ],
      false,
      "centripetal"
    );
    const geometry = new TubeGeometry(path, 100, radius, 8, false);
    geometries.push(geometry);
    const mesh = new Mesh(geometry, jacket);
    mesh.name = name;
    group.add(mesh);
  };

  return {
    group,
    plug,
    usbPlug,
    cable,
    dispose() {
      for (const geometry of geometries) {
        geometry.dispose();
      }
      for (const material of materials) {
        material.dispose();
      }
    },
  };
}
