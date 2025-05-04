import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AsciiInfo } from "@/components/svg/AsciiInfo";

describe("AsciiInfo", () => {
  it("displays the given character information", () => {
    render(<AsciiInfo char="A" hex="41" binary="1000001" />);

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

    expect(screen.getByText("ASCII:")).toBeInTheDocument();
    expect(screen.getByText("Hex:")).toBeInTheDocument();
    expect(screen.getByText("Binary:")).toBeInTheDocument();

    // hex と binary は undefined のときレンダリングされない
    expect(screen.queryByText("0x")).not.toBeInTheDocument();
    expect(screen.queryByText("0b")).not.toBeInTheDocument();
  });

  it("renders empty string for undefined char", () => {
    render(<AsciiInfo char={undefined} hex="00" binary="0000000" />);

    // char は undefined のとき空文字列になる
    const charElement = screen.getByText("ASCII:").nextSibling;
    expect(charElement?.textContent).toBe("");
  });
});
