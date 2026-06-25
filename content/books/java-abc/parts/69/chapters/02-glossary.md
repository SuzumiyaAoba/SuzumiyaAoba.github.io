---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Chain of Responsibility | Chain of Responsibility | リクエストを順にハンドラへ渡す振る舞いパターン |
| Handler | Handler | リクエストを受け取り、処理または次に渡すオブジェクト |
| Filter Chain | Filter Chain | Servlet API でフィルタを順に通す仕組み |
| Interceptor | Interceptor | Spring などで前処理／後処理を担うハンドラ |

---

## この章で学んだこと

- **Chain of Responsibility** はハンドラを連結する振る舞いパターン
- Servlet Filter / Spring Interceptor の根本構造
- 単純な順次処理は `Consumer#andThen` で十分

次は **第70章: Mediator パターン** ―― 多対多のやり取りを 1 点にまとめる振る舞いパターンです。
