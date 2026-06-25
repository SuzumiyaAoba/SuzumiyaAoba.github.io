---
title: はじめに ― この章で学ぶこと
llm: true
co-author: ["Claude Opus 4.7"]
---

## はじめに ― この章で学ぶこと

**Chain of Responsibility**（責任の連鎖）パターンは、**「リクエストを、複数のハンドラに順番に通していく」**振る舞いパターンです。

各ハンドラは、

- リクエストを処理できるなら処理する
- できないなら**次のハンドラに渡す**

という形で連なります。
Web のリクエストパイプライン（Servlet Filter、Spring Interceptor）、ログレベルのフィルタ、UI のイベント伝搬 ―― 身近なところでよく使われています。

---

## この章を読み終えると

- Chain of Responsibility の**意図**を、自分の言葉で説明できる
- Servlet Filter / Spring Interceptor の構造を読み解ける
- ラムダで軽量に書ける場面が判断できる
