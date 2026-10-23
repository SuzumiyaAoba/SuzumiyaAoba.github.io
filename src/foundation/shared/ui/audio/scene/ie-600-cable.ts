import {
  CatmullRomCurve3,
  CubicBezierCurve3,
  TubeGeometry,
  Vector3,
} from "three";
import type { Curve, Group } from "three";
import { ie600CableTexture } from "./ie-600-textures";
import type { Ie600Parts } from "./ie-600-parts";
import type { CableEndpoint } from "./system-cables";

/** 耳掛けの出口の向きを保ち、分岐部へは軸に沿って滑らかに合流する。 */
export function ie600CableBranchCurve(exit: CableEndpoint, junction: Vector3) {
  return new CubicBezierCurve3(
    exit.position.clone(),
    exit.position.clone().addScaledVector(exit.direction, 16),
    junction.clone().add(new Vector3(0, 0, -18)),
    junction.clone()
  );
}

/** 半透明の被覆の中に、曲線に沿って撚った導線を配置する。 */
export function ie600Cable(
  parts: Ie600Parts,
  parent: Group,
  curve: Curve<Vector3>,
  radius: number,
  name: string,
  reinforced = false
) {
  const turns = curve.getLength() / 1.8;
  const segments = Math.max(192, Math.ceil(turns) * 8);
  parent.add(
    parts.mesh(
      new TubeGeometry(curve, segments, radius * 0.33, 12, false),
      parts.cableCore,
      [0, 0, 0],
      `${name} reinforced dark core`
    )
  );
  const frames = curve.computeFrenetFrames(segments, false);
  for (let strand = 0; strand < 4; strand += 1) {
    const points = [];
    for (let step = 0; step <= segments; step += 1) {
      const ratio = step / segments;
      const point = curve.getPointAt(ratio);
      const normal = frames.normals[step];
      const binormal = frames.binormals[step];
      if (!normal || !binormal) {
        continue;
      }
      const angle =
        ((reinforced ? 0 : turns * ratio) + strand / 4) * Math.PI * 2;
      point.addScaledVector(normal, Math.cos(angle) * radius * 0.43);
      point.addScaledVector(binormal, Math.sin(angle) * radius * 0.43);
      points.push(point);
    }
    parent.add(
      parts.mesh(
        new TubeGeometry(
          new CatmullRomCurve3(points),
          segments * 2,
          radius * 0.04,
          5,
          false
        ),
        parts.wire,
        [0, 0, 0],
        `${name} twisted conductor ${strand + 1}`
      )
    );
  }
  const jacket = parts.cableJacket.clone();
  if (reinforced) {
    jacket.opacity = 0.91;
    jacket.roughness = 0.42;
  } else {
    const texture = ie600CableTexture();
    texture.repeat.set(curve.getLength() / 4, 1);
    jacket.bumpMap = texture;
    jacket.bumpScale = 0.006;
    jacket.roughness = 0.48;
    jacket.addEventListener("dispose", () => texture.dispose());
  }
  const sheath = parts.mesh(
    new TubeGeometry(curve, segments, radius, 16, false),
    jacket,
    [0, 0, 0],
    `${name} translucent jacket`
  );
  sheath.renderOrder = 1;
  parent.add(sheath);
}
