import { describe, expect, it } from "vitest";
import { decodePathParam } from "./decode-path-param";

describe("decodePathParam", () => {
  it.each([
    ["TypeScript", "TypeScript"],
    ["C%2B%2B", "C++"],
    ["%E6%97%A5%E6%9C%AC%E8%AA%9E", "日本語"],
    ["%E6%97%", "%E6%97%"],
    ["100%", "100%"],
    ["%252F", "%2F"],
  ])("%s を一度だけデコードする", (input, expected) => {
    expect(decodePathParam(input)).toBe(expected);
  });
});
