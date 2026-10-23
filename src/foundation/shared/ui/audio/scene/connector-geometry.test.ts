import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import {
  connectorShellGeometry,
  usbBOpening,
  usbBOutline,
} from "./connector-geometry";
import { createModelParts } from "./parts";
import { createRear } from "./rear";

it("USB-B の中心を塞がず、斜めのシールド壁に厚みを残す", () => {
  const geometry = connectorShellGeometry(usbBOutline, usbBOpening, 2.3);
  const material = new MeshBasicMaterial();
  const connector = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 8), new Vector3(0, 0, -1));
  expect(ray.intersectObject(connector)).toHaveLength(0);
  ray.ray.origin.set(4.4, 0, 8);
  expect(ray.intersectObject(connector).length).toBeGreaterThan(0);
  ray.ray.origin.set(3.8, 3.8, 8);
  expect(ray.intersectObject(connector)).toHaveLength(0);
  geometry.dispose();
  material.dispose();
});

it("背面端子のフランジが開口部を塞がず、接点の手前に空間を残す", () => {
  const parts = createModelParts();
  // 文字テクスチャは形状の遮蔽判定に関係しない。
  const rearParts = { ...parts, print: () => new Mesh(undefined, parts.black) };
  createRear(rearParts);
  parts.root.updateMatrixWorld(true);
  const ray = new Raycaster(
    new Vector3(-25.5, 56.7, -125),
    new Vector3(0, 0, 1)
  );
  const [usbHit] = ray.intersectObject(parts.root);
  expect(usbHit?.object.name).toBe("USB-B recessed socket");
  ray.ray.origin.set(-115, 47, -125);
  const [powerHit] = ray.intersectObject(parts.root);
  expect(powerHit?.object.name).toBe("IEC inlet cavity");
  parts.dispose();
});
