import { useEffect, useRef } from "react";

export function useReadingProgress(isReading: boolean) {
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReading) {
      return;
    }
    let frame = 0;
    const update = () => {
      if (!progressBarRef.current) {
        return;
      }
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
      progressBarRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = globalThis.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) {
        globalThis.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isReading]);

  return progressBarRef;
}
