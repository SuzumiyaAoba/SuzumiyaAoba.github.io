"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVGに図の役割と代替説明を与える。HTMLのimgでは操作に応じたベクトル図を表せない。 */

import { useId, useState } from "react";
import { Button } from "@/shared/ui/button";
import { DemoFrame } from "./visual-frame";

type Branch = "attention" | "mlp";

const BRANCH_DETAILS = {
  attention: {
    equation: "u = h + Attention(LN₁(h))",
    summary:
      "正規化した表現から位置間の情報を集約する。出力を元のhに加えるため、Attentionの最終出力はhと同じ次元数になる。",
    shapes: [
      ["LN₁の出力", "n × 12,288"],
      ["1ヘッドのQ・K・V", "それぞれ n × 128"],
      ["1ヘッドのスコア", "n × n（denseの場合）"],
      ["96ヘッドの連結", "n × (96 × 128) = n × 12,288"],
      ["出力射影・残差加算", "n × 12,288"],
    ],
  },
  mlp: {
    equation: "h′ = u + MLP(LN₂(u))",
    summary:
      "各位置の表現を独立に変換する。中間表現だけを4倍の次元数にし、最後に元の次元数へ戻してからuに加える。",
    shapes: [
      ["LN₂の出力", "n × 12,288"],
      ["最初の線形変換", "n × 49,152"],
      ["GELUの出力", "n × 49,152"],
      ["二つ目の線形変換", "n × 12,288"],
      ["残差加算", "n × 12,288"],
    ],
  },
} as const;

function BranchDiagram({ branch }: { branch: Branch }) {
  const id = useId();
  const attentionClass =
    branch === "attention" ? "fill-chart-1/15" : "fill-muted";
  const mlpClass = branch === "mlp" ? "fill-chart-2/15" : "fill-muted";

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        viewBox="0 0 720 370"
        className="h-auto w-full min-w-xl"
      >
        <title id={`${id}-title`}>Pre-LNブロックの残差経路と変換経路</title>
        <desc id={`${id}-description`}>
          hはそのまま残差経路を通る。別の経路でLN1とAttentionを適用し、hに加えてuを得る。
          uにもLN2とMLPを適用し、uに加えて次のブロックへの入力h′を得る。
          各加算の入力と出力は、いずれもn行12,288列である。
        </desc>
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
        </defs>
        <g
          className="stroke-muted-foreground"
          fill="none"
          strokeWidth="1.5"
          markerEnd={`url(#${id}-arrow)`}
        >
          <path d="M 80 65 V 115" />
          <path d="M 80 145 V 160" />
          <path d="M 142 40 H 220" />
          <path d="M 320 40 H 400" />
          <path d="M 620 40 H 670 V 130 H 95" />
          <path d="M 80 210 V 260" />
          <path d="M 80 290 V 305" />
          <path d="M 142 185 H 220" />
          <path d="M 320 185 H 400" />
          <path d="M 620 185 H 670 V 275 H 95" />
        </g>
        <g className="stroke-border" strokeWidth="1">
          <rect x="18" y="15" width="124" height="50" className="fill-muted" />
          <rect
            x="220"
            y="15"
            width="100"
            height="50"
            className={attentionClass}
          />
          <rect
            x="400"
            y="15"
            width="220"
            height="50"
            className={attentionClass}
          />
          <rect x="18" y="160" width="124" height="50" className="fill-muted" />
          <rect x="220" y="160" width="100" height="50" className={mlpClass} />
          <rect x="400" y="160" width="220" height="50" className={mlpClass} />
          <rect x="18" y="305" width="124" height="50" className="fill-muted" />
          <circle cx="80" cy="130" r="15" className="fill-background" />
          <circle cx="80" cy="275" r="15" className="fill-background" />
        </g>
        <g className="fill-foreground text-sm" textAnchor="middle">
          <text x="80" y="37">
            h
          </text>
          <text x="80" y="55" className="text-xs">
            n × 12,288
          </text>
          <text x="270" y="45">
            LN₁
          </text>
          <text x="510" y="36">
            Attention ＋ 出力射影
          </text>
          <text x="510" y="55" className="text-xs">
            n × 12,288 に戻す
          </text>
          <text x="80" y="135">
            ＋
          </text>
          <text x="80" y="182">
            u
          </text>
          <text x="80" y="201" className="text-xs">
            n × 12,288
          </text>
          <text x="270" y="190">
            LN₂
          </text>
          <text x="510" y="181">
            MLP
          </text>
          <text x="510" y="200" className="text-xs">
            12,288 → 49,152 → 12,288
          </text>
          <text x="80" y="280">
            ＋
          </text>
          <text x="80" y="327">
            h′
          </text>
          <text x="80" y="346" className="text-xs">
            n × 12,288
          </text>
          <text x="230" y="102" className="fill-muted-foreground text-xs">
            hを直接加える
          </text>
          <text x="230" y="248" className="fill-muted-foreground text-xs">
            uを直接加える
          </text>
          <text x="335" y="337" className="fill-muted-foreground">
            次のブロックへ（全96層）
          </text>
        </g>
      </svg>
    </div>
  );
}

export function LlmBlockDemo() {
  const [branch, setBranch] = useState<Branch>("attention");
  const detail = BRANCH_DETAILS[branch];

  return (
    <DemoFrame
      title="残差接続を含む1ブロックの計算経路"
      description="GPT-2型のPre-LN構成にGPT-3 175Bの寸法を当てはめた図である。nはトークン数を表す。選択した経路の次元数を下表で確認できる。"
      label="Transformerブロックと残差接続の可視化"
    >
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">確認する計算経路</legend>
        <Button
          type="button"
          variant={branch === "attention" ? "default" : "outline"}
          aria-pressed={branch === "attention"}
          onClick={() => setBranch("attention")}
        >
          Attentionの経路
        </Button>
        <Button
          type="button"
          variant={branch === "mlp" ? "default" : "outline"}
          aria-pressed={branch === "mlp"}
          onClick={() => setBranch("mlp")}
        >
          MLPの経路
        </Button>
      </fieldset>
      <BranchDiagram branch={branch} />
      <div className="space-y-2" aria-live="polite" aria-atomic="true">
        <p className="font-mono font-medium">{detail.equation}</p>
        <p className="leading-relaxed">{detail.summary}</p>
      </div>
      <table className="w-full text-left tabular-nums">
        <caption className="sr-only">選択した経路の行列の形状</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 pr-4 font-medium">
              段階
            </th>
            <th scope="col" className="py-2 font-medium">
              形状（行 × 列）
            </th>
          </tr>
        </thead>
        <tbody>
          {detail.shapes.map(([name, shape]) => (
            <tr key={name} className="border-b">
              <th scope="row" className="py-2 pr-4 font-normal">
                {name}
              </th>
              <td className="py-2">{shape}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-muted-foreground">
        図は計算順序と形状を示し、学習済みモデルの活性値は示さない。
        GPT-3のsparse層ではAttentionの参照先が制限されるが、残差接続へ戻す次元数は変わらない。
      </p>
    </DemoFrame>
  );
}
