import { useEffect, useRef, useState } from "react";
import { loadAudioModel } from "./viewer-model-loader";
import type {
  AudioModel,
  AudioView,
  HeadphoneModel,
  ViewerHandle,
  ViewerStatus,
  ZoomDirection,
} from "../model/viewer";

export function useAudioViewer(model: AudioModel) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<ViewerHandle | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [selected, setSelected] = useState<AudioView | undefined>("overview");
  const [interactive, setInteractive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [headphones, setHeadphones] = useState<HeadphoneModel>("hd-800s");
  const selectedHeadphones = useRef<HeadphoneModel>("hd-800s");

  useEffect(() => {
    let cancelled = false;
    let handle: ViewerHandle | undefined;
    const surface = canvas.current;
    const frame = container.current;
    if (!surface || !frame) {
      return;
    }

    const load = async () => {
      try {
        const [{ createAudioViewer }, createModel] = await Promise.all([
          import("./viewer-runtime"),
          loadAudioModel(model),
        ]);
        if (cancelled) {
          return;
        }
        handle = createAudioViewer({
          model,
          createModel,
          canvas: surface,
          container: frame,
          onStatus: (nextStatus) => {
            if (!cancelled) {
              setStatus(nextStatus);
            }
          },
          onView: (view) => {
            if (!cancelled) {
              setSelected(view);
            }
          },
        });
        viewer.current = handle;
        handle.setHeadphones?.(selectedHeadphones.current);
        const enabled = window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        ).matches;
        handle.setInteractive(enabled);
        setInteractive(enabled);
      } catch {
        handle?.dispose();
        handle = undefined;
        viewer.current = null;
        if (!cancelled) {
          setStatus("unavailable");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      handle?.dispose();
      viewer.current = null;
    };
  }, [attempt, model]);

  const selectView = (view: AudioView) => {
    viewer.current?.setView(view);
    setSelected(view);
  };
  const toggleInteraction = () => {
    const enabled = !interactive;
    viewer.current?.setInteractive(enabled);
    setInteractive(enabled);
  };
  const selectHeadphones = (headphone: HeadphoneModel) => {
    viewer.current?.setHeadphones?.(headphone);
    selectedHeadphones.current = headphone;
    setHeadphones(headphone);
  };
  const zoom = (direction: ZoomDirection) => {
    viewer.current?.zoom(direction);
  };
  const retry = () => {
    setStatus("loading");
    setSelected("overview");
    setAttempt((value) => value + 1);
  };

  return {
    container,
    canvas,
    status,
    selected,
    interactive,
    attempt,
    headphones,
    selectView,
    toggleInteraction,
    selectHeadphones,
    zoom,
    retry,
  };
}
