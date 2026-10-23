import { Box3, CatmullRomCurve3, TubeGeometry } from "three";
import { createClearMgCup } from "./clear-mg-cups";
import {
  createClearFabricBores,
  createClearFoamCore,
  createClearMgParts,
} from "./clear-mg-parts";
import type { ClearMgParts } from "./clear-mg-parts";
import {
  clearMgBandGeometry,
  clearMgBandPerforations,
  clearMgBandPoint,
  clearMgBandSeam,
  clearMgSleeveGeometry,
} from "./clear-mg-geometry";
import { drawFocalWordmark } from "./focal-wordmark";

function headband(parts: ClearMgParts) {
  parts.mesh(
    clearMgBandGeometry(-clearMgBandSeam, clearMgBandSeam),
    parts.leather,
    [0, 0, 0],
    "Rounded leather headband with a continuous cross section"
  );
  const lining = clearMgBandGeometry(
    clearMgBandSeam,
    Math.PI * 2 - clearMgBandSeam
  );
  parts.mesh(
    lining,
    parts.bandFabric,
    [0, 0, 0],
    "Perforated red microfiber headband lining"
  );
  createClearFoamCore(
    parts,
    lining,
    "Dark headband foam behind the perforated lining"
  );
  createClearFabricBores(
    parts,
    clearMgBandPerforations(),
    "Recessed bores beneath the perforated headband lining"
  );
  for (const angle of [clearMgBandSeam, -clearMgBandSeam]) {
    const points = Array.from({ length: 129 }, (_, index) =>
      clearMgBandPoint(index / 128, angle)
    );
    parts.mesh(
      new TubeGeometry(new CatmullRomCurve3(points), 192, 0.13, 6, false),
      parts.lining,
      [0, 0, 0],
      "Sewn binding joining leather and microfiber"
    );
  }
  for (const side of [-1, 1]) {
    const sleeve = parts.mesh(
      clearMgSleeveGeometry(16.5),
      parts.coated,
      [side * 86.5, 152.5, 0],
      "Rounded metal headband end cap and slider sleeve"
    );
    sleeve.rotation.z = side * 0.267;
    const lip = parts.mesh(
      clearMgSleeveGeometry(0.25),
      parts.polished,
      [side * 88.7, 144.5, 0],
      "Machined lower edge of the headband sleeve"
    );
    lip.rotation.z = side * 0.267;
    const branding = parts.print(
      18,
      3.7,
      [side * 92.8, 154.2, 0],
      drawFocalWordmark,
      "Focal wordmark on the outer headband sleeve",
      512
    );
    branding.rotation.set(0, (side * Math.PI) / 2, side * 0.267, "ZYX");
    for (const z of [-13.7, 13.7]) {
      const screw = parts.screw([side * 88.8, 143.9, z], "bottom", true);
      screw.scale.setScalar(0.5);
      screw.rotation.z = side * 0.267;
    }
  }
}

/** Black/red Professional finish. Exterior dimensions estimated from Focal photos. */
export function createClearMgPro() {
  const parts = createClearMgParts();
  parts.root.name =
    "Focal Clear Mg Professional Black / Red — estimated millimetres";
  headband(parts);
  createClearMgCup(parts, -1);
  createClearMgCup(parts, 1);
  const bounds = new Box3().setFromObject(parts.root);
  parts.root.position.y = -bounds.min.y;
  return { group: parts.root, dispose: () => parts.dispose() };
}
