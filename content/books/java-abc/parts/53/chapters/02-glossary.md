---
title: 用語集 ― この章で学んだ言葉
llm: true
co-author: ["Claude Opus 4.7"]
---

## 用語集 ― この章で学んだ言葉

| 用語 | 英語 | 意味 |
|---|---|---|
| Abstract Factory | Abstract Factory | 関連する製品群（家族）をまとめて生成する抽象工場 |
| 製品ファミリー | Product Family | 互いに整合する複数のプロダクトの集まり |
| 具象工場 | Concrete Factory | Abstract Factory を実装した、特定の家族を作るクラス |
| 整合性 | Consistency | 製品の家族間で組み合わせが破綻しないこと |

---

## この章で学んだこと

- Abstract Factory は **製品の「家族」をそろえて作る**ためのパターン
- 工場全体をクラスとして抽象化し、**家族の切り替え**は工場を取り替えるだけ
- Factory Method の**集合**として実装することが多い

次は **第54章: Builder パターン** ―― 段階的にオブジェクトを組み立てるパターンです。
