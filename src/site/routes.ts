import type { ComponentType } from "react";
import { isRecord } from "@/shared/lib/types/is-record";
import type { Metadata } from "@/shared/lib/site/metadata";

export type RouteParams = Record<string, string | string[]>;
export type PageModule = {
  default: ComponentType<{ params: Promise<RouteParams> }>;
  metadata?: Metadata;
  generateMetadata?: (props: {
    params: Promise<RouteParams>;
  }) => Promise<Metadata>;
  generateStaticParams?: () => Promise<RouteParams[]>;
};
export type SiteRoute = {
  path: string | undefined;
  params: RouteParams;
  module: PageModule;
  locale: "ja" | "en";
  image: string;
};
const pageModules: Record<string, unknown> = import.meta.glob(
  "/src/site/routes/**/page.tsx",
  {
    eager: true,
  }
);
type ImageModule = {
  default: (props: { params: Promise<RouteParams> }) => Promise<Response>;
  generateStaticParams?: () => Promise<RouteParams[]>;
};
const imageModules: Record<string, unknown> = import.meta.glob(
  "/src/site/routes/**/opengraph-image.tsx",
  {
    eager: true,
  }
);

function isPageModule(value: unknown): value is PageModule {
  return isRecord(value) && typeof value["default"] === "function";
}
function isImageModule(value: unknown): value is ImageModule {
  return isRecord(value) && typeof value["default"] === "function";
}
const pages = Object.fromEntries(
  Object.entries(pageModules).filter((entry): entry is [string, PageModule] =>
    isPageModule(entry[1])
  )
);
const images = Object.fromEntries(
  Object.entries(imageModules).filter((entry): entry is [string, ImageModule] =>
    isImageModule(entry[1])
  )
);

function routePattern(filename: string, suffix: string) {
  return filename
    .replace("/src/site/routes/", "")
    .replace(suffix, "")
    .split("/")
    .filter((segment) => segment.length > 0 && !segment.startsWith("("))
    .join("/");
}
function interpolate(pattern: string, params: RouteParams) {
  return pattern.replaceAll(/\[(?:\.\.\.)?(\w+)\]/gu, (_, key: string) => {
    const value = params[key];
    if (value === undefined) {
      throw new Error(`Missing route parameter ${key} in ${pattern}`);
    }
    return Array.isArray(value) ? value.join("/") : value;
  });
}
let routesPromise: Promise<SiteRoute[]> | undefined;
export async function getSiteRoutes(): Promise<SiteRoute[]> {
  routesPromise ??= loadSiteRoutes();
  return await routesPromise;
}
async function loadSiteRoutes(): Promise<SiteRoute[]> {
  const groups = await Promise.all(
    Object.entries(pages).map(async ([filename, module]) => {
      const pattern = routePattern(filename, "page.tsx");
      const parameters = module.generateStaticParams
        ? await module.generateStaticParams()
        : [{}];
      return parameters.map((params): SiteRoute => {
        const route = interpolate(pattern, params);
        const locale = route === "en" || route.startsWith("en/") ? "en" : "ja";
        const routeBase = route ? `/${route}` : "";
        const image = images[
          filename.replace("page.tsx", "opengraph-image.tsx")
        ]
          ? `${routeBase}/opengraph-image.png`
          : locale === "en"
            ? "/en/opengraph-image.png"
            : "/opengraph-image.png";
        return { path: route || undefined, params, module, locale, image };
      });
    })
  );
  return groups.flat();
}
export async function getImageRoutes() {
  const groups = await Promise.all(
    Object.entries(images).map(async ([filename, module]) => {
      const parameters = module.generateStaticParams
        ? await module.generateStaticParams()
        : [{}];
      return parameters.map((params) => ({
        path:
          interpolate(routePattern(filename, "opengraph-image.tsx"), params) ||
          undefined,
        params,
        module,
      }));
    })
  );
  return groups.flat();
}
