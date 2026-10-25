import { describe, expect, it } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { isValidElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Tab } from "@/shared/ui/mdx/tab";
import type { TabProps } from "@/shared/ui/mdx/tab";
import { Tabs } from "@/shared/ui/mdx/tabs";
import { restoreValue } from "./props";
import { createIsland, renderHtml } from "./server";

function Content({ render }: { render: () => string }) {
  return <p>{render()}</p>;
}

describe("React island boundaries", () => {
  it("preserves child metadata used to label tabs", async () => {
    const Component = createIsland(
      ({ children }) => {
        if (!isValidElement<TabProps>(children)) {
          throw new Error("Expected a tab");
        }
        return <Tabs>{children}</Tabs>;
      },
      "/src/example.tsx",
      "Tabs"
    );
    const html = await renderHtml(
      <Component>
        <Tab title="Sheet one">
          <p>Chart</p>
        </Tab>
      </Component>
    );
    expect(html).toContain(">Sheet one</button>");
  });

  it("allows slots to decorate native children after serialization", async () => {
    const Component = createIsland(
      ({ children }) => {
        if (!isValidElement(children)) {
          throw new Error("Expected a link");
        }
        return <Slot className="slot-button">{children}</Slot>;
      },
      "/src/example.tsx",
      "Slot"
    );
    const html = await renderHtml(
      <Component>
        <a href="/target/">Link</a>
      </Component>
    );
    expect(html).toContain('<a href="/target/" class="slot-button">Link</a>');
  });

  it("renders server child components without serializing their internal functions", async () => {
    const Component = createIsland(
      ({ children }) => {
        if (!isValidElement(children)) {
          throw new Error("Expected content");
        }
        return <section>{children}</section>;
      },
      "/src/example.tsx",
      "Content"
    );
    const html = await renderHtml(
      <Component>
        <Content render={() => "Article body"} />
      </Component>
    );
    expect(html).toContain("<p>Article body</p>");
  });
  it("restores dates and nested props without changing primitive values", () => {
    expect(
      restoreValue({
        selected: 2,
        enabled: false,
        rows: ["one", null],
        date: { __date: "2026-01-01T00:00:00.000Z" },
      })
    ).toStrictEqual({
      selected: 2,
      enabled: false,
      rows: ["one", null],
      date: new Date("2026-01-01T00:00:00.000Z"),
    });
  });
  it("retains trusted server-rendered children as an opaque hydration slot", () => {
    const node = restoreValue({ __reactHtml: "<strong>article</strong>" });
    if (!isValidElement(node)) {
      throw new Error("Expected a React slot");
    }
    expect(renderToStaticMarkup(node)).toBe(
      "<astro-slot><strong>article</strong></astro-slot>"
    );
  });
  it("emits component identity and safely escapes serialized text", async () => {
    const Component = createIsland(
      ({ title }) => <p>{String(title)}</p>,
      "/src/example.tsx",
      "Example"
    );
    const html = await renderHtml(
      <Component title={'<script>alert("x")</script>'} />
    );
    expect(html).toContain('data-module="/src/example.tsx"');
    expect(html).toContain('data-export="Example"');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('<script>alert("x")</script>');
  });
  it("rejects server callbacks rather than silently dropping interactions", async () => {
    const Component = createIsland(
      () => <p>button</p>,
      "/src/example.tsx",
      "Example"
    );
    await expect(renderHtml(<Component onClick={() => {}} />)).rejects.toThrow(
      "React island props cannot contain function"
    );
  });
});
