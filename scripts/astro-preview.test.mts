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
