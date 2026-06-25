---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

第51章で登場した、新しい言葉をまとめます。

| 用語 | 英語 | 意味 |
|---|---|---|
| Singleton | Singleton | アプリ全体でインスタンスを 1 つだけにする生成パターン |
| プライベートコンストラクタ | Private Constructor | `private` 修飾子付きのコンストラクタ。外部から `new` できなくする |
| `getInstance` | Get Instance | Singleton の唯一のインスタンスを返す慣習的な静的メソッド名 |
| 三重チェックロック | Double-Checked Locking (DCL) | `synchronized` を最小限にしたスレッドセーフな Singleton イディオム |
| `volatile` | Volatile | 変数の更新が他スレッドからただちに見えることを保証する修飾子（第43章） |
| 初期化オンデマンドホルダ | Initialization-on-Demand Holder | 内部 `static` クラスのロード遅延を利用したスレッドセーフな Singleton |
| `enum` Singleton | Enum Singleton | 値が 1 つだけの `enum` で書く、リフレクション・シリアライズに耐える Singleton |
| アンチパターン | Anti-pattern | 一見正しそうだが、結果的に保守性を下げてしまう設計のこと |
| DI コンテナ | DI Container | オブジェクトの生成と依存関係を一元管理する仕組み。Spring など（第36章） |
| シングルトンスコープ | Singleton Scope | DI コンテナで「アプリ内に 1 つだけ」と指定するライフサイクル |

---

## この章で学んだこと

- **Singleton** は、インスタンスを 1 つに限定するための生成パターン
- 古典的な実装はスレッド安全性・リフレクション・シリアライズに弱い
- 現代の Java では `enum` Singleton か、DI コンテナに任せるのが定石
- 「**そもそも Singleton にする必要があるか**」を、まず疑う姿勢が大切

次は **第52章: Factory Method パターン** ――「**作る責任**」を別のオブジェクトに委ねるパターンです。
