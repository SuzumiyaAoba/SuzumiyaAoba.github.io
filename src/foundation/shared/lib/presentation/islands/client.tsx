import { createElement } from "react";
import type { ComponentType } from "react";
import type { Root } from "react-dom/client";
import { hydrateRoot } from "react-dom/client";
import { AppProviders } from "@/shared/ui/providers";
import { IslandContext } from "./context";
import { restoreValue } from "./props";
import { modules } from "virtual:react-islands";
import { isRecord } from "@/shared/lib/types/is-record";

class ReactIsland extends HTMLElement {
  private root: Root | undefined;
  private loading = false;
  private observer: IntersectionObserver | undefined;

  disconnectedCallback() {
    this.observer?.disconnect();
    this.observer = undefined;
    queueMicrotask(() => {
      if (!this.isConnected) {
        this.root?.unmount();
        this.root = undefined;
      }
    });
  }
  connectedCallback() {
    if (this.root || this.loading) {
      return;
    }
    if (
      this.dataset["hydrate"] === "visible" &&
      "IntersectionObserver" in window
    ) {
      this.observer ??= new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.startHydration();
          }
        },
        { rootMargin: "300px" }
      );
      this.observer.observe(this);
      return;
    }
    this.startHydration();
  }

  private startHydration() {
    this.observer?.disconnect();
    this.observer = undefined;
    if (this.root || this.loading) {
      return;
    }
    this.loading = true;
    void this.hydrate();
  }

  private async hydrate() {
    try {
      const moduleId = this.dataset["module"] ?? "";
      const exportName = this.dataset["export"] ?? "";
      const load = modules[moduleId];
      if (!load) {
        throw new Error(`Unknown React island: ${moduleId}`);
      }
      const componentModule = await load();
      if (!this.isConnected) {
        return;
      }
      const Component = componentModule[exportName];
      if (!isComponent(Component)) {
        throw new Error(`Unknown React component: ${exportName}`);
      }
      const parsed: unknown = JSON.parse(this.dataset["props"] ?? "{}");
      const props = restoreValue(parsed);
      if (!isRecord(props)) {
        throw new Error("Invalid React island props");
      }
      this.root = hydrateRoot(
        this,
        <AppProviders>
          <IslandContext value={true}>
            {createElement(Component, props)}
          </IslandContext>
        </AppProviders>,
        { identifierPrefix: this.dataset["prefix"] ?? "" }
      );
      this.removeAttribute("ssr");
    } finally {
      this.loading = false;
    }
  }
}

function isComponent(
  value: unknown
): value is ComponentType<Record<string, unknown>> {
  return (
    typeof value === "function" || (isRecord(value) && "$$typeof" in value)
  );
}

if (!customElements.get("react-island")) {
  customElements.define("react-island", ReactIsland);
}
