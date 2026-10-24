"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { RefObject } from "react";

export const GENERATION_ANIMATION_DURATION = 36_000;

const FRAME_INTERVAL = 50;
const VISIBLE_RATIO = 0.35;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(listener: () => void) {
  if (typeof window.matchMedia !== "function") {
    return () => {
      // MediaQueryListがない環境では解除する購読もない。
    };
  }
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function getReducedMotion() {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_MOTION_QUERY).matches
    : false;
}

function getServerReducedMotion() {
  return false;
}

export function useGenerationPlayback(
  ref: RefObject<HTMLElement | null>,
  paused: boolean,
  rate = 1,
  duration = GENERATION_ANIMATION_DURATION,
  frameInterval = FRAME_INTERVAL
) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );
  const [elapsed, setElapsed] = useState(0);
  const [replayVersion, setReplayVersion] = useState(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      paused ||
      reducedMotion ||
      typeof IntersectionObserver !== "function" ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      return;
    }

    let inView = false;
    let requestId: number | undefined;
    let previousTime: number | undefined;
    let lastPaintTime = 0;

    function stop() {
      if (requestId !== undefined) {
        window.cancelAnimationFrame(requestId);
        requestId = undefined;
      }
      previousTime = undefined;
    }

    function tick(time: number) {
      requestId = undefined;
      if (!inView || document.hidden) {
        previousTime = undefined;
        return;
      }
      if (previousTime !== undefined) {
        elapsedRef.current = Math.min(
          duration,
          elapsedRef.current + (time - previousTime) * rate
        );
      }
      previousTime = time;
      if (
        time - lastPaintTime >= frameInterval ||
        elapsedRef.current === duration
      ) {
        setElapsed(elapsedRef.current);
        lastPaintTime = time;
      }
      if (elapsedRef.current < duration) {
        requestId = window.requestAnimationFrame(tick);
      }
    }

    function start() {
      if (
        inView &&
        !document.hidden &&
        requestId === undefined &&
        elapsedRef.current < duration
      ) {
        requestId = window.requestAnimationFrame(tick);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((candidate) => candidate.target === element);
        if (!entry) {
          return;
        }
        inView =
          entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO;
        if (inView) {
          start();
        } else {
          stop();
        }
      },
      { rootMargin: "0px", threshold: VISIBLE_RATIO }
    );

    function onVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    observer.observe(element);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    duration,
    frameInterval,
    paused,
    rate,
    reducedMotion,
    ref,
    replayVersion,
  ]);

  const seek = useCallback(
    (time: number) => {
      elapsedRef.current = Math.max(0, Math.min(duration, time));
      setElapsed(elapsedRef.current);
      setReplayVersion((version) => version + 1);
    },
    [duration]
  );

  const replay = useCallback(() => {
    if (reducedMotion) {
      return;
    }
    elapsedRef.current = 0;
    setElapsed(0);
    setReplayVersion((version) => version + 1);
  }, [reducedMotion]);

  return {
    elapsed: reducedMotion ? duration : elapsed,
    reducedMotion,
    replay,
    seek,
  };
}
