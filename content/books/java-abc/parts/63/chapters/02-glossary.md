---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Iterator | Iterator | コレクションの内部を見せずに要素を順に取り出す振る舞いパターン |
| `Iterable` | Iterable | `iterator()` を持つ、for-each で回せるための標準インターフェース |
| `hasNext` / `next` | hasNext / next | Iterator の 2 つの基本操作 |
| Spliterator | Spliterator | 分割可能な Iterator。Stream API の並列処理の基盤 |

---

## この章で学んだこと

- **Iterator** は、構造を隠して順に取り出すパターン
- Java の for-each は Iterator パターンを言語に組み込んだ姿
- Stream は併用すべきデータ加工パイプライン

次は **第64章: Strategy パターン** ―― アルゴリズムを差し替える振る舞いパターンです。
