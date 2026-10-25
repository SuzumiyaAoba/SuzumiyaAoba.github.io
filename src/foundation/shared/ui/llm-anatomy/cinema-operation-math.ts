export function cinemaClamp(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

export function cinemaOutputLayout(
  count: number,
  mobile: boolean,
  originY?: number
) {
  const layout = mobile
    ? { columns: 4, width: 124, height: 48, gapX: 136, gapY: 57, startX: 96 }
    : count <= 4
      ? {
          columns: 2,
          width: 132,
          height: 66,
          gapX: 148,
          gapY: 84,
          startX: 1170,
        }
      : {
          columns: 4,
          width: 94,
          height: 66,
          gapX: 102,
          gapY: 84,
          startX: 1070,
        };
  return {
    ...layout,
    startY:
      originY ?? (mobile ? (count > 8 ? 632 : 665) : count > 8 ? 210 : 260),
  };
}

export function cinemaOutputCell(
  count: number,
  index: number,
  mobile: boolean,
  originY?: number
) {
  const layout = cinemaOutputLayout(count, mobile, originY);
  return {
    x: layout.startX + (index % layout.columns) * layout.gapX,
    y: layout.startY + Math.floor(index / layout.columns) * layout.gapY,
    width: layout.width,
    height: layout.height,
  };
}

/** 隣り合う最大2項だけを飛ばし、到着した積だけを部分和に加える。 */
export function cinemaTermState(
  terms: readonly { product: number }[],
  progress: number
) {
  const duration = 1.5;
  const cursor =
    cinemaClamp(progress) * Math.max(0, terms.length - 1 + duration);
  const items = terms.map((term, index) => {
    const travel = cinemaClamp((cursor - index) / duration);
    return {
      product: term.product,
      progress: travel,
      received: travel === 1,
      moving: travel > 0 && travel < 1,
    };
  });
  const received = items.filter((item) => item.received);
  return {
    items,
    receivedCount: received.length,
    partialSum: received.reduce((sum, item) => sum + item.product, 0),
    complete: items.length > 0 && received.length === items.length,
  };
}

export function cinemaNumber(value: number): string {
  if (value === Number.NEGATIVE_INFINITY) {
    return "−∞";
  }
  if (value === Number.POSITIVE_INFINITY) {
    return "∞";
  }
  if (Math.abs(value) > 0 && Math.abs(value) < 0.001) {
    return value.toExponential(2);
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

export function cinemaPathPoint(
  points: readonly (readonly [number, number])[],
  progress: number
) {
  const [first] = points;
  const last = points.at(-1);
  if (!first || !last) {
    throw new Error("数値の移動経路には始点と終点が必要です。");
  }
  const t = cinemaClamp(progress);
  if (t === 0) {
    return { x: first[0], y: first[1] };
  }
  if (t === 1) {
    return { x: last[0], y: last[1] };
  }
  const lengths = points
    .slice(1)
    .map(([x, y], index) =>
      Math.hypot(x - (points[index]?.[0] ?? 0), y - (points[index]?.[1] ?? 0))
    );
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * t;
  for (const [index, length] of lengths.entries()) {
    const start = points[index] ?? first;
    const end = points[index + 1] ?? last;
    if (remaining <= length && length > 0) {
      const fraction = remaining / length;
      return {
        x: start[0] + (end[0] - start[0]) * fraction,
        y: start[1] + (end[1] - start[1]) * fraction,
      };
    }
    remaining -= length;
  }
  return { x: last[0], y: last[1] };
}
