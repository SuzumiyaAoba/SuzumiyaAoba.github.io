import { describe, expect, it } from "vite-plus/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { KeywordVisual } from "../ui/keyword-visual";
import { KeywordAnimation } from "../ui/keyword-animation";
import { keywordNotes } from "./notes";
import { keywordSources, keywordSpecificSources } from "./sources";
import {
  getKeywordCategories,
  getKeyword,
  getLegacyKeywordSubcategory,
} from "./catalog";

describe("keyword catalog", () => {
  it("keeps the existing programming article alongside all game development terms", async () => {
    const categories = await getKeywordCategories();
    const subcategories = categories.flatMap(
      (category) => category.subcategories
    );
    const keywords = subcategories.flatMap(
      (subcategory) => subcategory.keywords
    );

    expect(categories.map((category) => category.id)).toStrictEqual([
      "programming",
      "graphics",
      "simulation",
      "world",
      "implementation",
    ]);
    expect(subcategories).toHaveLength(21);
    expect(keywords).toHaveLength(201);
    expect(
      new Set(
        keywords.map((keyword) =>
          [
            keyword.diagram.input,
            keyword.diagram.process,
            keyword.diagram.output,
          ].join(" → ")
        )
      ).size
    ).toBe(201);
    await expect(
      getKeyword("programming", "dotnet", "plain-old-clr-object")
    ).resolves.toMatchObject({
      contentPath: "programming/plain-old-clr-object",
    });
    expect(
      new Set(
        keywords.map(
          (keyword) =>
            `${keyword.categoryId}/${keyword.subcategoryId}/${keyword.slug}`
        )
      ).size
    ).toBe(201);
  });

  it("resolves previous one-level category URLs", async () => {
    const legacy = await getLegacyKeywordSubcategory("noise");
    expect(legacy?.category.id).toBe("graphics");
    expect(
      legacy?.subcategory.keywords.some(
        (keyword) => keyword.slug === "curl-noise"
      )
    ).toBe(true);
  });

  it("renders a distinct schematic for every term", async () => {
    const keywords = (await getKeywordCategories()).flatMap((category) =>
      category.subcategories.flatMap((subcategory) => subcategory.keywords)
    );
    const svgs = keywords.map((keyword) => {
      const markup = renderToStaticMarkup(
        createElement(KeywordVisual, { keyword, locale: "ja" })
      );
      return /<svg[\s\S]*?<\/svg>/u.exec(markup)?.[0];
    });
    expect(svgs.every(Boolean)).toBe(true);
    expect(new Set(svgs).size).toBe(201);
    const artwork = new Map(
      keywords.map((keyword, index) => [
        keyword.slug,
        svgs[index]?.replace(/<text\b[\s\S]*?<\/text>/u, ""),
      ])
    );
    for (const [left, right] of [
      ["perlin", "simplex-noise"],
      ["worley", "boids"],
      ["signed-distance-field", "smooth-union"],
      ["physically-based-rendering", "fresnel"],
      ["ping-pong-buffers", "object-pool"],
    ] as const) {
      expect(artwork.get(left)).not.toBe(artwork.get(right));
    }
    const slugs = new Set(keywords.map((keyword) => keyword.slug));
    expect(Object.keys(keywordNotes).every((slug) => slugs.has(slug))).toBe(
      true
    );
    expect(
      Object.keys(keywordSpecificSources).every((slug) => slugs.has(slug))
    ).toBe(true);
    expect(
      keywords.every((keyword) =>
        Boolean(
          keywordSpecificSources[keyword.slug] ??
          keywordSources[keyword.subcategoryId]
        )
      )
    ).toBe(true);
  });

  it("shows three different animation stages for every term", async () => {
    expect.hasAssertions();
    const keywords = (await getKeywordCategories()).flatMap((category) =>
      category.subcategories.flatMap((subcategory) => subcategory.keywords)
    );
    const examples = keywords.map((keyword) => {
      const markup = renderToStaticMarkup(
        createElement(KeywordAnimation, { keyword, locale: "ja" })
      );
      const frames = [...markup.matchAll(/<svg[\s\S]*?<\/svg>/gu)].map(
        ([frame]) => frame
      );
      expect(frames).toHaveLength(3);
      expect(new Set(frames).size, keyword.slug).toBe(3);
      return [
        keyword.animation.subject,
        keyword.animation.start,
        keyword.animation.middle,
        keyword.animation.end,
        keyword.animation.impact,
      ].join(" → ");
    });
    expect(new Set(examples).size).toBe(201);
  });
});
