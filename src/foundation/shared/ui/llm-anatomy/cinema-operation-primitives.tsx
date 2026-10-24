import { memo } from "react";
import type { ReactNode } from "react";
import type { CinemaFrame } from "./cinema-timeline";
import type { ComputationFrame } from "./generation-computation-model";
import type { GenerationSelection, GenerationTrace } from "./generation-math";
import {
  cinemaNumber,
  cinemaOutputCell,
  cinemaOutputLayout,
} from "./cinema-operation-math";
import { svgNumber } from "./svg-number";

export type CinemaSceneProps = {
  trace: GenerationTrace;
  selection: GenerationSelection;
  frame: CinemaFrame;
  computation: ComputationFrame;
  mobile: boolean;
  marker: string;
};

function CinemaLabelView({
  x,
  y,
  children,
  active = false,
  size = 28,
  anchor = "middle",
}: {
  x: number;
  y: number;
  children: ReactNode;
  active?: boolean;
  size?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={svgNumber(x)}
      y={svgNumber(y)}
      textAnchor={anchor}
      fontSize={size}
      className={active ? "fill-primary font-semibold" : "fill-foreground"}
    >
      {children}
    </text>
  );
}

export const CinemaLabel = memo(CinemaLabelView);

function CinemaArrowView({
  path,
  marker,
  secondary = false,
  width = 3,
}: {
  path: string;
  marker: string;
  secondary?: boolean;
  width?: number;
}) {
  return (
    <path
      d={path}
      fill="none"
      strokeWidth={svgNumber(width)}
      strokeDasharray={secondary ? "10 7" : undefined}
      className={secondary ? "stroke-chart-2" : "stroke-primary/60"}
      markerEnd={`url(#${marker})`}
    />
  );
}

export const CinemaArrow = memo(CinemaArrowView);

function CinemaValueView({
  x,
  y,
  width = 122,
  height = 58,
  value,
  label,
  active = false,
  limit = 2,
  pending = false,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  value: number;
  label?: string;
  active?: boolean;
  limit?: number;
  pending?: boolean;
}) {
  const barWidth =
    Math.min(Math.abs(value) / Math.max(limit, Number.EPSILON), 1) *
    (width / 2 - 12);
  return (
    <g
      transform={`translate(${svgNumber(x)} ${svgNumber(y)})`}
      data-cinema-value={svgNumber(value)}
      data-value-active={active ? "true" : "false"}
      data-value-pending={pending ? "true" : "false"}
    >
      <rect
        x={svgNumber(-width / 2)}
        y={svgNumber(-height / 2)}
        width={svgNumber(width)}
        height={svgNumber(height)}
        rx="8"
        strokeWidth={active ? "3" : "1.5"}
        className={
          active
            ? "fill-primary/10 stroke-primary"
            : "fill-background stroke-border"
        }
      />
      {label && (
        <CinemaLabel x={-width / 2 + 8} y={5} size={24} anchor="start">
          {label}
        </CinemaLabel>
      )}
      <CinemaLabel
        x={label ? width / 2 - 8 : 0}
        y={5}
        size={24}
        anchor={label ? "end" : "middle"}
        active={active}
      >
        {pending ? "…" : cinemaNumber(value)}
      </CinemaLabel>
      <path
        d={`M${svgNumber(-width / 2 + 10)} ${svgNumber(height / 2 - 10)} H${svgNumber(width / 2 - 10)}`}
        strokeWidth="2"
        className="stroke-muted"
      />
      <rect
        x={svgNumber(value < 0 ? -barWidth : 0)}
        y={svgNumber(height / 2 - 13)}
        width={pending ? 0 : svgNumber(barWidth)}
        height="6"
        rx="2"
        className={value < 0 ? "fill-chart-2" : "fill-primary"}
      />
    </g>
  );
}

export const CinemaValue = memo(CinemaValueView);

function CinemaOutputView({
  values,
  activeComponent,
  mobile,
  label = "全成分の出力",
  originY,
  activePending = false,
}: {
  values: readonly number[];
  activeComponent: number;
  mobile: boolean;
  label?: string;
  originY?: number;
  activePending?: boolean;
}) {
  const { startY } = cinemaOutputLayout(values.length, mobile, originY);
  const limit = Math.max(1, ...values.map((value) => Math.abs(value)));
  return (
    <g data-cinema-output>
      <CinemaLabel
        x={mobile ? 570 : 1230}
        y={mobile ? startY - 35 : 100}
        anchor={mobile ? "end" : "middle"}
        size={mobile ? 26 : 28}
        active
      >
        {label}
      </CinemaLabel>
      {values.map((value, index) => (
        <CinemaValue
          key={`output-${index}`}
          {...cinemaOutputCell(values.length, index, mobile, originY)}
          value={value}
          active={index === activeComponent}
          pending={activePending && index === activeComponent}
          limit={limit}
        />
      ))}
    </g>
  );
}

export const CinemaOutput = memo(CinemaOutputView);
