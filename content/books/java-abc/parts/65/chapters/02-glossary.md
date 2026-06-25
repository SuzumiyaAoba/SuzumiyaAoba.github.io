---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Template Method | Template Method | 流れを親、ステップの実装を子に任せる振る舞いパターン |
| テンプレートメソッド | Template Method (method) | 親に置く、流れを定義した `final` メソッド |
| 抽象メソッド | Abstract Method | 子クラスで必ず実装すべきメソッド |
| フックメソッド | Hook Method | デフォルト実装があり、必要時のみ子が上書きするメソッド |
| 脆い基底クラス問題 | Fragile Base Class Problem | 親の変更が子に予期せぬ影響を与える継承の弱点 |

---

## この章で学んだこと

- **Template Method** は、流れを再利用しつつステップを変えるパターン
- 抽象メソッドとフックメソッドの使い分けがある
- Strategy はアルゴリズム全体、Template Method はステップ単位の差し替え

次は **第66章: Observer パターン** ―― 変化を購読する振る舞いパターンです。
