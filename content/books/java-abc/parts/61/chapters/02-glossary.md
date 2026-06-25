---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Bridge | Bridge | 抽象階層と実装階層を独立に拡張できるよう切り離す構造パターン |
| 抽象階層 | Abstraction Hierarchy | API として見える側の階層（例: Shape） |
| 実装階層 | Implementor Hierarchy | プラットフォーム・技術寄りの階層（例: Renderer） |
| 委譲 | Delegation | 内部のオブジェクトに処理を任せる手法 |

---

## この章で学んだこと

- **Bridge** は、2 つの軸の変化を独立にする構造パターン
- 継承の爆発を、委譲で加算に直す
- Adapter（事後接続）・Strategy（小さな差し替え）と区別する

次は **第62章: Flyweight パターン** ―― 状態を共有してオブジェクト数を減らす構造パターンです。
