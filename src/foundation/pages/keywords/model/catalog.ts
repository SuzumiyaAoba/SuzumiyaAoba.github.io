import { readFile } from "node:fs/promises";
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
  contentPath?: string;
  diagram: KeywordDiagram;
  animation: KeywordAnimation;
};

const diagramModes = [
  "flow",
  "field",
  "grid",
  "points",
  "layers",
  "graph",
  "curve",
  "shape",
  "physics",
  "pipeline",
  "path",
  "surface",
  "mesh",
  "volume",
  "image",
  "light",
  "wave",
  "fluid",
  "rig",
  "particles",
  "camera",
  "collision",
  "class",
] as const;

export type DiagramMode = (typeof diagramModes)[number];

export type KeywordDiagram = {
  mode: DiagramMode;
  input: string;
  process: string;
  output: string;
  variant: number;
};

type KeywordDiagramIndex = Map<string, Map<string, KeywordDiagram>>;

const animationSceneKinds = [
  "flow",
  "deform",
  "field",
  "cells",
  "surface",
  "curve",
  "timing",
  "rig",
  "spring",
  "route",
  "flock",
  "particles",
  "trail",
  "fog",
  "pipeline",
  "reveal",
  "shape",
  "merge",
  "light",
  "wave",
  "fluid",
  "physics",
  "cloth",
  "growth",
  "scatter",
  "mesh",
  "collision",
  "camera",
  "throughput",
  "class",
  "sprite",
  "streak",
  "glyph",
] as const;

export type AnimationSceneKind = (typeof animationSceneKinds)[number];

export type KeywordAnimation = {
  kind: AnimationSceneKind;
  subject: string;
  start: string;
  middle: string;
  end: string;
  impact: string;
  variant: number;
};

type KeywordAnimationIndex = Map<string, Map<string, KeywordAnimation>>;

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

const isDiagramMode = (value: string): value is DiagramMode =>
  diagramModes.some((mode) => mode === value);

const isAnimationSceneKind = (value: string): value is AnimationSceneKind =>
  animationSceneKinds.some((kind) => kind === value);

const getAnimationExamples = async (): Promise<KeywordAnimationIndex> => {
  const source = await readFile(
    path.join(process.cwd(), "content/keywords/animation-examples.txt"),
    "utf-8"
  );
  const examples: KeywordAnimationIndex = new Map();
  let current: Map<string, KeywordAnimation> | undefined;
  for (const line of source.split(/\r?\n/u)) {
    if (!line.trim()) {
      continue;
    }
    if (line.startsWith("# ")) {
      const subcategoryId = line.slice(2);
      if (examples.has(subcategoryId)) {
        throw new Error(`Duplicate animation subcategory: ${subcategoryId}`);
      }
      current = new Map();
      examples.set(subcategoryId, current);
      continue;
    }
    const [slug, kind, subject, start, middle, end, impact] = line.split("|");
    if (
      !(
        current &&
        slug &&
        kind &&
        subject &&
        start &&
        middle &&
        end &&
        impact &&
        isAnimationSceneKind(kind)
      )
    ) {
      throw new Error(`Invalid animation example: ${line}`);
    }
    if (current.has(slug)) {
      throw new Error(`Duplicate animation example: ${slug}`);
    }
    current.set(slug, {
      kind,
      subject,
      start,
      middle,
      end,
      impact,
      variant: current.size,
    });
  }
  if (
    examples.size !== 21 ||
    [...examples.values()].reduce((total, items) => total + items.size, 0) !==
      201
  ) {
    throw new Error("Animation examples must cover all 201 keywords");
  }
  return examples;
};

const getDiagramSpecs = async (): Promise<KeywordDiagramIndex> => {
  const source = await readFile(
    path.join(process.cwd(), "content/keywords/diagrams.txt"),
    "utf-8"
  );
  const specs: KeywordDiagramIndex = new Map();
  let current: Map<string, KeywordDiagram> | undefined;
  for (const line of source.split(/\r?\n/u)) {
    if (!line.trim()) {
      continue;
    }
    if (line.startsWith("# ")) {
      const categoryId = line.slice(2);
      if (specs.has(categoryId)) {
        throw new Error(`Duplicate diagram category: ${categoryId}`);
      }
      current = new Map();
      specs.set(categoryId, current);
      continue;
    }
    const [slug, mode, input, process, output] = line.split("|");
    if (
      !(
        current &&
        slug &&
        mode &&
        input &&
        process &&
        output &&
        isDiagramMode(mode)
      )
    ) {
      throw new Error(`Invalid keyword diagram: ${line}`);
    }
    if (current.has(slug)) {
      throw new Error(`Duplicate keyword diagram: ${slug}`);
    }
    current.set(slug, { mode, input, process, output, variant: current.size });
  }
  if (
    specs.size !== 21 ||
    [...specs.values()].reduce((total, items) => total + items.size, 0) !== 201
  ) {
    throw new Error("Keyword diagrams must cover all 201 terms");
  }
  return specs;
};

const getGameSubcategories = async (
  diagrams: KeywordDiagramIndex,
  animations: KeywordAnimationIndex
): Promise<KeywordSubcategory[]> => {
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
    const diagram = diagrams.get(current.id)?.get(slug);
    const animation = animations.get(current.id)?.get(slug);
    if (!diagram) {
      throw new Error(`Missing keyword diagram: ${current.id}/${slug}`);
    }
    if (!animation) {
      throw new Error(`Missing animation example: ${current.id}/${slug}`);
    }
    current.keywords.push({
      slug,
      name,
      english,
      effect,
      categoryId: category.id,
      subcategoryId: current.id,
      diagram,
      animation,
    });
  }
  if (
    subcategories.length !== 20 ||
    subcategories.some(
      (item) =>
        item.keywords.length !== 10 ||
        diagrams.get(item.id)?.size !== item.keywords.length ||
        animations.get(item.id)?.size !== item.keywords.length
    )
  ) {
    throw new Error(
      "Game keyword catalog must contain 20 subcategories of 10 entries"
    );
  }
  return subcategories;
};

const getProgrammingSubcategory = async (
  diagrams: KeywordDiagramIndex,
  animations: KeywordAnimationIndex
): Promise<KeywordSubcategory> => {
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
  const diagram = diagrams.get("dotnet")?.get("plain-old-clr-object");
  const animation = animations.get("dotnet")?.get("plain-old-clr-object");
  if (
    !diagram ||
    !animation ||
    diagrams.get("dotnet")?.size !== 1 ||
    animations.get("dotnet")?.size !== 1
  ) {
    throw new Error("Missing POCO diagram");
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
        diagram,
        animation,
      },
    ],
  };
};

export const getKeywordCategories = cache(
  async (): Promise<KeywordCategory[]> => {
    const [diagrams, animations] = await Promise.all([
      getDiagramSpecs(),
      getAnimationExamples(),
    ]);
    const [gameSubcategories, programming] = await Promise.all([
      getGameSubcategories(diagrams, animations),
      getProgrammingSubcategory(diagrams, animations),
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
