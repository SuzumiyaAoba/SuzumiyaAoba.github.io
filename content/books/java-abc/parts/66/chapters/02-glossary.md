---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Observer | Observer | 状態変化を購読者へ通知する振る舞いパターン |
| Subject / Publisher | Subject / Publisher | 通知元となるオブジェクト |
| Observer / Subscriber | Observer / Subscriber | 通知を受け取る側 |
| Push 型 / Pull 型 | Push / Pull | 通知時に値を渡すか、購読側が取りに行くかの方式 |
| `Flow` API | Flow API | Java 9 以降の Reactive Streams 規格準拠の Observer 系 API |
| バックプレッシャ | Backpressure | 受け手の処理能力を超える通知量を抑える仕組み |

---

## この章で学んだこと

- **Observer** は変化を購読者に通知するパターン
- ラムダで軽く書け、Java 標準では `Flow` API が現代版
- バックプレッシャとリスナー解除の注意点

次は **第67章: Command パターン** ―― 操作をオブジェクト化する振る舞いパターンです。
