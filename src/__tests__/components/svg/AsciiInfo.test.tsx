import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AsciiInfo } from "@/components/svg/AsciiInfo";

// next-themes のモックを作成
vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
  }),
}));

describe("AsciiInfo", () => {
  it("displays the given character information", () => {
    render(<AsciiInfo char="A" hex="41" binary="1000001" />);

    expect(screen.getByText("Character")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("0x")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("0b")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("0001")).toBeInTheDocument();
  });

  it("handles undefined values", () => {
    render(<AsciiInfo char={undefined} hex={undefined} binary={undefined} />);

    expect(screen.getByText("Character")).toBeInTheDocument();
    expect(screen.getByText("Hex")).toBeInTheDocument();
    expect(screen.getByText("Binary")).toBeInTheDocument();

    // hex と binary は undefined のとき "--" が表示される
    expect(screen.getAllByText("--")).toHaveLength(3);
    expect(screen.queryByText("0x")).not.toBeInTheDocument();
    expect(screen.queryByText("0b")).not.toBeInTheDocument();
  });

  it("renders placeholder for undefined char", () => {
    render(<AsciiInfo char={undefined} hex="00" binary="0000000" />);

    // char は undefined のとき -- が表示される
    const charContainer = screen.getByText("Character").parentElement;
    expect(charContainer?.querySelector(".font-mono")?.textContent).toBe("--");

    // hex と binary は値が表示される
    expect(screen.getByText("0x")).toBeInTheDocument();
    expect(screen.getByText("0b")).toBeInTheDocument();
    expect(screen.getByText("000")).toBeInTheDocument();
    expect(screen.getByText("0000")).toBeInTheDocument();

    // 複数の "0" が存在することを確認
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(2);

    // グリーンの0とスカイブルーの0があることを確認
    // それぞれのspanのstyle.colorで判定する
    const greenZero = zeros.find(
      (z) => z instanceof HTMLElement && z.style.color === "rgb(22, 163, 74)"
    );
    const skyZero = zeros.find(
      (z) => z instanceof HTMLElement && z.style.color === "rgb(2, 132, 199)"
    );
    expect(greenZero).toBeDefined();
    expect(skyZero).toBeDefined();
  });
});
