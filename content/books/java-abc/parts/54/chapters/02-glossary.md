---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Builder | Builder | 多くのパラメータを持つオブジェクトを段階的に組み立てる生成パターン |
| Fluent Builder | Fluent Builder | メソッドチェーンで属性を積み上げる、流れるような API のスタイル |
| テレスコープコンストラクタ | Telescoping Constructor | 引数が異なるコンストラクタを次々に重ねる、読みづらい設計 |
| `@Builder` | Lombok Builder | Builder クラスを自動生成する Lombok のアノテーション |

---

## この章で学んだこと

- **Builder** はパラメータが多いオブジェクトの構築を、**読みやすく**するためのパターン
- 不変オブジェクトを安全に作るのに向く
- レコード・Lombok との使い分けがポイント

次は **第55章: Prototype パターン** ―― 既存のインスタンスをコピーして新しいものを作るパターンです。
