import { createElement, Fragment, isValidElement, useContext } from "react";
import type { ComponentType, ReactNode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";
import { AppProviders } from "@/shared/ui/providers";
import { IslandContext } from "./context";
import { restoreValue } from "./props";
import type { SerializedValue } from "./props";
import { isRecord } from "@/shared/lib/types/is-record";

type IslandOptions = { hydrate?: "visible" };

export async function renderHtml(
  content: ReactNode,
  prefix = "page-"
): Promise<string> {
  // oxlint-disable-next-line promise/avoid-new -- React のストリームコールバックを Promise に変換する。
  return await new Promise((resolve, reject) => {
    let html = "";
    const stream = renderToPipeableStream(
      <AppProviders>{content}</AppProviders>,
      {
        onError: reject,
        identifierPrefix: prefix,
        onAllReady() {
          stream.pipe(
            new Writable({
              write(chunk: Buffer, _encoding, done) {
                html += chunk.toString("utf-8");
                done();
              },
              final(done) {
                resolve(html);
                done();
              },
            })
          );
        },
      }
    );
  });
}

async function serialize(value: unknown): Promise<SerializedValue> {
  if (value === undefined || value === null) {
    return null;
  }
  if (isValidElement(value)) {
    const props = isRecord(value.props) ? value.props : {};
    if (typeof value.type === "string") {
      return { __element: value.type, props: await serialize(props) };
    }
    if (value.type === Fragment) {
      return { __fragment: true, children: await serialize(props["children"]) };
    }
    const metadata = Object.fromEntries(
      Object.entries(props).filter(
        ([, child]) =>
          child === null ||
          typeof child === "string" ||
          typeof child === "number" ||
          typeof child === "boolean"
      )
    );
    return {
      __reactHtml: await renderHtml(value),
      props: await serialize(metadata),
    };
  }
  if (value instanceof Date) {
    return { __date: value.toISOString() };
  }
  if (Array.isArray(value)) {
    return await Promise.all(value.map(serialize));
  }
  if (typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .map(async ([key, child]) => [key, await serialize(child)] as const)
    );
    return Object.fromEntries(entries);
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  throw new TypeError(`React island props cannot contain ${typeof value}`);
}

let nextIslandId = 0;

async function Island({
  component: Component,
  moduleId,
  exportName,
  props,
  options,
}: {
  component: ComponentType<Record<string, unknown>>;
  moduleId: string;
  exportName: string;
  props: Record<string, unknown>;
  options: IslandOptions;
}) {
  const serialized = await serialize(props);
  const restored = restoreValue(serialized);
  if (!isRecord(restored)) {
    throw new Error("Invalid React island props");
  }
  const prefix = `island-${nextIslandId}-`;
  nextIslandId += 1;
  const html = await renderHtml(
    <IslandContext value={true}>
      <Component {...restored} />
    </IslandContext>,
    prefix
  );
  return createElement("react-island", {
    "data-module": moduleId,
    "data-export": exportName,
    "data-props": JSON.stringify(serialized),
    "data-prefix": prefix,
    "data-hydrate": options.hydrate,
    // クライアント描画だけのグラフも監視でき、読み込み前後のレイアウトを安定させる。
    className: options.hydrate === "visible" ? "block min-h-100" : undefined,
    ssr: "",
    dangerouslySetInnerHTML: { __html: html },
  });
}

export function createIsland(
  Component: ComponentType<Record<string, unknown>>,
  moduleId: string,
  exportName: string,
  options: IslandOptions = {}
) {
  function IslandBoundary(props: Record<string, unknown>) {
    const nested = useContext(IslandContext);
    return nested ? (
      <Component {...props} />
    ) : (
      <Island
        component={Component}
        moduleId={moduleId}
        exportName={exportName}
        props={props}
        options={options}
      />
    );
  }
  return IslandBoundary;
}
