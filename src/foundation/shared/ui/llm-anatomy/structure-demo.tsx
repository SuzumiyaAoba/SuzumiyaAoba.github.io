"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- 回転できるSVG図に、画像としての説明と代替テキストを与える。 */

import { useId, useState } from "react";
import { Button } from "@/shared/ui/button";
import { prismFaces, projectPoint, STRUCTURE_SCENES } from "./structure-model";
import type { Point3, StructureNode, StructureView } from "./structure-model";
import { svgNumber } from "./svg-number";
import { DemoFrame } from "./visual-frame";

const INITIAL_YAW = -24;
const INITIAL_PITCH = 18;
const PART_NAMES = {
  A: "A 入力",
  B: "B Transformer",
  C: "C 出力",
} as const;
const PART_FILLS = {
  A: "fill-chart-2/20",
  B: "fill-primary/15",
  C: "fill-chart-3/20",
} as const;

function projectedPoints(
  points: readonly Point3[],
  yaw: number,
  pitch: number
): string {
  return points
    .map((point) => {
      const projected = projectPoint(point, yaw, pitch);
      return `${svgNumber(projected.x)},${svgNumber(projected.y)}`;
    })
    .join(" ");
}

function tensorGrid(node: StructureNode): readonly (readonly Point3[])[] {
  const [x, y, z] = node.center;
  const [width, thickness, depth] = node.size;
  const left = x - width / 2;
  const back = z - depth / 2;
  const top = y - thickness / 2;
  const lines: Point3[][] = [];
  // マスの数は実際のテンソルの要素数ではなく、二つの軸を示す。
  const columns = width < 60 ? 1 : 6;
  const rows = depth < 30 ? 1 : 8;
  for (let index = 1; index < columns; index++) {
    const position = left + (width * index) / columns;
    lines.push([
      [position, top, back],
      [position, top, back + depth],
    ]);
  }
  for (let index = 1; index < rows; index++) {
    const component = back + (depth * index) / rows;
    lines.push([
      [left, top, component],
      [left + width, top, component],
    ]);
  }
  return lines;
}

function TensorPlate({
  node,
  selected,
  yaw,
  pitch,
}: {
  node: StructureNode;
  selected: boolean;
  yaw: number;
  pitch: number;
}) {
  const center = projectPoint(node.center, yaw, pitch);
  if (node.kind === "sum") {
    return (
      <g>
        <circle
          cx={svgNumber(center.x)}
          cy={svgNumber(center.y)}
          r="16"
          className={
            selected
              ? "fill-background stroke-primary"
              : "fill-background stroke-foreground"
          }
          strokeWidth="2"
        />
        <text
          x={svgNumber(center.x)}
          y={svgNumber(center.y + 5)}
          textAnchor="middle"
          className="fill-foreground text-base"
        >
          ＋
        </text>
      </g>
    );
  }
  return (
    <g>
      {prismFaces(node, yaw, pitch).map((face) => (
        <polygon
          key={face.key}
          points={face.points}
          strokeWidth={selected ? "2" : "1"}
          strokeLinejoin="round"
          className={
            selected
              ? "fill-primary/25 stroke-primary"
              : `${PART_FILLS[node.part]} stroke-muted-foreground`
          }
        />
      ))}
      <g fill="none" className="stroke-muted-foreground/35" strokeWidth="0.7">
        {tensorGrid(node).map((line, index) => (
          <polyline
            key={`${node.id}-grid-${index + 1}`}
            points={projectedPoints(line, yaw, pitch)}
          />
        ))}
      </g>
    </g>
  );
}

function StructureDiagram({
  view,
  selectedId,
  yaw,
  pitch,
}: {
  view: StructureView;
  selectedId: string;
  yaw: number;
  pitch: number;
}) {
  const id = useId();
  const scene = STRUCTURE_SCENES[view];
  const sortedNodes = scene.nodes.toSorted(
    (left, right) =>
      projectPoint(left.center, yaw, pitch).depth -
      projectPoint(right.center, yaw, pitch).depth
  );
  return (
    <div className="overflow-x-auto rounded-lg border bg-background">
      <svg
        viewBox="0 0 860 850"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="h-auto w-full min-w-2xl"
      >
        <title id={`${id}-title`}>
          {view === "overview"
            ? "GPT-3 175Bの入力から次トークンの確率までの3D構造図"
            : "Pre-LN Transformerブロックの残差接続を含む3D構造図"}
        </title>
        <desc id={`${id}-description`}>{scene.description}</desc>
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground" />
          </marker>
          <marker
            id={`${id}-residual`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-chart-2" />
          </marker>
        </defs>
        <text x="28" y="30" className="fill-foreground text-sm font-medium">
          {view === "overview"
            ? "モデル全体 · 96ブロック"
            : "1ブロックを展開 · Pre-LN"}
        </text>
        <text x="535" y="30" className="fill-muted-foreground text-xs">
          処理の順序 ↓ ／ バッチ次元は省略
        </text>
        {sortedNodes.map((node) => (
          <TensorPlate
            key={node.id}
            node={node}
            selected={selectedId === node.id}
            yaw={yaw}
            pitch={pitch}
          />
        ))}
        {scene.edges.map((edge) => (
          <polyline
            key={edge.id}
            data-residual={edge.residual ? "true" : undefined}
            points={projectedPoints(edge.points, yaw, pitch)}
            fill="none"
            strokeWidth={edge.residual ? "2.5" : "1.8"}
            strokeDasharray={edge.residual ? "7 4" : undefined}
            strokeLinejoin="round"
            className={
              edge.residual ? "stroke-chart-2" : "stroke-muted-foreground"
            }
            markerEnd={`url(#${id}-${edge.residual ? "residual" : "arrow"})`}
          />
        ))}
        {scene.nodes.map((node) => {
          const center = projectPoint(node.center, yaw, pitch);
          const edge = projectPoint(
            [node.center[0] + node.size[0] / 2, node.center[1], node.center[2]],
            yaw,
            pitch
          );
          return (
            <g key={`${node.id}-label`}>
              <path
                d={`M ${svgNumber(edge.x + 12)} ${svgNumber(center.y)} H 515`}
                className={
                  selectedId === node.id ? "stroke-primary" : "stroke-border"
                }
                fill="none"
                strokeDasharray="3 3"
              />
              <text
                x="535"
                y={svgNumber(center.y - 6)}
                className="fill-foreground text-sm font-medium"
              >
                {node.part} · {node.label}
              </text>
              <text
                x="535"
                y={svgNumber(center.y + 15)}
                className="fill-muted-foreground text-xs"
              >
                {node.shape}
              </text>
            </g>
          );
        })}
        <g className="fill-muted-foreground text-xs">
          <text x="28" y="800">
            横：トークン位置 n
          </text>
          <text x="28" y="822">
            奥行き：表現の成分 d（出力では語彙）
          </text>
          <text x="535" y="800">
            n ≤ 2,048 ／ d = 12,288
          </text>
          <text x="535" y="822">
            枚数・面積・厚みは実寸比ではない
          </text>
        </g>
      </svg>
    </div>
  );
}

export function LlmArchitecture3D() {
  const id = useId();
  const [view, setView] = useState<StructureView>("overview");
  const [selectedId, setSelectedId] = useState("embedding");
  const [yaw, setYaw] = useState(INITIAL_YAW);
  const [pitch, setPitch] = useState(INITIAL_PITCH);
  const scene = STRUCTURE_SCENES[view];
  const selected =
    scene.nodes.find((node) => node.id === selectedId) ?? scene.nodes[0];

  function changeView(nextView: StructureView) {
    setView(nextView);
    setSelectedId(nextView === "overview" ? "embedding" : "attention");
  }

  return (
    <DemoFrame
      title="LLMの全体と、1ブロックの内部を立体で読む"
      label="LLMの構造を示す操作可能な3D図"
      description="GPT-3 175Bを対象に、表現を行列の板として描いた構造図である。視点を変えても計算の接続関係は変わらない。板のマス目は軸を示す模式表現であり、ニューロン数や学習済みの値を表さない。"
    >
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">構造図の表示範囲</legend>
        <Button
          type="button"
          variant={view === "overview" ? "default" : "outline"}
          aria-pressed={view === "overview"}
          onClick={() => changeView("overview")}
        >
          モデル全体
        </Button>
        <Button
          type="button"
          variant={view === "block" ? "default" : "outline"}
          aria-pressed={view === "block"}
          onClick={() => changeView("block")}
        >
          1ブロックを展開
        </Button>
      </fieldset>

      <p className="text-xs leading-relaxed text-muted-foreground">
        n：入力のトークン数 ／ d：1位置の表現の次元数 ／ |V|：語彙数（50,257）
      </p>
      <StructureDiagram
        view={view}
        selectedId={selectedId}
        yaw={yaw}
        pitch={pitch}
      />
      <p className="text-xs text-muted-foreground sm:hidden">
        図を左右にスクロールすると、各段階のラベルも確認できる。
      </p>

      <fieldset className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
        <legend className="px-2 text-sm font-medium">3Dの視点</legend>
        <label htmlFor={`${id}-yaw`} className="grid gap-2">
          <span>左右の回転：{yaw}°</span>
          <input
            id={`${id}-yaw`}
            type="range"
            min="-35"
            max="35"
            step="1"
            value={yaw}
            onChange={(event) => setYaw(Number(event.currentTarget.value))}
            className="w-full accent-primary"
          />
        </label>
        <label htmlFor={`${id}-pitch`} className="grid gap-2">
          <span>見下ろす角度：{pitch}°</span>
          <input
            id={`${id}-pitch`}
            type="range"
            min="8"
            max="28"
            step="1"
            value={pitch}
            onChange={(event) => setPitch(Number(event.currentTarget.value))}
            className="w-full accent-primary"
          />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setYaw(INITIAL_YAW);
              setPitch(INITIAL_PITCH);
            }}
          >
            視点を戻す
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setYaw(0);
              setPitch(8);
            }}
          >
            接続を正面から見る
          </Button>
        </div>
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor={`${id}-stage`} className="font-medium">
          段階を選んで読む
        </label>
        <select
          id={`${id}-stage`}
          value={selectedId}
          onChange={(event) => setSelectedId(event.currentTarget.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
        >
          {scene.nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {PART_NAMES[node.part]} · {node.label}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <output
          className="block space-y-2 rounded-md border bg-muted p-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="block font-medium">
            {PART_NAMES[selected.part]} · {selected.label}
          </span>
          <span className="block font-mono text-xs">{selected.shape}</span>
          <span className="block leading-relaxed">{selected.description}</span>
        </output>
      )}
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
        <p>
          実線の矢印は次の計算へ渡す関係、破線の矢印は元の表現を直接加える残差接続を示す。＋では同じ形状の行列を成分ごとに加える。
        </p>
        <p>
          縦方向は計算の段階であり、3軸は物理的な配置や意味空間の座標ではない。全体図の中間94層はまとめて表示している。96層はそれぞれ別の重みを持つ。
        </p>
        <p>
          図の出力側は次の1トークンを生成する場合を示す。学習時には各位置に同じ語彙への変換を適用する。softmaxの後でのトークン選択と入力への追加は、このモデルの外側で行う。
        </p>
        <p>
          GPT-3ではdenseと局所帯状の疎なAttentionが交互に現れる。ブロック内部の図は共通の接続を示し、疎な参照パターンの具体的な幅は示さない。
        </p>
      </div>
    </DemoFrame>
  );
}
