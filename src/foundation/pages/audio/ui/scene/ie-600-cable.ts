import { CatmullRomCurve3, TubeGeometry } from "three";
import type { Group } from "three";
import type { Ie600Parts } from "./ie-600-parts";

/** 半透明の被覆の中に、曲線に沿って撚った導線を配置する。 */
export function ie600Cable(
  parts: Ie600Parts,
  parent: Group,
  curve: CatmullRomCurve3,
  radius: number,
  name: string
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
      const angle = (turns * ratio + strand / 4) * Math.PI * 2;
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
  const sheath = parts.mesh(
    new TubeGeometry(curve, segments, radius, 16, false),
    parts.cableJacket,
    [0, 0, 0],
    `${name} translucent jacket`
  );
  sheath.renderOrder = 1;
  parent.add(sheath);
}
