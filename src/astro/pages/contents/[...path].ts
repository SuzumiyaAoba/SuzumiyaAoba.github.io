import {
  generateStaticParams,
  GET as serveAsset,
} from "../../../app/contents/[...path]/route";

export async function getStaticPaths() {
  return (await generateStaticParams()).map(({ path }) => ({
    params: { path: path.join("/") },
  }));
}
export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { path?: string };
}) {
  return await serveAsset(request, {
    params: Promise.resolve({ path: (params.path ?? "").split("/") }),
  });
}
