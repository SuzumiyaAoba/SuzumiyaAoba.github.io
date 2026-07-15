import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadMdxScope } from "./mdx-scope";

describe("loadMdxScope", () => {
  let baseDir = "";

  beforeAll(async () => {
    baseDir = await mkdtemp(path.join(tmpdir(), "mdx-scope-test-"));
    await mkdir(path.join(baseDir, "data"), { recursive: true });
    await writeFile(
      path.join(baseDir, "data", "sample.json"),
      JSON.stringify({ hello: "world" }),
    );
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it("import文からJSONを読み込みscopeとして返す", async () => {
    const source = `import sampleData from "./data/sample.json";\n\n# タイトル`;
    const scope = await loadMdxScope(source, baseDir);
    expect(scope).toEqual({ sampleData: { hello: "world" } });
  });

  it("import文が無ければ空オブジェクトを返す", async () => {
    expect(await loadMdxScope("# タイトルのみ", baseDir)).toEqual({});
  });

  it("存在しないJSONへのimportは無視する", async () => {
    const source = `import missing from "./data/missing.json";\n\n# タイトル`;
    expect(await loadMdxScope(source, baseDir)).toEqual({});
  });
});
