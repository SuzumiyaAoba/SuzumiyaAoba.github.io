import { describe, it, expect } from "vitest";
import {
  cellToBinary,
  cellToHex,
  cellToInfo,
  ASCII_TABLE,
} from "@/components/svg/StandardCode.utils";

describe("StandardCode utilities", () => {
  describe("cellToBinary", () => {
    it("converts cell coordinates to binary string", () => {
      expect(cellToBinary([0, 0])).toBe("0000000");
      expect(cellToBinary([1, 2])).toBe("0010010");
      expect(cellToBinary([7, 15])).toBe("1111111");
      expect(cellToBinary([3, 4])).toBe("0110100");
    });

    it("pads the binary values with leading zeros", () => {
      // 3進数では011, 4進数では0100だが、パディングされる
      const result = cellToBinary([3, 4]);
      expect(result.length).toBe(7);
      expect(result.substring(0, 3)).toBe("011"); // x座標は3桁
      expect(result.substring(3)).toBe("0100"); // y座標は4桁
    });
  });

  describe("cellToHex", () => {
    it("converts cell coordinates to hex string", () => {
      expect(cellToHex([0, 0])).toBe("00");
      expect(cellToHex([1, 2])).toBe("12");
      expect(cellToHex([15, 15])).toBe("ff");
      expect(cellToHex([10, 11])).toBe("ab");
    });

    it("pads the hex values with leading zeros if needed", () => {
      expect(cellToHex([0, 5])).toBe("05");
      expect(cellToHex([5, 0])).toBe("50");
    });
  });

  describe("cellToInfo", () => {
    it("returns undefined info for undefined cell", () => {
      const result = cellToInfo(undefined);
      expect(result.char).toBeUndefined();
      expect(result.hex).toBeUndefined();
      expect(result.binary).toBeUndefined();
    });

    it("returns correct info for given cell", () => {
      // セル[1, 2]は ASCII_TABLE[2][1] で "DC2" を表す
      const result = cellToInfo([1, 2]);
      expect(result.char).toBe(ASCII_TABLE[2][1]);
      expect(result.hex).toBe("12");
      expect(result.binary).toBe("0010010");
    });

    it("returns info for cell at the edge of table", () => {
      // セル[7, 15]は ASCII_TABLE[15][7] で "DEL" を表す
      const result = cellToInfo([7, 15]);
      expect(result.char).toBe(ASCII_TABLE[15][7]);
      expect(result.hex).toBe("7f");
      expect(result.binary).toBe("1111111");
    });
  });

  describe("ASCII_TABLE", () => {
    it("has correct dimensions", () => {
      expect(ASCII_TABLE.length).toBe(16); // 16行
      expect(ASCII_TABLE[0].length).toBe(8); // 8列
    });

    it("contains expected ASCII characters", () => {
      // 一部の代表的な値をチェック
      expect(ASCII_TABLE[0][0]).toBe("NUL"); // NULL
      expect(ASCII_TABLE[0][2]).toBe("SP"); // Space
      expect(ASCII_TABLE[4][3]).toBe("4"); // 数字
      expect(ASCII_TABLE[5][4]).toBe("E"); // 大文字
      expect(ASCII_TABLE[6][6]).toBe("f"); // 小文字
      expect(ASCII_TABLE[15][7]).toBe("DEL"); // Delete
    });
  });
});
