"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { range } from "d3";
import Arrow from "./Arrow";
import { RectText } from "./RectText";
import {
  Cell,
  cellToBinary,
  cellToHex,
  cellToInfo,
  ASCII_TABLE_ATTR,
  LEFT_SIDE_ATTR,
  ASCII_TABLE,
} from "./StandardCode.utils";
import { AsciiTable } from "./AsciiTable";
import { LeftSide } from "./LeftSide";
import { TopSide } from "./TopSide";
import { B1b4Row } from "./B1b4Row";
import { ColumnRow } from "./ColumnRow";
import { B5B7Rows } from "./B5B7Rows";
import { Bits } from "./Bits";
import { TopLine } from "./TopLine";
import { AsciiInfo } from "./AsciiInfo";
import { HoveredCellContext, ClickedCellContext } from "./StandardCode.context";

export default function StandardCode() {
  const [hoveredCell, setHoveredCell] = useState<Cell | undefined>(undefined);
  const [clickedCell, setClickedCell] = useState<Cell | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  // クライアント側でのみ実行されるようにする
  useEffect(() => {
    setMounted(true);
  }, []);

  // サーバーサイドレンダリング時には特定のスタイルを適用しない
  if (!mounted) {
    return (
      <div className="min-h-[700px]">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <HoveredCellContext.Provider value={hoveredCell}>
      <ClickedCellContext.Provider value={clickedCell}>
        <div style={{ color: "var(--foreground)" }}>
          <svg width={700} height={700}>
            <AsciiTable onClick={setClickedCell} onMouseOver={setHoveredCell} />
            <LeftSide />
            <TopSide />
            <B1b4Row />
            <ColumnRow />
            <B5B7Rows />
            <Bits />
            <TopLine />
          </svg>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xl mb-2 font-bold">Hover</div>
              <AsciiInfo {...cellToInfo(hoveredCell)} />
            </div>

            <div>
              <div className="text-xl mb-2 font-bold">Clicked</div>
              <AsciiInfo {...cellToInfo(clickedCell)} />
            </div>
          </div>
        </div>
      </ClickedCellContext.Provider>
    </HoveredCellContext.Provider>
  );
}
