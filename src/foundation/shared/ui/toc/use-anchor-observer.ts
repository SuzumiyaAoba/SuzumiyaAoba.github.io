"use client";

import { useEffect, useState } from "react";

/** 監視対象や選択モードが変わるたびに、同じライフサイクルで監視を張り直す。 */
export function useAnchorObserver(watch: string[], single: boolean): string[] {
  const [activeAnchors, setActiveAnchors] = useState<string[]>([]);

  useEffect(() => {
    const visible = new Set<string>();
    // oxlint-disable-next-line unicorn/prefer-query-selector -- 見出し ID は数字・句読点を含むため CSS セレクターとして解釈しない。
    const elements = watch.flatMap((id) => document.getElementById(id) ?? []);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }

        if (visible.size > 0) {
          const items = watch.filter((id) => visible.has(id));
          setActiveAnchors(single ? items.slice(0, 1) : items);
          return;
        }

        const viewTop = entries[0]?.rootBounds?.top ?? 0;
        let closest: HTMLElement | undefined;
        let distance = Infinity;
        for (const element of elements) {
          const candidate = Math.abs(
            viewTop - element.getBoundingClientRect().top
          );
          if (candidate < distance) {
            closest = element;
            distance = candidate;
          }
        }
        setActiveAnchors(closest ? [closest.id] : []);
      },
      { rootMargin: "0px", threshold: 0.98 }
    );

    for (const element of elements) {
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [watch, single]);

  return activeAnchors;
}
