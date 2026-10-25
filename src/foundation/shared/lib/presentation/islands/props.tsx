import { createElement, Fragment, isValidElement } from "react";
import type { ReactNode } from "react";
import { isRecord } from "@/shared/lib/types/is-record";

export type SerializedValue =
  | null
  | boolean
  | number
  | string
  | SerializedValue[]
  | { [key: string]: SerializedValue };

// HTML はビルド時に React が生成した内容だけを渡す。ユーザー入力はここへ渡さない。
function StaticContent({ html }: { html: string }) {
  return createElement("astro-slot", {
    dangerouslySetInnerHTML: { __html: html },
  });
}

export function restoreValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(restoreValue);
  }
  if (isRecord(value)) {
    if (typeof value["__reactHtml"] === "string") {
      const metadata = restoreValue(value["props"]);
      return createElement(StaticContent, {
        ...(isRecord(metadata) ? metadata : {}),
        html: value["__reactHtml"],
      });
    }
    if (typeof value["__element"] === "string") {
      const props = restoreValue(value["props"]);
      if (!isRecord(props)) {
        throw new Error("Invalid React element props");
      }
      return createElement(value["__element"], props);
    }
    if (value["__fragment"] === true) {
      const children = restoreValue(value["children"]);
      if (!isNode(children)) {
        throw new Error("Invalid React fragment children");
      }
      return createElement(Fragment, null, children);
    }
    if (typeof value["__date"] === "string") {
      return new Date(value["__date"]);
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, restoreValue(child)])
    );
  }
  return value;
}

function isNode(value: unknown): value is ReactNode {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    isValidElement(value) ||
    (Array.isArray(value) && value.every(isNode))
  );
}
