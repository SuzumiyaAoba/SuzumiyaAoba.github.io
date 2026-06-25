---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Factory Method | Factory Method | 生成する型をサブクラス（または実装側）に委ねる生成パターン |
| Creator / Product | Creator / Product | Factory Method における「作る側」と「作られる側」の登場人物 |
| `static` ファクトリメソッド | Static Factory Method | `new` の代わりに使う、名前付きの `static` 生成メソッド（例: `List.of`） |
| コンストラクタ参照 | Constructor Reference | `ClassName::new` 形式で書く、コンストラクタを指すメソッド参照 |
| `Function<T, R>` | Function | T を受け取って R を返す、標準の関数型インターフェース |
| パターン病 | Pattern Disease | 必要のない場面にも無理にパターンを当てはめてしまう設計の悪癖 |

---

## この章で学んだこと

- 生成の責任を **`new` 呼び出し側から引き離す**のが Factory Method
- 「**いつ何が返るか**」を、サブクラスやラムダで切り替える
- 標準ライブラリでよく見る `static` ファクトリメソッドは、よく似ているが別物
- 現代の Java では、**メソッド参照**で軽く書けることが多い

次は **第53章: Abstract Factory パターン** ―― 「**製品の家族**」をまとめて作るパターンです。
