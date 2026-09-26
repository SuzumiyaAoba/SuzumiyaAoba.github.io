import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";

export type Keyword = {
  slug: string;
  name: string;
  english: string;
  effect: string;
  categoryId: string;
  subcategoryId: string;
  /** content/keywords 以下の解説 MDX のディレクトリ。 */
  contentPath?: string;
  /** Three.js デモの識別子（subcategory/slug）。 */
  demoKey?: string;
};

export type KeywordSubcategory = {
  id: string;
  name: string;
  english: string;
  description: string;
  keywords: Keyword[];
};

export type KeywordCategory = {
  id: string;
  name: string;
  english: string;
  description: string;
  subcategories: KeywordSubcategory[];
};

const categoryDefinitions = [
  {
    id: "programming",
    name: "プログラミング",
    english: "Programming",
    description: "言語や設計に関する用語",
    subcategoryIds: ["dotnet"],
  },
  {
    id: "graphics",
    name: "描画・視覚表現",
    english: "Graphics & visual effects",
    description: "模様、材質、光、粒子、画面効果",
    subcategoryIds: [
      "noise",
      "particles",
      "materials",
      "fields",
      "lighting",
      "volume",
      "post",
    ],
  },
  {
    id: "simulation",
    name: "動き・シミュレーション",
    english: "Motion & simulation",
    description: "軌道、追従、物理、流体、アニメーション",
    subcategoryIds: [
      "curves",
      "motion",
      "nature",
      "physics",
      "fluids",
      "animation",
      "camera",
    ],
  },
  {
    id: "world",
    name: "生成・空間",
    english: "Generation & space",
    description: "形状生成、配置、経路、衝突判定",
    subcategoryIds: [
      "mesh",
      "generation",
      "sampling",
      "navigation",
      "collision",
    ],
  },
  {
    id: "implementation",
    name: "実装基盤",
    english: "Implementation",
    description: "大量の要素を効率よく更新・描画する方法",
    subcategoryIds: ["performance"],
  },
] as const;

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");

const contentExists = async (contentPath: string) => {
  try {
    await access(
      path.join(process.cwd(), "content/keywords", contentPath, "index.mdx")
    );
    return true;
  } catch {
    return false;
  }
};

const getGameSubcategories = async (): Promise<KeywordSubcategory[]> => {
  const source = await readFile(
    path.join(process.cwd(), "content/keywords/game-development.txt"),
    "utf-8"
  );
  const subcategories: KeywordSubcategory[] = [];
  let current: KeywordSubcategory | undefined;
  for (const line of source.split(/\r?\n/u)) {
    if (!line.trim()) {
      continue;
    }
    if (line.startsWith("# ")) {
      const [id, name, english, description] = line.slice(2).split("|");
      if (!(id && name && english && description)) {
        throw new Error(`Invalid keyword subcategory: ${line}`);
      }
      current = { id, name, english, description, keywords: [] };
      subcategories.push(current);
      continue;
    }
    if (!current) {
      throw new Error(`Keyword without subcategory: ${line}`);
    }
    const [name, english, effect] = line.split("|");
    if (!(name && english && effect)) {
      throw new Error(`Invalid keyword: ${line}`);
    }
    const slug = slugify(english.split(" / ")[0] ?? english);
    if (current.keywords.some((keyword) => keyword.slug === slug)) {
      throw new Error(`Duplicate keyword slug: ${current.id}/${slug}`);
    }
    const subcategoryId = current.id;
    const category = categoryDefinitions.find((entry) =>
      entry.subcategoryIds.some((id) => id === subcategoryId)
    );
    if (!category) {
      throw new Error(`Unmapped keyword subcategory: ${current.id}`);
    }
    current.keywords.push({
      slug,
      name,
      english,
      effect,
      categoryId: category.id,
      subcategoryId: current.id,
      demoKey: `${current.id}/${slug}`,
    });
  }
  if (
    subcategories.length !== 20 ||
    subcategories.some((item) => item.keywords.length !== 10)
  ) {
    throw new Error(
      "Game keyword catalog must contain 20 subcategories of 10 entries"
    );
  }
  await Promise.all(
    subcategories.flatMap((subcategory) =>
      subcategory.keywords.map(async (keyword) => {
        const contentPath = `${keyword.categoryId}/${keyword.subcategoryId}/${keyword.slug}`;
        if (await contentExists(contentPath)) {
          keyword.contentPath = contentPath;
        }
      })
    )
  );
  return subcategories;
};

const getProgrammingSubcategory = async (): Promise<KeywordSubcategory> => {
  const contentPath = "programming/plain-old-clr-object";
  const [ja, en] = await Promise.all([
    readFile(
      path.join(process.cwd(), "content/keywords", contentPath, "index.mdx"),
      "utf-8"
    ),
    readFile(
      path.join(process.cwd(), "content/keywords", contentPath, "index.en.mdx"),
      "utf-8"
    ),
  ]);
  const japanese = matter(ja);
  const english = matter(en);
  if (japanese.data["draft"] === true || english.data["draft"] === true) {
    throw new Error("Published programming keyword cannot be marked as draft");
  }
  const japaneseTitle: unknown = japanese.data["title"];
  const englishTitle: unknown = english.data["title"];
  if (typeof japaneseTitle !== "string" || typeof englishTitle !== "string") {
    throw new TypeError("Programming keyword must have localized titles");
  }
  return {
    id: "dotnet",
    name: "C#・.NET",
    english: "C# & .NET",
    description: "C# と .NET の設計・用語",
    keywords: [
      {
        slug: "plain-old-clr-object",
        name: japaneseTitle,
        english: englishTitle,
        effect:
          "特定のフレームワークへの依存を持たない、単純なCLRクラス・オブジェクトを表す",
        categoryId: "programming",
        subcategoryId: "dotnet",
        contentPath,
      },
    ],
  };
};

export const getKeywordCategories = cache(
  async (): Promise<KeywordCategory[]> => {
    const [gameSubcategories, programming] = await Promise.all([
      getGameSubcategories(),
      getProgrammingSubcategory(),
    ]);
    const allSubcategories = [programming, ...gameSubcategories];
    const categories = categoryDefinitions.map(
      ({ id, name, english, description, subcategoryIds }) => ({
        id,
        name,
        english,
        description,
        subcategories: subcategoryIds.map((subcategoryId) => {
          const subcategory = allSubcategories.find(
            (item) => item.id === subcategoryId
          );
          if (!subcategory) {
            throw new Error(`Missing keyword subcategory: ${subcategoryId}`);
          }
          return subcategory;
        }),
      })
    );
    if (
      allSubcategories.length !==
      categories.reduce(
        (total, category) => total + category.subcategories.length,
        0
      )
    ) {
      throw new Error(
        "Some keyword subcategories are not assigned to a category"
      );
    }
    return categories;
  }
);

export const getKeywordCategory = async (id: string) =>
  (await getKeywordCategories()).find((category) => category.id === id);

export const getKeywordSubcategory = async (
  categoryId: string,
  subcategoryId: string
) =>
  (await getKeywordCategory(categoryId))?.subcategories.find(
    (subcategory) => subcategory.id === subcategoryId
  );

export const getKeyword = async (
  categoryId: string,
  subcategoryId: string,
  slug: string
) =>
  (await getKeywordSubcategory(categoryId, subcategoryId))?.keywords.find(
    (keyword) => keyword.slug === slug
  );

export const getLegacyKeywordSubcategory = async (id: string) =>
  (await getKeywordCategories())
    .flatMap((category) =>
      category.subcategories.map((subcategory) => ({ category, subcategory }))
    )
    .find(({ subcategory }) => subcategory.id === id);
