"use client";

import { createContext, useContext, useState } from "react";
import { range } from "d3";
import Arrow from "./Arrow";
import { RectText } from "./RectText";

type Cell = [number, number];

const HoveredCellContext = createContext<Cell | undefined>(undefined);
const ClickedCellContext = createContext<Cell | undefined>(undefined);

const cellToBinary = ([x, y]: Cell) =>
  x.toString(2).padStart(3, "0") + y.toString(2).padStart(4, "0");

const cellToHex = ([x, y]: Cell) =>
  x.toString(16).padStart(1, "0") + y.toString(16).padStart(1, "0");

const cellToInfo = (cell: Cell | undefined) => {
  if (!cell) {
    return { char: undefined, hex: undefined, binary: undefined };
  }

  const [x, y] = cell;
  const char = ASCII_TABLE[y][x];
  const hex = cellToHex([x, y]);
  const binary = cellToBinary([x, y]);

  return { char, hex, binary };
};

const ASCII_TABLE_ATTR = {
  colNum: 8,
  rowNum: 16,
  x: 202,
  y: 162,
  cellWidth: 60,
  cellHeight: 32,
  offsetX: 15,
  offsetY: -10,
} as const;

const LEFT_SIDE_ATTR = {
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

const ASCII_TABLE: string[][] = [
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

const AsciiTable = ({
  onClick,
  onMouseOver,
}: {
  onClick: (cell: Cell) => void;
  onMouseOver: (cell: Cell) => void;
}) => {
  const { colNum, rowNum, x, y, cellWidth, cellHeight, offsetX } =
    ASCII_TABLE_ATTR;
  const hoveredCell = useContext(HoveredCellContext);
  const clickedCell = useContext(ClickedCellContext);

  return range(rowNum).map((py) =>
    Array.from({ length: colNum }, (_, k) => k).map((px) => {
      const isHoveredRow = hoveredCell?.[1] === py;
      const isHoveredCol = hoveredCell?.[0] === px;
      const isHovered = isHoveredRow && isHoveredCol;
      const isClicked = clickedCell?.[0] === px && clickedCell?.[1] === py;

      return (
        <RectText
          key={`ascii-table-${px}-${py}`}
          x={x + px * cellWidth + 2}
          y={y + py * cellHeight}
          width={cellWidth}
          height={cellHeight}
          fill={isHovered
            ? "oklch(0.885 0.062 18.334)"
            : isClicked
            ? "oklch(0.872 0.01 258.338)"
            : isHoveredRow
            ? "oklch(0.901 0.058 230.902)"
            : isHoveredCol
            ? "oklch(0.925 0.084 155.995)"
            : "transparent"}
          offsetX={offsetX}
          stroke="black"
          fontWeight={isHovered || isClicked ? "bold" : "normal"}
          onClick={() => {
            onClick([px, py]);
          }}
          onMouseOver={() => {
            onMouseOver([px, py]);
          }}
        >
          {ASCII_TABLE[py][px]}
        </RectText>
      );
    })
  );
};

const LeftSide = () => {
  const { y, cellWidth, cellHeight, offset, color } = LEFT_SIDE_ATTR;

  const hoveredValue = useContext(HoveredCellContext);
  const columnNum = 4;

  return (
    <g>
      {range(ASCII_TABLE.length).flatMap((py) => {
        const isHover = hoveredValue?.[1] === py;

        return [
          ...py
            .toString(2)
            .padStart(columnNum, "0")
            .split("")
            .map((b, px) => (
              <RectText
                key={`left-side-${py}-${px}`}
                x={cellWidth * px}
                y={y + cellHeight * py}
                width={cellWidth}
                height={cellHeight}
                fill={isHover ? color.b1b4.hover.background : "transparent"}
                stroke="black"
                offsetX={offset.x}
                fontSize="0.8rem"
                fontWeight={isHover ? "bold" : "normal"}
                color={isHover ? "white" : "black"}
              >
                {b}
              </RectText>
            )),
          <RectText
            key={`left-side-${py}-text`}
            x={cellWidth * columnNum}
            y={y + cellHeight * py}
            width={cellWidth}
            height={cellHeight}
            fill={isHover ? color.column.hover.background : "transparent"}
            stroke="black"
            offsetX={offset.x}
            fontSize="0.8rem"
            fontWeight={isHover ? "bold" : "normal"}
          >
            {py}
          </RectText>,
        ];
      })}
    </g>
  );
};

const TopSide = () => {
  const { cellWidth, cellHeight } = ASCII_TABLE_ATTR;
  const x = ASCII_TABLE_ATTR.x + 2;
  const fontSize = "0.8rem";
  const offsetX = ASCII_TABLE_ATTR.offsetX + cellWidth / 5;
  const hoveredValue = useContext(HoveredCellContext);

  const columnNum = 8;

  return range(columnNum).flatMap((px) => {
    const isHovered = hoveredValue?.[0] === px;

    return (
      <g>
        {px
          .toString(2)
          .padStart(3, "0")
          .split("")
          .map((b, py) => {
            return (
              <RectText
                key={`top-side-${px}-${py}`}
                x={x + cellWidth * px}
                y={cellHeight * py}
                width={cellWidth}
                height={cellHeight}
                offsetX={offsetX}
                sides={["left", "right"]}
                stroke="black"
                fill={isHovered ? "oklch(0.723 0.219 149.579)" : "transparent"}
                fontWeight={isHovered ? "bold" : "normal"}
                color={isHovered ? "#ffffff" : "black"}
              >
                {b}
              </RectText>
            );
          })}
        <RectText
          x={x + cellWidth * px}
          y={cellHeight * 3}
          width={cellWidth}
          height={cellHeight * 2}
          fill={isHovered ? "oklch(0.872 0.01 258.338)" : "transparent"}
          stroke="black"
          fontSize={fontSize}
          offsetX={offsetX - 2}
          offsetY={cellHeight * 0.75}
        >
          {px}
        </RectText>
      </g>
    );
  });
};

const AsciiInfo = ({
  char,
  hex,
  binary,
}: {
  char: string | undefined;
  hex: string | undefined;
  binary: string | undefined;
}) => {
  return (
    <div className="grid grid-cols-[max-content_1fr]">
      <span className="text-right pr-4 font-bold">ASCII:</span>
      <span className="font-mono">{char ?? ""}</span>
      <span className="text-right pr-4 font-bold">Hex:</span>
      <span className="font-mono">
        {hex && (
          <>
            <span className="text-gray-400">0x</span>
            <span className="text-green-600">{hex.slice(0, 1)}</span>
            <span className="text-sky-600">{hex.slice(1, 2)}</span>
          </>
        )}
      </span>
      <span className="text-right pr-4 font-bold">Binary:</span>
      <span className="font-mono">
        {binary && (
          <>
            <span className="text-gray-400">0b</span>
            <span className="text-green-600">{binary.slice(0, 3)}</span>
            <span className="text-sky-600">{binary.slice(3, 7)}</span>
          </>
        )}
      </span>
    </div>
  );
};

const B1b4Row = () => {
  const { x, y, cellHeight, offsetX } = ASCII_TABLE_ATTR;
  const cellWidth = x / 5;

  const Texts = [
    ...range(4).map((px) => (
      <text
        key={`b1b4row-${px}-text`}
        x={px * cellWidth + offsetX}
        y={y - 10}
        fontSize="0.8rem"
      >
        {`b${4 - px}`}
      </text>
    )),
    <text
      key={`row-text`}
      x={4 * cellWidth + offsetX / 2}
      y={y - 10}
      fontSize="0.8rem"
    >
      ROW
    </text>,
  ];

  const Lines = range(6).map((px) => (
    <line
      key={`lines-${px}-line`}
      x1={px * cellWidth}
      y1={y - cellHeight}
      x2={px * cellWidth}
      y2={y}
      stroke="black"
      strokeWidth="1"
    />
  ));

  return (
    <>
      {Texts}
      {Lines}
    </>
  );
};

const ColumnRow = () => {
  const { x, y, cellHeight, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 30;
  const textY = y - cellHeight + offsetY;
  const arrowY = textY + offsetY / 2;

  return (
    <>
      <text x={cellWidth * 16} y={textY} fontSize="0.8rem">
        COLUMN
      </text>
      <Arrow
        startX={cellWidth * 24}
        startY={arrowY}
        endX={cellWidth * 30}
        endY={arrowY}
      />
    </>
  );
};

const B5B7Rows = () => {
  const { x, cellHeight, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 5;

  return (
    <>
      {range(3).flatMap((py) => {
        const textX = cellWidth * 2 + (cellWidth / 2) * py;
        const textY = (py + 1) * cellHeight + offsetY;

        return [
          <text
            key={`b5b7rows-${py}-text`}
            x={textX}
            y={textY}
            fontSize="0.8rem"
          >
            {`b${7 - py}`}
          </text>,
          <Arrow
            key={`b5b7-rows-${py}-arrow`}
            startX={textX + cellWidth / 2}
            startY={textY + offsetY / 2}
            endX={x}
            endY={textY + offsetY / 2}
          />,
        ];
      })}
    </>
  );
};

const Bits = () => {
  const { x, cellHeight, offsetX, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 5;

  return (
    <>
      {["B", "I", "T", "S"].map((char, py) => (
        <text
          key={`bits-${py}-text`}
          x={(cellWidth * py) / 2 + offsetX}
          y={((py + 1) * cellHeight) / 1.25}
          fontSize="0.8rem"
        >
          {char}
        </text>
      ))}
      <line
        x1={(cellWidth * 2) / 2}
        y1={-offsetY}
        x2={(cellWidth * 5) / 2}
        y2={cellHeight * 3}
        stroke="black"
        strokeWidth="1"
      />
    </>
  );
};

export const TopLine = () => {
  const { cellWidth } = ASCII_TABLE_ATTR;

  return (
    <line
      x1={0}
      y1={0}
      x2={cellWidth * 3.5}
      y2={0}
      stroke="black"
      strokeWidth="1"
    />
  );
};

export default function StandardCode() {
  const [hoveredCell, setHoveredCell] = useState<Cell | undefined>(undefined);
  const [clickedCell, setClickedCell] = useState<Cell | undefined>(undefined);

  return (
    <HoveredCellContext.Provider value={hoveredCell}>
      <ClickedCellContext.Provider value={clickedCell}>
        <div>
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
