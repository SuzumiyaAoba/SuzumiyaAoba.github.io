import type { ReactElement, ReactNode } from "react";
import { NuqsProvider } from "./nuqs-provider";
import { ThemeProvider } from "./theme-provider";
import { IntlProvider } from "./intl-provider";
import { LocaleLinkRewriter } from "./locale-link-rewriter";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps): ReactElement {
  return (
    <ThemeProvider>
      <NuqsProvider>
        <IntlProvider>
          <LocaleLinkRewriter />
          {children}
        </IntlProvider>
      </NuqsProvider>
    </ThemeProvider>
  );
}
