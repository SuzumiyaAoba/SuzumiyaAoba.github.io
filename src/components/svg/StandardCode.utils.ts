// 型定義
export type Cell = [number, number];

// ユーティリティ関数
export const cellToBinary = ([x, y]: Cell) =>
  x.toString(2).padStart(3, "0") + y.toString(2).padStart(4, "0");

export const cellToHex = ([x, y]: Cell) =>
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
  const char = ASCII_TABLE[y][x];
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
        background: "oklch(0.685 0.169 237.323)",
        text: "#ffffff",
      },
    },
    column: {
      hover: {
        background: "oklch(0.872 0.01 258.338)",
      },
    },
  },
} as const;
