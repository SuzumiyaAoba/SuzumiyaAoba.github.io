import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Header } from "./ui/header";

const meta: Meta<typeof Header> = {
  title: "widgets/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  args: { locale: "ja", path: "/" },
  render: (args) => (
    <div className="min-h-screen bg-background text-foreground">
      <Header {...args} />
      <div className="px-6 py-8 text-sm text-muted-foreground">
        <button type="button">Header preview</button>
      </div>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole("button", { name: "メニューを開く" });
    const panel = canvasElement.querySelector("#mobile-nav");
    const outside = canvas.getByRole("button", { name: "Header preview" });

    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toHaveAttribute("inert");
    await userEvent.click(menu);
    await expect(menu).toHaveAccessibleName("メニューを閉じる");
    await expect(panel).not.toHaveAttribute("inert");
    const index = within(canvas.getByRole("navigation", { name: "サイトの目次" }));
    await expect(index.getByRole("link", { name: "記事" })).toHaveAttribute("href", "/blog/");

    await userEvent.keyboard("{Escape}");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toHaveFocus();
    await expect(panel).toHaveAttribute("inert");

    await userEvent.click(menu);
    await userEvent.click(outside);
    await expect(menu).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(menu);
    outside.focus();
    await waitFor(async () => expect(menu).toHaveAttribute("aria-expanded", "false"));

    await userEvent.click(menu);
    const blog = index.getByRole("link", { name: "記事" });
    blog.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(blog);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  },
};

export const English: Story = {
  args: { locale: "en", path: "/en/tools/ascii-standard-code/" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const primary = within(canvas.getByRole("navigation", { name: "Main navigation" }));
    await expect(primary.getAllByRole("link")).toHaveLength(4);
    await expect(primary.getByRole("link", { name: "Archive & tools" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(primary.getByRole("link", { name: "Blog" })).not.toHaveAttribute("aria-current");
    await expect(canvasElement.querySelector(".reading-progress")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
    const index = within(canvas.getByRole("navigation", { name: "Site index" }));
    const books = index.getByRole("link", { name: /Books/u });
    await expect(books).toHaveAttribute("href", "/books/");
    await expect(books).toHaveAttribute("hreflang", "ja");
    await expect(books).toHaveTextContent("JA");
    await expect(index.getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/en/rss.xml");
    await userEvent.keyboard("{Escape}");
  },
};

export const ReadingProgress: Story = {
  args: { path: "/blog/post/entry/" },
  render: (args) => (
    <div className="bg-background text-foreground">
      <Header {...args} />
      <main className="min-h-[300vh] px-6 py-8">Reading preview</main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const progress = canvasElement.querySelector<HTMLElement>(".reading-progress");
    await expect(progress).not.toBeNull();
    globalThis.scrollTo(0, 0);
    await waitFor(async () => expect(progress?.style.transform).toBe("scaleX(0)"));
    globalThis.scrollTo(0, document.documentElement.scrollHeight);
    await waitFor(async () => expect(progress?.style.transform).toBe("scaleX(1)"));
    globalThis.scrollTo(0, 0);
    await waitFor(async () => expect(progress?.style.transform).toBe("scaleX(0)"));
  },
};
