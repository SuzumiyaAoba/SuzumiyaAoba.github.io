// @vitest-environment jsdom

import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { SearchPanel } from "./search-panel";

type Search = NonNullable<Window["pagefind"]>["search"];
type SearchResponse = Awaited<ReturnType<Search>>;
type ResultData = Awaited<
  ReturnType<SearchResponse["results"][number]["data"]>
>;

const search = vi.fn<Search>();
const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
let container: HTMLDivElement;
let root: Root | null;

function result(title: string): ResultData {
  return { url: `/blog/post/${title}/`, excerpt: "", meta: { title } };
}

function response(title: string): SearchResponse {
  return { results: [{ data: async () => result(title) }] };
}

async function render(query = "") {
  await act(async () => {
    root?.render(
      <StrictMode>
        <NuqsTestingAdapter
          hasMemory
          searchParams={{ q: query, other: "keep" }}
          onUrlUpdate={onUrlUpdate}
        >
          <SearchPanel locale="en" />
        </NuqsTestingAdapter>
      </StrictMode>
    );
  });
}

function input() {
  const element = container.querySelector("input");
  if (!element) {
    throw new Error("Search input not found");
  }
  return element;
}

async function typeQuery(value: string) {
  await act(async () => {
    // React の入力値トラッカーを経由せず、ブラウザーの入力イベントを再現する。
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set?.call(input(), value);
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function advance(ms = 300) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  search.mockReset().mockResolvedValue({ results: [] });
  onUrlUpdate.mockReset();
  window.pagefind = { search };
  window.__pagefind_loaded = true;
  window.__pagefind_loading = false;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  container.remove();
  delete window.pagefind;
  delete window.__pagefind_loaded;
  delete window.__pagefind_loading;
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("SearchPanel", () => {
  it("URLの初期クエリを一度だけ検索する", async () => {
    search.mockResolvedValue(response("initial-result"));
    await render("initial");
    await advance(1000);
    expect(input().value).toBe("initial");
    expect(search).toHaveBeenCalledExactlyOnceWith("initial");
    expect(container.textContent).toContain("initial-result");
  });

  it("連続入力をまとめて検索し、URL更新後も二重に検索しない", async () => {
    await render();
    await typeQuery("r");
    await advance(100);
    await typeQuery("re");
    await advance(100);
    await typeQuery("react");
    await advance(299);
    expect(search).not.toHaveBeenCalled();
    await advance(1001);
    expect(search).toHaveBeenCalledExactlyOnceWith("react");
    const update = onUrlUpdate.mock.lastCall?.[0];
    expect(update?.searchParams.get("q")).toBe("react");
    expect(update?.searchParams.get("other")).toBe("keep");
    expect(update?.options).toMatchObject({
      history: "replace",
      shallow: true,
      scroll: false,
    });
  });

  it("古い検索応答が後から届いても、新しい結果を上書きせず詳細も取得しない", async () => {
    const old = Promise.withResolvers<SearchResponse>();
    const oldData = vi.fn<() => Promise<ResultData>>(async () =>
      result("old-result")
    );
    search
      .mockReturnValueOnce(old.promise)
      .mockResolvedValue(response("new-result"));
    await render("old");
    await advance();
    await typeQuery("new");
    await advance();
    await act(async () => old.resolve({ results: [{ data: oldData }] }));
    expect(container.textContent).toContain("new-result");
    expect(container.textContent).not.toContain("old-result");
    expect(oldData).not.toHaveBeenCalled();
  });

  it("古い検索結果の詳細取得が遅れても、新しい結果を維持する", async () => {
    const oldData = Promise.withResolvers<ResultData>();
    search
      .mockResolvedValueOnce({
        results: [{ data: async () => await oldData.promise }],
      })
      .mockResolvedValue(response("new-result"));
    await render("old");
    await advance();
    await typeQuery("new");
    await advance();
    await act(async () => oldData.resolve(result("old-result")));
    expect(container.textContent).toContain("new-result");
    expect(container.textContent).not.toContain("old-result");
  });

  it("入力を消した後に古い結果や読み込み表示が復活しない", async () => {
    const old = Promise.withResolvers<SearchResponse>();
    search.mockReturnValue(old.promise);
    await render("old");
    await advance();
    await typeQuery("");
    await advance();
    await act(async () => old.resolve(response("old-result")));
    expect(container.textContent).not.toContain("old-result");
    expect(container.textContent).not.toContain("Searching...");
    expect(onUrlUpdate.mock.lastCall?.[0].searchParams.has("q")).toBe(false);
  });

  it("検索失敗後も入力を続けて再検索できる", async () => {
    search
      .mockRejectedValueOnce(new Error("search failed"))
      .mockResolvedValue(response("recovered"));
    await render("failure");
    await advance();
    expect(container.textContent).toContain(
      "An error occurred while searching."
    );
    expect(input().disabled).toBe(false);
    await typeQuery("retry");
    await advance();
    expect(container.textContent).toContain("recovered");
    expect(container.textContent).not.toContain(
      "An error occurred while searching."
    );
  });

  it("画面離脱時は予約した検索を実行しない", async () => {
    await render("pending");
    await act(async () => root?.unmount());
    root = null;
    await advance();
    expect(search).not.toHaveBeenCalled();
  });

  it("エンジン読み込み中でもタイムアウトを通知し、後から初期化が完了すれば復帰する", async () => {
    window.__pagefind_loaded = false;
    window.__pagefind_loading = true;
    search.mockResolvedValue(response("ready-result"));
    await render("ready");
    await advance(10_000);
    expect(container.textContent).toContain("Search loading timed out.");
    expect(input().disabled).toBe(true);
    expect(search).not.toHaveBeenCalled();
    await act(async () => {
      window.__pagefind_loaded = true;
      window.dispatchEvent(new Event("pagefind:initialized"));
    });
    await advance();
    expect(container.textContent).toContain("ready-result");
    expect(input().disabled).toBe(false);
  });

  it("URLからのクエリ変更を入力欄と検索に反映する", async () => {
    await render("first");
    await advance();
    await render("second");
    await advance();
    expect(input().value).toBe("second");
    expect(search.mock.calls).toStrictEqual([["first"], ["second"]]);
  });
});
