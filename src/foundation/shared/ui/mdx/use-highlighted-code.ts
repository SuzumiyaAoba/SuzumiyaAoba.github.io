"use client";

import { useEffect, useState } from "react";
import { highlight } from "codehike/code";
import type { HighlightedCode, RawCode } from "codehike/code";

type HighlightState = {
  source: RawCode | RawCode[] | null;
  blocks: HighlightedCode[];
  hasError: boolean;
};

/** 古いリクエストを破棄し、ハイライト失敗も表示状態として扱う。 */
export function useHighlightedCode(source: RawCode | RawCode[]) {
  const [state, setState] = useState<HighlightState>({
    source: null,
    blocks: [],
    hasError: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const inputs = Array.isArray(source) ? source : [source];
        const blocks = await Promise.all(
          inputs.map(async (code) => highlight(code, "github-from-css")),
        );
        if (!cancelled) {
          setState({ source, blocks, hasError: false });
        }
      } catch {
        if (!cancelled) {
          setState({ source, blocks: [], hasError: true });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [source]);

  return state.source === source ? state : { source, blocks: [], hasError: false };
}
