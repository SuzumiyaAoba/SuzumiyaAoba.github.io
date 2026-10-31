import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";

// npm run build と npm run start の実行後に使用する。
const baseUrl = process.env["ASTRO_PREVIEW_URL"] ?? "http://127.0.0.1:4321";
let browser: Browser;
before(async () => {
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
});

async function newPage(): Promise<Page> {
  const page = await browser.newPage();
  // 外部の広告・コメント・SNS の稼働状態から、サイト本体の検証を独立させる。
  await page.route("**/*", async (route) => {
    await (new URL(route.request().url()).origin === new URL(baseUrl).origin
      ? route.continue()
      : route.abort());
  });
  return page;
}

void test("AI routes redirect legacy URLs and link releases to benchmarks", async () => {
  const page = await newPage();
  await page.goto(`${baseUrl}/archive/ai-news/`);
  await page.waitForURL(`${baseUrl}/ai/models/`);
  assert.equal(
    await page
      .getByRole("heading", { name: "AIモデルのリリース比較", exact: true })
      .count(),
    1
  );
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    "https://suzumiyaaoba.com/ai/models/"
  );
  assert.equal(
    await page
      .getByRole("navigation", { name: "AI の資料" })
      .getByRole("link", { name: "ベンチマーク", exact: true })
      .getAttribute("href"),
    "/ai/benchmarks/"
  );
  await page.goto(`${baseUrl}/archive/ai-news/timeline/`);
  await page.waitForURL(`${baseUrl}/ai/models/timeline/`);
  assert.equal(
    await page
      .getByRole("heading", { name: "AIニュース", exact: true })
      .count(),
    1
  );
  await page.close();
});

void test("AI benchmarks compare scores and costs without treating missing costs as zero", async () => {
  const page = await newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/ai/benchmarks/`);
  await page.waitForSelector("react-island:not([ssr]) #benchmark-select");
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    "https://suzumiyaaoba.com/ai/benchmarks/"
  );
  const table = page.locator(
    'section[aria-labelledby="benchmark-results"] table'
  );
  assert.match(
    (await table.locator("tbody tr").first().textContent()) ?? "",
    /Claude Opus 5.5.*65.15.*13.20/u
  );
  assert.equal(
    await table.getByRole("columnheader", { name: /Effort/u }).count(),
    1
  );
  const graph = page.getByRole("group", {
    name: "費用とスコアの比較",
    exact: true,
  });
  assert.equal(
    await graph.locator("[data-model-label]").count(),
    await graph.getByRole("button").count()
  );
  assert.match(
    (await graph
      .locator('[data-model-label="anthropic_claude-opus-5-5"]')
      .textContent()) ?? "",
    /Claude Opus 5.5.*Effort: max/u
  );

  const point = page.getByRole("button", {
    name: /^GPT-6.1 Sol、Effort max、スコア/u,
  });
  const labelGeometry = await graph
    .locator("[data-model-label]")
    .evaluateAll((labels) =>
      labels.map((label) => {
        if (!(label instanceof SVGTextElement)) {
          throw new Error("Expected SVG model label");
        }
        const path = label.parentElement?.querySelector("path");
        if (!(path instanceof SVGPathElement)) {
          throw new Error("Missing label connector");
        }
        const end = path.getPointAtLength(path.getTotalLength());
        const box = label.getBBox();
        const gap =
          getComputedStyle(label).textAnchor === "end"
            ? end.x - box.x - box.width
            : box.x - end.x;
        const overlapsAxis = [
          ...(label.ownerSVGElement?.querySelectorAll(
            "text:not([data-model-label])"
          ) ?? []),
        ].some((axis) => {
          if (!(axis instanceof SVGTextElement)) {
            return false;
          }
          const axisBox = axis.getBBox();
          return (
            box.x < axisBox.x + axisBox.width &&
            box.x + box.width > axisBox.x &&
            box.y < axisBox.y + axisBox.height &&
            box.y + box.height > axisBox.y
          );
        });
        return { gap, overlapsAxis };
      })
    );
  assert.ok(
    labelGeometry.every(
      ({ gap, overlapsAxis }) => Math.abs(gap - 8) < 1 && !overlapsAxis
    )
  );
  await graph.locator('[data-model-label="openai_gpt-6.1-sol"]').hover();
  assert.equal(await point.getAttribute("aria-pressed"), "true");
  assert.equal(
    await graph
      .locator('[data-model-point="openai_gpt-6.1-sol"]')
      .getAttribute("r"),
    "8"
  );
  await graph
    .locator('[data-model-label="google_gemini-4-carbon"]')
    .dispatchEvent("click");
  assert.equal(await point.getAttribute("aria-pressed"), "false");
  assert.equal(
    await graph
      .locator('[data-model-point="google_gemini-4-carbon"]')
      .getAttribute("r"),
    "8"
  );
  await point.focus();
  await page.keyboard.press("Enter");
  assert.match(
    (await page.locator("figcaption").textContent()) ?? "",
    /GPT-6.1 Sol/u
  );

  const search = page.getByRole("searchbox", { name: "モデルを検索" });
  await search.fill("Beam");
  await page
    .getByText(
      "この条件で比較できる費用データはありません。スコアは下の表で確認できます。",
      { exact: true }
    )
    .waitFor();
  assert.match((await table.textContent()) ?? "", /Beam 1.0.*4.04.*未公表/u);
  await search.fill("does-not-exist");
  await page
    .getByText("条件に一致するモデルがありません。", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "絞り込みを解除", exact: true })
    .click();

  await page.getByLabel("ベンチマーク", { exact: true }).selectOption("gpqa");
  assert.equal(await page.getByLabel("費用の比較軸").inputValue(), "task");
  assert.equal(
    await page
      .locator('#benchmark-cost-metric option[value="task"]')
      .isDisabled(),
    false
  );
  await page.getByLabel("費用の比較軸").selectOption("output");
  await page.getByLabel("開発元", { exact: true }).selectOption("OpenAI");
  await page.getByLabel("費用の比較軸").selectOption("input");
  await page.getByLabel("並び順").selectOption("cost");
  await table.locator("tbody tr").filter({ hasText: "GPT-5.6 Luna" }).waitFor();
  assert.match(
    (await table.locator("tbody tr").first().textContent()) ?? "",
    /GPT-5.6 Luna/u
  );
  assert.match((await table.textContent()) ?? "", /入力単価.*出力単価/u);

  await page.getByText(/^ベンチマーク横断のスコア一覧/u).click();
  assert.match(
    (await page.locator("details[open]").textContent()) ?? "",
    /未掲載/u
  );
  assert.match(
    (await page.locator("details[open]").textContent()) ?? "",
    /Effort: max/u
  );

  await page.getByLabel("開発元", { exact: true }).selectOption("");
  await search.fill("DeepSeek V4.1 Flash");
  await page
    .getByLabel("ベンチマーク", { exact: true })
    .selectOption("terminal-bench-4");
  const deepSeekRow = table
    .locator("tbody tr")
    .filter({ hasText: "DeepSeek V4.1 Flash" })
    .filter({ hasNotText: "1017" });
  assert.equal(
    await deepSeekRow.getByRole("cell").first().textContent(),
    "high"
  );
  await page
    .getByLabel("ベンチマーク", { exact: true })
    .selectOption("terminal-bench-science");
  assert.equal(
    await deepSeekRow.getByRole("cell").first().textContent(),
    "max"
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    ),
    true
  );
  assert.deepEqual(errors, []);
  await page.close();
});

void test("all page families, localized metadata, and static assets are exported", async () => {
  const files = await readdir("out", { recursive: true });
  assert.ok(
    files.filter((filename) => filename.endsWith(".html")).length > 1000
  );
  assert.ok(!files.some((filename) => filename.startsWith("_next/")));
  const paths = [
    "index.html",
    "blog/index.html",
    "blog/post/2024-08-08-java-to-list/index.html",
    "tools/ascii-standard-code/index.html",
    "tags/Java/index.html",
    "search/index.html",
    "awesome-something/index.html",
  ];
  await Promise.all(
    paths.map(async (path) => {
      const [ja, en] = await Promise.all([
        readFile(`out/${path}`, "utf-8"),
        readFile(`out/en/${path}`, "utf-8"),
      ]);
      assert.match(ja, /lang="ja"/u);
      assert.match(en, /lang="en"/u);
      assert.doesNotMatch(ja, /noindex/u);
      assert.doesNotMatch(ja, /\/_next\//u);
      assert.match(ja, /rel="canonical"/u);
      assert.match(
        ja,
        /property="og:image" content="https:\/\/suzumiyaaoba\.com\//u
      );
    })
  );
  const [book, keyword, rss, englishRss, sitemap, png, legacyPng] =
    await Promise.all([
      readFile("out/books/java-abc/01/00/index.html", "utf-8"),
      readFile("out/keywords/graphics/noise/perlin/index.html", "utf-8"),
      readFile("out/rss.xml", "utf-8"),
      readFile("out/en/rss.xml", "utf-8"),
      readFile("out/sitemap.xml", "utf-8"),
      readFile("out/opengraph-image.png"),
      readFile("out/opengraph-image"),
    ]);
  assert.match(book, /java-abc/u);
  assert.match(keyword, /Perlin/iu);
  assert.match(rss, /<rss/u);
  assert.match(englishRss, /<rss/u);
  assert.match(sitemap, /\/en\/blog\/post\//u);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.deepEqual(png, legacyPng);
  const response = await fetch(`${baseUrl}/opengraph-image.png`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /image\/png/u);
});

for (const prefix of ["", "/en"]) {
  void test(`Code Hike restores interactive tabs: ${prefix || "ja"}`, async () => {
    const page = await newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseUrl}${prefix}/blog/post/2024-12-20-scala-cats-eq/`);
    const kittens = page.getByRole("button", { name: "kittens", exact: true });
    await kittens.click();
    assert.equal(await kittens.getAttribute("aria-pressed"), "true");
    await page.waitForFunction(() =>
      [...document.querySelectorAll("pre")].some((pre) =>
        pre.textContent?.includes("derives Eq")
      )
    );
    assert.deepEqual(errors, []);
    await page.close();
  });
}

void test("theme toggles and ASCII character selection survive hydration", async () => {
  const page = await newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/tools/ascii-standard-code/`);
  await page.waitForSelector('button.theme-toggle[data-state="light"]');
  await page
    .getByRole("button", { name: "暗い表示にする", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark")
  );
  assert.equal(
    await page
      .getByRole("button", { name: "明るい表示にする", exact: true })
      .count(),
    1
  );
  await page.waitForSelector("react-island:not([ssr]) svg");
  await page.locator("main svg text").filter({ hasText: /^A$/u }).click();
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("main svg text")]
        .find((text) => text.textContent === "A")
        ?.getAttribute("fill") === "#f8fafc"
  );
  const clickedInfo = page.getByText("Clicked", { exact: true }).locator("..");
  assert.equal(await clickedInfo.getByText("A", { exact: true }).count(), 1);
  assert.match((await clickedInfo.textContent()) ?? "", /0x41/u);
  assert.deepEqual(errors, []);
  await page.close();
});

// 開発サーバーでも実行すると React Refresh の初期化順を検証できる。
void test("audio viewer hydrates and reports failed texture loading", async () => {
  const page = await newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // 初期テクスチャが取得できない場合でも、読み込み中の表示から復帰する。
  await page.route("**/assets/audio/textures/**", async (route) => {
    await route.abort();
  });
  await page.goto(`${baseUrl}/audio/`);
  const stage = page.locator('.audio-stage[data-model="system"]');
  await stage
    .locator('p[role="status"]')
    .getByText(/3D表示を利用できません/u)
    .waitFor();
  assert.equal(await stage.getAttribute("data-status"), "unavailable");
  assert.equal(
    await stage.getByRole("button", { name: "再読み込み" }).count(),
    1
  );
  assert.deepEqual(errors, []);
  await page.close();
});

void test("Pagefind searches generated articles and synchronizes the query URL", async () => {
  const page = await newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/search/`);
  const input = page.getByRole("searchbox", { name: "検索キーワード" });
  await input.fill("Stream");
  await page.waitForURL(/q=Stream/u);
  await page.locator('main a[href*="/blog/post/"]').first().waitFor();
  assert.ok((await page.locator('main a[href*="/blog/post/"]').count()) > 0);
  assert.deepEqual(errors, []);
  await page.close();
});

void test("financial chart tabs preserve labels and load charts after switching", async () => {
  const page = await newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/blog/post/2026-01-01-kakekin/`);
  const tab = page
    .getByRole("button", { name: "積み上げ棒グラフ", exact: true })
    .first();
  await tab.click();
  assert.equal(await tab.getAttribute("aria-pressed"), "true");
  await page.locator(".tab-panel svg").first().waitFor();
  assert.deepEqual(errors, []);
  await page.close();
});

void test("offscreen financial charts load when scrolled into view", async () => {
  const page = await newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/blog/post/2026-01-01-kakekin/`);
  await page.waitForSelector("react-island:not([ssr])");
  const charts = page.locator('react-island[data-hydrate="visible"]:visible');
  assert.ok((await charts.count()) > 20);
  const lastChart = charts.last();
  assert.equal(await lastChart.getAttribute("ssr"), "");
  const bounds = await lastChart.boundingBox();
  assert.ok(bounds && bounds.height >= 400);

  await lastChart.scrollIntoViewIfNeeded();
  await lastChart.locator("svg").first().waitFor();
  assert.equal(await lastChart.getAttribute("ssr"), null);
  assert.deepEqual(errors, []);
  await page.close();
});

void test("simulator inputs update calculations and persist through the URL", async () => {
  const page = await newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/tools/asset-formation-simulator/`);
  const amount = page
    .getByRole("spinbutton", { name: "毎月の積立て金額（円）", exact: true })
    .first();
  await page.waitForSelector('react-island:not([ssr]) input[type="number"]');
  await page.waitForFunction(() =>
    new URL(window.location.href).searchParams.has("p")
  );
  const previous = new URL(page.url()).searchParams.get("p");
  await amount.fill("45000");
  await page.waitForFunction((old) => {
    const value = new URL(window.location.href).searchParams.get("p");
    return value !== null && value !== old;
  }, previous);
  await page.reload();
  await page.waitForFunction(() =>
    [
      ...document.querySelectorAll<HTMLInputElement>('input[type="number"]'),
    ].some((input) => input.value === "45000")
  );
  assert.equal(await amount.inputValue(), "45000");
  assert.deepEqual(errors, []);
  await page.close();
});

void test("legacy redirects and missing pages retain navigation behavior", async () => {
  const page = await newPage();
  await page.goto(`${baseUrl}/notes/`);
  await page.waitForURL(/\/keywords\//u);
  assert.match(page.url(), /\/keywords\//u);
  const response = await page.goto(`${baseUrl}/this-page-does-not-exist/`);
  assert.equal(response?.status(), 404);
  assert.match((await page.locator("main").textContent()) ?? "", /404/u);
  await page.close();
});
