import { afterEach, expect, it, vi } from "vite-plus/test";
import { cacheAsync } from "./cache-async";

afterEach(() => {
  vi.unstubAllEnvs();
});

it("build 中は同じ引数の並行読み込みと完了後の結果を共有する", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const load = vi.fn<(slug: string) => Promise<string>>(async (slug) => slug);
  const read = cacheAsync(load);
  await expect(Promise.all([read("a"), read("a")])).resolves.toStrictEqual([
    "a",
    "a",
  ]);
  await expect(read("a")).resolves.toBe("a");
  await expect(read("b")).resolves.toBe("b");
  expect(load).toHaveBeenCalledTimes(2);
});

it("dev では毎回読み込み直し、変更を反映する", async () => {
  vi.stubEnv("NODE_ENV", "development");
  const load = vi
    .fn<() => Promise<string>>()
    .mockResolvedValueOnce("before")
    .mockResolvedValueOnce("after");
  const read = cacheAsync(load);
  await expect(read()).resolves.toBe("before");
  await expect(read()).resolves.toBe("after");
});

it("失敗した読み込みは次回再試行する", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const load = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error("temporary"))
    .mockResolvedValueOnce("ok");
  const read = cacheAsync(load);
  await expect(read()).rejects.toThrow("temporary");
  await expect(read()).resolves.toBe("ok");
  expect(load).toHaveBeenCalledTimes(2);
});
