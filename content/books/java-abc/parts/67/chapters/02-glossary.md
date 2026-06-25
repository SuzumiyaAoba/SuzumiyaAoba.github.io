---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Command | Command | 操作をオブジェクト化する振る舞いパターン |
| Receiver | Receiver | Command が実際に呼び出す対象オブジェクト |
| Invoker | Invoker | Command を受け取り実行・履歴管理を行うオブジェクト |
| Undo / Redo | Undo / Redo | 操作の取り消し・再実行 |
| イベントソーシング | Event Sourcing | 起きたコマンド（イベント）の連鎖を真実として扱う設計 |
| `Runnable` | Runnable | 引数も戻り値もない関数型インターフェース。軽い Command として使える |

---

## この章で学んだこと

- **Command** は、操作そのものを名詞化する
- 履歴・Undo・キュー実行・イベントソーシングなど用途が広い
- 単純な実装は `Runnable` + ラムダで十分

次は **第68章: State パターン** ―― 状態によって振る舞いを変える振る舞いパターンです。
