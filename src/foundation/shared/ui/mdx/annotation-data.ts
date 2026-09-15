import { isValidElement } from "react";
import type { ReactNode } from "react";
import { isRecord } from "@/shared/lib/types/is-record";

/** Code Hike の data は any のため、読み取る前に検証する。 */
export function annotationData(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

export function annotationContent(
  value: unknown
): Exclude<ReactNode, Promise<unknown>> {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    isValidElement(value)
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((child: unknown) => annotationContent(child));
  }
  return null;
}
