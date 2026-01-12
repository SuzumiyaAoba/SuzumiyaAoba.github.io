// 型定義
export type Cell = [number, number];

// カラーテーマ定義
export const THEME_COLORS = {
  light: {
    stroke: "#1e293b",
    border: "#475569",
    hover: {
      primary: "oklch(0.723 0.219 149.579)", // 緑がかった青
      secondary: "oklch(0.872 0.01 258.338)", // ライトパープル
      highlight: "oklch(0.885 0.062 18.334)", // オレンジ
      rowHighlight: "oklch(0.901 0.058 230.902)", // 薄い紫
      colHighlight: "oklch(0.925 0.084 155.995)", // 薄い緑青
      b1b4: "oklch(0.685 0.169 237.323)", // 濃い青
    },
    text: {
      normal: "#1e293b",
      hover: "#ffffff",
      accent: "#4f46e5",
    },
  },
  dark: {
    stroke: "#f8fafc",
    border: "#64748b",
    hover: {
      primary: "oklch(0.523 0.219 149.579)", // 暗めの緑青
      secondary: "oklch(0.672 0.1 258.338)", // 濃い紫
      highlight: "oklch(0.685 0.162 18.334)", // 暗めのオレンジ
      rowHighlight: "oklch(0.701 0.088 230.902)", // 暗い紫
      colHighlight: "oklch(0.725 0.094 155.995)", // 暗い緑青
      b1b4: "oklch(0.585 0.169 237.323)", // 濃い青
    },
    text: {
      normal: "#f8fafc",
      hover: "#ffffff",
      accent: "#818cf8",
    },
  },
};

// ユーティリティ関数
const cellToBinary = ([x, y]: Cell) =>
  x.toString(2).padStart(3, "0") + y.toString(2).padStart(4, "0");

const cellToHex = ([x, y]: Cell) =>
  x.toString(16).padStart(1, "0") + y.toString(16).padStart(1, "0");

export const ASCII_TABLE: string[][] = [
  ["NUL", "DLE", "SP", "0", "@", "P", "`", "p"],
  ["SOH", "DC1", "!", "1", "A", "Q", "a", "q"],
  ["STX", "DC2", '"', "2", "B", "R", "b", "r"],
  ["ETX", "DC3", "#", "3", "C", "S", "c", "s"],
  ["EOT", "DC4", "$", "4", "D", "T", "d", "t"],
  ["ENQ", "NAK", "%", "5", "E", "U", "e", "u"],
  ["ACK", "SYN", "&", "6", "F", "V", "f", "v"],
  ["BEL", "ETB", "'", "7", "G", "W", "g", "w"],
  ["BS", "CAN", "(", "8", "H", "X", "h", "x"],
  ["HT", "EM", ")", "9", "I", "Y", "i", "y"],
  ["LF", "SUB", "*", ":", "J", "Z", "j", "z"],
  ["VT", "ESC", "+", ";", "K", "[", "k", "{"],
  ["FF", "FS", ",", "<", "L", "\\", "l", "|"],
  ["CR", "GS", "-", "=", "M", "]", "m", "}"],
  ["SO", "RS", ".", ">", "N", "^", "n", "~"],
  ["SI", "US", "/", "?", "O", "_", "o", "DEL"],
] as const;

export const cellToInfo = (cell: Cell | undefined) => {
  if (!cell) {
    return { char: undefined, hex: undefined, binary: undefined };
  }
  const [x, y] = cell;
  const char = ASCII_TABLE[y]?.[x];
  const hex = cellToHex([x, y]);
  const binary = cellToBinary([x, y]);
  return { char, hex, binary };
};

export const ASCII_TABLE_ATTR = {
  colNum: 8,
  rowNum: 16,
  x: 202,
  y: 162,
  cellWidth: 60,
  cellHeight: 32,
  offsetX: 15,
  offsetY: -10,
} as const;

export const LEFT_SIDE_ATTR = {
  y: ASCII_TABLE_ATTR.y,
  cellWidth: ASCII_TABLE_ATTR.x / 5,
  cellHeight: ASCII_TABLE_ATTR.cellHeight,
  offset: {
    x: 16,
    y: ASCII_TABLE_ATTR.offsetY,
  },
  fontSize: "0.8rem",
  color: {
    b1b4: {
      hover: {
        background: THEME_COLORS.light.hover.b1b4,
        text: THEME_COLORS.light.text.hover,
      },
    },
    column: {
      hover: {
        background: THEME_COLORS.light.hover.secondary,
      },
    },
  },
} as const;
