import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { useMounted } from "./use-mounted";

export default function dynamic<P extends object>(
  load: () => Promise<ComponentType<P>>,
  options?: { ssr?: boolean }
) {
  const Component = lazy(async () => ({ default: await load() }));
  function LazyComponent(props: P) {
    const mounted = useMounted();
    if (options?.ssr === false && !mounted) {
      return null;
    }
    return (
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    );
  }
  return LazyComponent;
}
