import { Group, Object3D, Vector3 } from "three";
import { expect, it } from "vitest";
import { ie600CableBranchCurve } from "./ie-600-cable";
import { cableEndpoint } from "./system-cables";

it.each([-1, 1])(
  "左右を反転しても耳掛けからケーブルを折れずにつなぐ (%s)",
  (side) => {
    const shell = new Group();
    shell.position.set(side * 25, 14, 0);
    shell.scale.x = side;
    const exit = new Object3D();
    exit.position.set(39, 15, 6);
    exit.quaternion.setFromUnitVectors(
      new Vector3(0, 0, 1),
      new Vector3(1, -1, 1).normalize()
    );
    shell.add(exit);
    const endpoint = cableEndpoint(exit, [0, 0, 0]);
    const junction = new Vector3(side * 0.65, 2.1, 48);
    const curve = ie600CableBranchCurve(endpoint, junction);

    expect(curve.getPoint(0).distanceTo(endpoint.position)).toBeLessThan(0.001);
    expect(
      curve.getTangent(0).dot(new Vector3(side, -1, 1).normalize())
    ).toBeGreaterThan(0.999);
    expect(curve.getPoint(1).distanceTo(junction)).toBeLessThan(0.001);
    expect(curve.getTangent(1).z).toBeGreaterThan(0.999);
    expect(
      Math.min(...curve.getPoints(128).map((point) => point.y))
    ).toBeGreaterThanOrEqual(2.1);
  }
);
