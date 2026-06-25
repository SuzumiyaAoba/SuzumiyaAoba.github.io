---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Proxy | Proxy | 本物と同じインターフェースで間に立つ代理オブジェクト |
| 仮想 Proxy | Virtual Proxy | 本物の生成・ロードを遅らせる Proxy |
| 保護 Proxy | Protection Proxy | アクセス制御をかける Proxy |
| 遠隔 Proxy | Remote Proxy | リモート呼び出しを隠蔽する Proxy |
| スマート Proxy | Smart Proxy | 計測・ログなど付加処理を差し込む Proxy |
| 動的プロキシ | Dynamic Proxy | `java.lang.reflect.Proxy` で実行時に作るプロキシ |
| `InvocationHandler` | Invocation Handler | 動的プロキシのメソッド呼び出しを受けるインターフェース |
| AOP | Aspect Oriented Programming | 横断的関心ごとを Proxy で差し込む手法 |

---

## この章で学んだこと

- **Proxy** は、本物の代わりに立つ代理人
- 用途は仮想・保護・遠隔・スマートの 4 つに分類できる
- Java の動的プロキシ・Spring AOP が代表的な実装基盤
- Decorator との違いは「目的」（機能追加 vs 介在）

次は **第60章: Composite パターン** ―― 木構造を一様に扱う構造パターンです。
