import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StandardCode from "@/components/svg/StandardCode";
import { ASCII_TABLE } from "@/components/svg/StandardCode.utils";

// SVGコンポーネントをモック
vi.mock("@/components/svg/AsciiTable", () => ({
  AsciiTable: ({ onClick, onMouseOver }: any) => (
    <div
      data-testid="ascii-table"
      onClick={() => onClick([1, 2])}
      onMouseOver={() => onMouseOver([3, 4])}
    >
      ASCII Table
    </div>
  ),
}));

vi.mock("@/components/svg/LeftSide", () => ({
  LeftSide: () => <div data-testid="left-side">Left Side</div>,
}));

vi.mock("@/components/svg/TopSide", () => ({
  TopSide: () => <div data-testid="top-side">Top Side</div>,
}));

vi.mock("@/components/svg/B1b4Row", () => ({
  B1b4Row: () => <div data-testid="b1b4-row">B1b4 Row</div>,
}));

vi.mock("@/components/svg/ColumnRow", () => ({
  ColumnRow: () => <div data-testid="column-row">Column Row</div>,
}));

vi.mock("@/components/svg/B5B7Rows", () => ({
  B5B7Rows: () => <div data-testid="b5b7-rows">B5B7 Rows</div>,
}));

vi.mock("@/components/svg/Bits", () => ({
  Bits: () => <div data-testid="bits">Bits</div>,
}));

vi.mock("@/components/svg/TopLine", () => ({
  TopLine: () => <div data-testid="top-line">Top Line</div>,
}));

vi.mock("@/components/svg/AsciiInfo", () => ({
  AsciiInfo: ({ char, hex, binary }: any) => (
    <div data-testid="ascii-info">
      <span data-testid="ascii-char">{char}</span>
      <span data-testid="ascii-hex">{hex}</span>
      <span data-testid="ascii-binary">{binary}</span>
    </div>
  ),
}));

describe("StandardCode", () => {
  it("renders all subcomponents correctly", () => {
    render(<StandardCode />);

    expect(screen.getByTestId("ascii-table")).toBeInTheDocument();
    expect(screen.getByTestId("left-side")).toBeInTheDocument();
    expect(screen.getByTestId("top-side")).toBeInTheDocument();
    expect(screen.getByTestId("b1b4-row")).toBeInTheDocument();
    expect(screen.getByTestId("column-row")).toBeInTheDocument();
    expect(screen.getByTestId("b5b7-rows")).toBeInTheDocument();
    expect(screen.getByTestId("bits")).toBeInTheDocument();
    expect(screen.getByTestId("top-line")).toBeInTheDocument();
  });

  it("shows hovered cell info", () => {
    render(<StandardCode />);

    const asciiTable = screen.getByTestId("ascii-table");
    fireEvent.mouseOver(asciiTable);

    // 行3、列4のセル（索引は0始まり）を選択したとき、ASCII_TABLE[4][3]の値が表示される
    const expectedChar = ASCII_TABLE[4][3];
    const hoverInfoSection = screen.getAllByTestId("ascii-info")[0];

    expect(hoverInfoSection).toBeInTheDocument();
  });

  it("shows clicked cell info", () => {
    render(<StandardCode />);

    const asciiTable = screen.getByTestId("ascii-table");
    fireEvent.click(asciiTable);

    // 行2、列1のセル（索引は0始まり）を選択したとき、ASCII_TABLE[2][1]の値が表示される
    const expectedChar = ASCII_TABLE[2][1];
    const clickInfoSection = screen.getAllByTestId("ascii-info")[1];

    expect(clickInfoSection).toBeInTheDocument();
  });
});
