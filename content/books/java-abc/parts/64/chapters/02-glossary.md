---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Strategy | Strategy | 取り替え可能なアルゴリズムとして振る舞いを外に出す振る舞いパターン |
| Context | Context | Strategy を持つ呼び出し側のクラス |
| `Comparator<T>` | Comparator | 順序を決める標準の関数型インターフェース。Strategy の好例 |
| State パターン | State Pattern | 状態によって振る舞いを変える別の振る舞いパターン |

---

## この章で学んだこと

- **Strategy** はアルゴリズムを切り替えるパターン
- 現代の Java ではラムダ・標準関数型インターフェースで軽く書ける
- State パターンとの違いは「**外から渡す vs 内側で持つ**」

次は **第65章: Template Method パターン** ―― 処理の骨組みを親に置く振る舞いパターンです。
