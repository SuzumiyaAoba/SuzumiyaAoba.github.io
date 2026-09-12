"use client";

import { useLayoutEffect, useRef, type HTMLAttributes, type RefObject } from "react";
import { calcThumb, updateThumb } from "./geometry";

type TocThumbProps = HTMLAttributes<HTMLDivElement> & {
  containerRef: RefObject<HTMLElement | null>;
  active: string[];
};

export function TocThumb({ containerRef, active, ...props }: TocThumbProps) {
  const thumbRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const thumb = thumbRef.current;
    if (!container || !thumb) return;
    const onUpdate = () => updateThumb(thumb, calcThumb(container, active));
    const observer = new ResizeObserver(onUpdate);
    observer.observe(container);
    onUpdate();
    return () => observer.disconnect();
  }, [containerRef, active]);
  return <div ref={thumbRef} role="none" {...props} />;
}
