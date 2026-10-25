"use client";

import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/react";

type NuqsProviderProps = {
  children: ReactNode;
};

export function NuqsProvider({ children }: NuqsProviderProps) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
