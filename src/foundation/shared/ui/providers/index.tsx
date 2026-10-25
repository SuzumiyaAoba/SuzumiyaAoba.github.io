import type { ReactElement, ReactNode } from "react";
import { NuqsProvider } from "./nuqs-provider";
import { ThemeProvider } from "./theme-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps): ReactElement {
  return (
    <ThemeProvider>
      <NuqsProvider>{children}</NuqsProvider>
    </ThemeProvider>
  );
}
