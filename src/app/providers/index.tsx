import type { ReactElement, ReactNode } from "react";
import { NuqsProvider } from "./nuqs-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps): ReactElement {
  return <NuqsProvider>{children}</NuqsProvider>;
}
