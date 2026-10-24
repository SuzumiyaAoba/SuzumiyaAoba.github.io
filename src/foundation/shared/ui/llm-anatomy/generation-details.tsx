import type { ReactNode } from "react";
import type { GenerationSelection, GenerationTrace } from "./generation-math";
import { decodeFlow, FLOW_VOCABULARY, FLOW_WEIGHTS } from "./generation-math";
import type { GenerationStage } from "./generation-stages";
import { svgNumber } from "./svg-number";

type GenerationDetailsProps = {
  trace: GenerationTrace;
  stage: GenerationStage;
  position: number;
  headIndex: number;
  selection: GenerationSelection;
  draw: number;
};

function numberText(value: number): string {
  if (!Number.isFinite(value)) {
    return value < 0 ? "−∞" : "∞";
  }
  const text = value.toFixed(3);
  return text === "-0.000" ? "0.000" : text;
}

function vectorText(values: readonly number[]): string {
  return `[${values.map(numberText).join(", ")}]`;
}

function tokenPiece(id: number): string {
  return FLOW_VOCABULARY.find((token) => token.id === id)?.piece ?? "";
}

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <p className="font-semibold">{title}</p>
      {children}
      <p className="text-xs leading-relaxed text-muted-foreground">
        この図の数値は固定した説明用モデルの計算結果である。表示は小数第3位に丸め、計算には丸める前の値を使う。
      </p>
    </div>
  );
}

function Vector({
  label,
  values,
}: {
  label: string;
  values: readonly number[];
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        {values.map((value, index) => (
          <span
            key={`${label}-${index}`}
            className="rounded border border-border bg-muted px-2 py-1 text-right font-mono text-xs tabular-nums"
          >
            <span className="mr-2 text-muted-foreground">c{index + 1}</span>
            {numberText(value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function LinearCalculation({
  label,
  input,
  row,
  bias,
  result,
}: {
  label: string;
  input: readonly number[];
  row: readonly number[];
  bias?: number;
  result: number;
}) {
  return (
    <div className="space-y-1 rounded border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-xs leading-relaxed">
        {row
          .map(
            (weight, index) =>
              `(${numberText(weight)} × ${numberText(input[index] ?? 0)})`
          )
          .join(" + ")}
        {bias === undefined ? "" : ` + (${numberText(bias)})`}
        {" = "}
        <strong>{numberText(result)}</strong>
      </p>
    </div>
  );
}

function ComponentAddition({
  left,
  right,
  result,
  labels,
}: {
  left: readonly number[];
  right: readonly number[];
  result: readonly number[];
  labels: readonly [string, string, string];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-xs tabular-nums">
        <caption className="sr-only">各成分の加算とその結果</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="p-2 text-left font-medium">
              成分
            </th>
            {labels.map((label) => (
              <th key={label} scope="col" className="p-2 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.map((value, index) => (
            <tr key={index} className="border-b">
              <th scope="row" className="p-2 text-left font-normal">
                c{index + 1}
              </th>
              <td className="p-2">{numberText(left[index] ?? 0)}</td>
              <td className="p-2">+ {numberText(right[index] ?? 0)}</td>
              <td className="p-2 font-semibold">= {numberText(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InputDetails({ trace }: { trace: GenerationTrace }) {
  return (
    <DetailPanel title="文字片とIDを対応づけて、モデルの入力列を作る">
      <p className="leading-relaxed">
        この例の語彙は8個である。下のID列を入力し、各位置に4成分の表現を割り当てる。
        実際のトークナイザーでは単語とトークンが一対一になるとは限らない。
      </p>
      <ol className="flex flex-wrap gap-2">
        {trace.ids.map((id, index) => (
          <li key={index} className="rounded border border-border px-3 py-2">
            <span className="block text-xs text-muted-foreground">
              位置 {index + 1}
            </span>
            <span className="font-mono">
              {tokenPiece(id)} → ID {id}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs leading-relaxed text-muted-foreground">
        語彙：
        {FLOW_VOCABULARY.map(({ id, piece }) => `${id}：${piece}`).join(" / ")}
        。ID 7は文字片を追加せずに生成を終了する特殊トークンである。
      </p>
    </DetailPanel>
  );
}

function EmbeddingDetails({
  trace,
  position,
}: {
  trace: GenerationTrace;
  position: number;
}) {
  const id = trace.ids[position] ?? 0;
  return (
    <DetailPanel
      title={`位置 ${position + 1}：ID ${id}「${tokenPiece(id)}」から表現を作る`}
    >
      <p className="leading-relaxed">
        IDで埋め込み表の行を選び、位置で位置埋め込み表の行を選ぶ。
        両者を成分ごとに足した h₀ が、この位置からブロックへ流れるデータになる。
      </p>
      <p className="font-mono text-xs">h₀ = e[ID] + p[位置]</p>
      <ComponentAddition
        left={trace.e[position] ?? []}
        right={trace.p[position] ?? []}
        result={trace.input[position] ?? []}
        labels={["e[ID]", "p[位置]", "h₀"]}
      />
    </DetailPanel>
  );
}

function AttentionDetails({
  trace,
  position,
  headIndex,
}: {
  trace: GenerationTrace;
  position: number;
  headIndex: number;
}) {
  const head = trace.heads[headIndex];
  if (!head) {
    return null;
  }
  const statistics = trace.ln1Statistics[position];
  return (
    <DetailPanel
      title={`位置 ${position + 1}・head ${headIndex + 1}：過去の位置から情報を集める`}
    >
      <p className="leading-relaxed">
        まず各位置の4成分をLayerNormで正規化し、異なる固定行列でQ・K・Vに写す。
        選んだ位置のQを各位置のKと照合し、得られた重みでVを混ぜる。各headは2成分を扱う。
      </p>
      <Vector
        label="h₀ → LN₁の入力（4成分）"
        values={trace.input[position] ?? []}
      />
      <Vector label="LN₁の出力（4成分）" values={trace.ln1[position] ?? []} />
      {statistics ? (
        <p className="font-mono text-xs leading-relaxed text-muted-foreground">
          μ = {numberText(statistics.mean)}、分散 ={" "}
          {numberText(statistics.variance)}、 √(分散 + ε) ={" "}
          {numberText(statistics.denominator)}。 LN(x) = γ ⊙ (x − μ) / √(分散 +
          ε) + β。
        </p>
      ) : null}
      <Vector
        label="この位置のQ = Wq LN₁(h₀)（2成分）"
        values={head.queries[position] ?? []}
      />
      <LinearCalculation
        label="Qの成分1：Wqの1行目とLN₁の出力の内積"
        input={trace.ln1[position] ?? []}
        row={FLOW_WEIGHTS.heads[headIndex]?.query[0] ?? []}
        result={head.queries[position]?.[0] ?? 0}
      />
      <p className="font-mono text-xs leading-relaxed">
        sⱼ = Q · Kⱼ / √2 → 未来の位置を −∞ にする → α = softmax(s) → Σⱼ αⱼVⱼ
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs tabular-nums">
          <caption className="sr-only">
            選んだ位置から各位置へのAttentionスコア、重み、Vの寄与
          </caption>
          <thead>
            <tr className="border-b">
              {["参照先", "Kⱼ", "スコア → mask後", "重み αⱼ", "Vⱼ", "αⱼVⱼ"].map(
                (label) => (
                  <th
                    key={label}
                    scope="col"
                    className="p-2 font-medium whitespace-nowrap"
                  >
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {trace.ids.map((id, source) => (
              <tr
                key={source}
                className={
                  source > position
                    ? "border-b text-muted-foreground"
                    : "border-b"
                }
              >
                <th
                  scope="row"
                  className="p-2 text-left font-normal whitespace-nowrap"
                >
                  {source + 1}：{tokenPiece(id)}
                  {source > position ? "（未来）" : ""}
                </th>
                <td className="p-2 whitespace-nowrap">
                  {vectorText(head.keys[source] ?? [])}
                </td>
                <td className="p-2 whitespace-nowrap">
                  {numberText(head.rawScores[position]?.[source] ?? 0)} →{" "}
                  {numberText(head.scores[position]?.[source] ?? 0)}
                </td>
                <td className="p-2">
                  {numberText(head.weights[position]?.[source] ?? 0)}
                </td>
                <td className="p-2 whitespace-nowrap">
                  {vectorText(head.values[source] ?? [])}
                </td>
                <td className="p-2 whitespace-nowrap">
                  {vectorText(head.contributions[position]?.[source] ?? [])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Vector
        label="このheadの出力 = 上表のαⱼVⱼの合計（2成分）"
        values={head.outputs[position] ?? []}
      />
      <Vector
        label="2 headの出力を連結（4成分）"
        values={trace.concatenated[position] ?? []}
      />
      <Vector
        label="Woで写したAttentionの出力 a（4成分）"
        values={trace.attention[position] ?? []}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        未来の位置は重み0で寄与しない。入力列の途中を選ぶと、計算済みの未来側のK・Vも参照対象から外れていることを確認できる。
      </p>
    </DetailPanel>
  );
}

function ResidualDetails({
  trace,
  position,
  stage,
}: {
  trace: GenerationTrace;
  position: number;
  stage: "attention-add" | "mlp-add";
}) {
  const attention = stage === "attention-add";
  return (
    <DetailPanel
      title={`位置 ${position + 1}：${attention ? "Attention" : "MLP"}の出力を残差経路に足す`}
    >
      <p className="leading-relaxed">
        {attention
          ? "入力の h₀ は残差経路を通ってそのまま加算点へ届く。Attentionの出力 a を同じ位置・同じ成分に足して、u を作る。"
          : "Attentionの加算後の u は、MLPを通らない経路でも次の加算点へ届く。MLPの出力 m を同じ位置・同じ成分に足して、ブロックの出力 h′ を作る。"}
      </p>
      <p className="font-mono text-xs">
        {attention ? "u = h₀ + a" : "h′ = u + m"}
      </p>
      <ComponentAddition
        left={(attention ? trace.input : trace.afterAttention)[position] ?? []}
        right={(attention ? trace.attention : trace.mlpOutput)[position] ?? []}
        result={
          (attention ? trace.afterAttention : trace.afterMlp)[position] ?? []
        }
        labels={attention ? ["h₀", "a", "u"] : ["u", "m", "h′"]}
      />
    </DetailPanel>
  );
}

function MlpDetails({
  trace,
  position,
}: {
  trace: GenerationTrace;
  position: number;
}) {
  return (
    <DetailPanel
      title={`位置 ${position + 1}：同じ位置の表現を4 → 16 → 4成分に変換する`}
    >
      <p className="leading-relaxed">
        u をLayerNormで正規化し、1つ目の線形変換で16成分へ広げる。
        GELUを各成分に適用し、2つ目の線形変換で4成分へ戻す。
        この段階で別の位置との情報交換は行わない。各位置に同じ重みを使う。
      </p>
      <p className="font-mono text-xs">
        x = LN₂(u) → z = W₁x + b₁ → g = GELU(z) → m = W₂g + b₂
      </p>
      <Vector
        label="LN₂の入力 u（4成分）"
        values={trace.afterAttention[position] ?? []}
      />
      <Vector label="LN₂の出力 x（4成分）" values={trace.ln2[position] ?? []} />
      <Vector
        label="1つ目の線形変換 z（16成分）"
        values={trace.mlpPre[position] ?? []}
      />
      <LinearCalculation
        label="zの成分1：W₁の1行目との内積 + バイアス"
        input={trace.ln2[position] ?? []}
        row={FLOW_WEIGHTS.mlp.first[0] ?? []}
        bias={FLOW_WEIGHTS.mlp.firstBias[0] ?? 0}
        result={trace.mlpPre[position]?.[0] ?? 0}
      />
      <Vector
        label="各成分にGELUを適用した g（16成分）"
        values={trace.mlpActivated[position] ?? []}
      />
      <p className="font-mono text-xs leading-relaxed">
        g₁ = GELU({numberText(trace.mlpPre[position]?.[0] ?? 0)}) ={" "}
        {numberText(trace.mlpActivated[position]?.[0] ?? 0)}
        （ここではtanhによるGELUの近似式を使う）。
      </p>
      <Vector
        label="2つ目の線形変換 m（4成分）"
        values={trace.mlpOutput[position] ?? []}
      />
      <details className="rounded border border-border p-3">
        <summary className="cursor-pointer font-medium">
          mの成分1を16成分から計算する内訳
        </summary>
        <div className="pt-3">
          <LinearCalculation
            label="W₂の1行目との内積 + バイアス"
            input={trace.mlpActivated[position] ?? []}
            row={FLOW_WEIGHTS.mlp.second[0] ?? []}
            bias={FLOW_WEIGHTS.mlp.secondBias[0] ?? 0}
            result={trace.mlpOutput[position]?.[0] ?? 0}
          />
        </div>
      </details>
    </DetailPanel>
  );
}

function ProbabilityBar({ probability }: { probability: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 8" className="h-2 w-full">
      <rect width="100" height="8" rx="2" className="fill-muted" />
      <rect
        width={svgNumber(probability * 100)}
        height="8"
        rx="2"
        className="fill-primary"
      />
    </svg>
  );
}

function VocabularyTable({
  trace,
  kind,
}: {
  trace: GenerationTrace;
  kind: "logits" | "probabilities";
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-xs tabular-nums">
        <caption className="sr-only">
          各語彙IDのlogit{kind === "probabilities" ? "と確率" : ""}
        </caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="p-2 text-left font-medium">
              ID・文字片
            </th>
            <th scope="col" className="p-2 font-medium">
              logit z
            </th>
            {kind === "probabilities" ? (
              <th scope="col" className="p-2 font-medium">
                z / T
              </th>
            ) : null}
            {kind === "probabilities" ? (
              <th scope="col" className="p-2 font-medium">
                確率
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {FLOW_VOCABULARY.map(({ id, piece }) => (
            <tr key={id} className="border-b">
              <th
                scope="row"
                className="p-2 text-left font-normal whitespace-nowrap"
              >
                {id}：{piece}
              </th>
              <td className="p-2">{numberText(trace.logits[id] ?? 0)}</td>
              {kind === "probabilities" ? (
                <td className="p-2">
                  {numberText((trace.logits[id] ?? 0) / trace.temperature)}
                </td>
              ) : null}
              {kind === "probabilities" ? (
                <td className="w-1/3 space-y-1 p-2">
                  <span>
                    {((trace.probabilities[id] ?? 0) * 100).toFixed(2)}%
                  </span>
                  <ProbabilityBar probability={trace.probabilities[id] ?? 0} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OutputDetails({
  trace,
  selection,
}: {
  trace: GenerationTrace;
  selection: GenerationSelection;
}) {
  const last = trace.ids.length - 1;
  return (
    <DetailPanel
      title={`末尾の位置 ${last + 1}：4成分の表現から語彙ごとのlogitへ写す`}
    >
      <p className="leading-relaxed">
        この例ではブロックは1個である。その出力を最終LayerNormで正規化し、
        末尾の位置の表現を取り出す。出力行列の各行との内積を計算すると、8個の語彙IDにそれぞれ1個のlogitが得られる。
      </p>
      <Vector
        label="最終LayerNormの入力 h′（末尾の4成分）"
        values={trace.afterMlp[last] ?? []}
      />
      <Vector
        label="最終LayerNormの出力（末尾の4成分）"
        values={trace.lastHidden}
      />
      <p className="font-mono text-xs">zᵢ = W出力[i] · LN最終(h′末尾)</p>
      <LinearCalculation
        label={`ID ${selection.id}「${selection.piece}」のlogit：出力行列の${selection.id + 1}行目との内積`}
        input={trace.lastHidden}
        row={FLOW_WEIGHTS.lmHead[selection.id] ?? []}
        result={trace.logits[selection.id] ?? 0}
      />
      <VocabularyTable trace={trace} kind="logits" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        logit自体は確率ではない。ここで予測するのは、入力列の末尾に続く1個のトークンである。
        この例の出力行列は、入力の埋め込み表と重みを共有している。
      </p>
    </DetailPanel>
  );
}

function ProbabilitiesDetails({ trace }: { trace: GenerationTrace }) {
  return (
    <DetailPanel title="語彙全体のlogitを、合計1の確率分布に変える">
      <p className="leading-relaxed">
        温度 T = {trace.temperature.toFixed(1)}{" "}
        でlogitを割り、softmaxを適用する。
        温度が低いほど大きなlogitの候補に確率が集中する。この例ではtop-k・top-pによる候補制限を行わない。
      </p>
      <p className="font-mono text-xs">P(ID=i) = exp(zᵢ/T) / Σⱼ exp(zⱼ/T)</p>
      <VocabularyTable trace={trace} kind="probabilities" />
    </DetailPanel>
  );
}

function SelectionDetails({
  selection,
  draw,
}: {
  selection: GenerationSelection;
  draw: number;
}) {
  return (
    <DetailPanel title="確率に比例する区間から、次のIDを1個選ぶ">
      <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
        <li>語彙IDの順に確率を足し、0以上1未満を区切る。</li>
        <li>
          0以上1未満の一様乱数 r = <strong>{draw.toFixed(3)}</strong>{" "}
          を用意する。
        </li>
        <li>
          r が入る区間 [{selection.intervalStart.toFixed(4)},{" "}
          {selection.intervalEnd.toFixed(4)}) に対応する
          <strong> ID {selection.id}</strong> を選ぶ。この区間の長さは確率{" "}
          {(selection.probability * 100).toFixed(2)}% と等しい。
        </li>
      </ol>
      <svg aria-hidden="true" viewBox="0 0 400 44" className="h-auto w-full">
        <rect
          x="20"
          y="8"
          width="360"
          height="16"
          rx="2"
          className="fill-muted"
        />
        <rect
          x={svgNumber(20 + selection.intervalStart * 360)}
          y="8"
          width={svgNumber(selection.probability * 360)}
          height="16"
          className="fill-primary"
        />
        <line
          x1={svgNumber(20 + draw * 360)}
          x2={svgNumber(20 + draw * 360)}
          y1="3"
          y2="29"
          strokeWidth="2"
          className="stroke-foreground"
        />
        <text x="20" y="42" className="fill-foreground text-xs">
          0
        </text>
        <text
          x="380"
          y="42"
          textAnchor="end"
          className="fill-foreground text-xs"
        >
          1
        </text>
      </svg>
      <output className="block font-semibold">
        確定したID：{selection.id}
      </output>
      <p className="text-xs leading-relaxed text-muted-foreground">
        確率最大のIDを必ず選ぶ操作とは異なる。乱数を動かすと、同じ確率分布から別のIDも選ばれる。
      </p>
    </DetailPanel>
  );
}

function DecodeDetails({
  trace,
  selection,
}: {
  trace: GenerationTrace;
  selection: GenerationSelection;
}) {
  const before = decodeFlow(trace.ids);
  return (
    <DetailPanel title="確定したIDを語彙表で引き、文字片を復元する">
      <p className="leading-relaxed">
        <strong>ID {selection.id}</strong> → 語彙表の文字片「
        <strong>{selection.piece}</strong>」
        {selection.isEnd
          ? " → 終了トークンなので生成を停止する。"
          : " → 文字列に追加する。"}
      </p>
      <div className="space-y-2 rounded-lg bg-muted p-3">
        <p className="text-xs text-muted-foreground">
          この説明用語彙で復元した文字列
        </p>
        <output className="block text-lg">
          {before}
          {selection.isEnd ? null : (
            <strong className="text-primary">{selection.piece}</strong>
          )}
        </output>
      </div>
      <p className="leading-relaxed">
        {selection.isEnd
          ? "終了トークンは、本文に「〈終了〉」という文字列を追加するためのIDではない。"
          : `次の生成では、文字列をもう一度推測するのではなく、選んだID ${selection.id} を入力ID列の末尾に追加する。その新しい列で次の1個を予測する。`}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        この例は1
        IDに1文字片を対応させている。実際のトークナイザーでは、複数IDが表すバイト列をまとめてデコードする場合もある。
      </p>
    </DetailPanel>
  );
}

/** 主図で選んだ1段階について、同じ計算結果の入力・演算・出力を対応させる。 */
export function GenerationDetails({
  trace,
  stage,
  position,
  headIndex,
  selection,
  draw,
}: GenerationDetailsProps) {
  switch (stage) {
    case "input": {
      return <InputDetails trace={trace} />;
    }
    case "embedding": {
      return <EmbeddingDetails trace={trace} position={position} />;
    }
    case "attention": {
      return (
        <AttentionDetails
          trace={trace}
          position={position}
          headIndex={headIndex}
        />
      );
    }
    case "attention-add":
    case "mlp-add": {
      return (
        <ResidualDetails trace={trace} position={position} stage={stage} />
      );
    }
    case "mlp": {
      return <MlpDetails trace={trace} position={position} />;
    }
    case "output": {
      return <OutputDetails trace={trace} selection={selection} />;
    }
    case "probabilities": {
      return <ProbabilitiesDetails trace={trace} />;
    }
    case "selection": {
      return <SelectionDetails selection={selection} draw={draw} />;
    }
    case "decode": {
      return <DecodeDetails trace={trace} selection={selection} />;
    }
    default: {
      return null;
    }
  }
}
