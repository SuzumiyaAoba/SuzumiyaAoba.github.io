---
title: はじめに ― この章で学ぶこと
llm: true
co-author: ["Claude Opus 4.7"]
---

## はじめに ― この章で学ぶこと

オブジェクトの**フィールドが 5 つ、10 つ**と増えてくると、コンストラクタの引数列が読みづらくなります。

```java
new Pizza(true, true, false, true, "ROUND", 30, "THIN", null);
//        ↑↑↑ 何が何だっけ?
```

**Builder**（ビルダー）パターンは、こうした「**多くの選択肢**を持つオブジェクト」を、**段階的に・読みやすく**組み立てるためのパターンです。
コンストラクタの引数列を、**メソッド呼び出しの連なり**に置き換えます。

```java
Pizza pizza = Pizza.builder()
    .size(30)
    .crust("THIN")
    .cheese(true)
    .tomato(true)
    .build();
```

この章では、Builder の発想・古典的な書き方・現代の Java での書き方（レコード、Lombok）を見ていきます。

---

## この章を読み終えると

- Builder が解く「**テレスコープコンストラクタ問題**」を説明できる
- 流れるような API（**Fluent Builder**）を書ける
- `record` と Builder の使い分けが判断できる
