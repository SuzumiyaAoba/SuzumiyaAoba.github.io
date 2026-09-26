import { describe, expect, it } from "vite-plus/test";
import { hasDemo } from "../ui/stage/registry";
import { keywordSources, keywordSpecificSources } from "./sources";
import {
  getKeywordCategories,
  getKeyword,
  getLegacyKeywordSubcategory,
} from "./catalog";

const allKeywords = async () =>
  (await getKeywordCategories()).flatMap((category) =>
    category.subcategories.flatMap((subcategory) => subcategory.keywords)
  );

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

  it("gives every game term an article and a Three.js demo", async () => {
    const games = (await allKeywords()).filter(
      (keyword) => keyword.categoryId !== "programming"
    );
    expect(games).toHaveLength(200);
    expect(
      games.filter((keyword) => !keyword.contentPath).map(({ slug }) => slug)
    ).toStrictEqual([]);
    expect(
      games
        .filter((keyword) => !(keyword.demoKey && hasDemo(keyword.demoKey)))
        .map(({ slug }) => slug)
    ).toStrictEqual([]);
  });

  it("links every term to further reading", async () => {
    const keywords = await allKeywords();
    const slugs = new Set(keywords.map((keyword) => keyword.slug));
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
});
