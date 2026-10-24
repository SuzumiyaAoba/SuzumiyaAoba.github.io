export const GENERATION_STAGES = [
  { id: "input", label: "入力ID", formula: "文字列 → トークンID列" },
  { id: "embedding", label: "埋め込み", formula: "h⁰ₜ = e(xₜ) + pₜ" },
  {
    id: "attention",
    label: "Attention",
    formula: "LN₁ → Q・K・V → softmax(QKᵀ/√2) V → Wₒ",
  },
  {
    id: "attention-add",
    label: "残差①",
    formula: "uₜ = h⁰ₜ + Attention(LN₁(H⁰))ₜ",
  },
  { id: "mlp", label: "MLP", formula: "LN₂ → 4成分 → 16成分 → GELU → 4成分" },
  { id: "mlp-add", label: "残差②", formula: "h′ₜ = uₜ + MLP(LN₂(uₜ))" },
  {
    id: "output",
    label: "語彙のスコア",
    formula: "最後の位置のLNfinal(h′) → E → 8個のlogit",
  },
  {
    id: "probabilities",
    label: "確率",
    formula: "pᵢ = exp(logitᵢ/T) / Σⱼ exp(logitⱼ/T)",
  },
  {
    id: "selection",
    label: "IDの選択",
    formula: "抽選値 r ∈ [0, 1) → 累積確率の区間 → ID",
  },
  {
    id: "decode",
    label: "文字列へ復元",
    formula: "選択ID → 語彙のトークン → デコード → 入力ID列に追加",
  },
] as const;

export type GenerationStage = (typeof GENERATION_STAGES)[number]["id"];
