import { getImageRoutes } from "../../../site/routes";
import type { RouteParams } from "../../../site/routes";

export async function getStaticPaths() {
  return (await getImageRoutes()).map(({ module: _module, ...route }) => ({
    params: { path: route.path },
    props: route,
  }));
}
export async function GET({
  props,
}: {
  props: { path: string | undefined; params: RouteParams };
}) {
  const route = (await getImageRoutes()).find(
    (candidate) => candidate.path === props.path
  );
  if (!route) {
    return new Response("Not found", { status: 404 });
  }
  return await route.module.default({ params: Promise.resolve(props.params) });
}
