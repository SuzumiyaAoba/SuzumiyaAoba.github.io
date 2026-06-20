---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

デザインパターンを学んだ直後に、初心者がはまりやすいポイントを整理します。

---

## 1. パターン病 ― どこにでもパターンを当てはめる

学んだ直後にいちばん起きやすいのが、**パターン病**です。

```java
// △ 単純な計算なのに、わざわざ Strategy 化
interface AddStrategy { int add(int a, int b); }
class SimpleAddStrategy implements AddStrategy {
    public int add(int a, int b) { return a + b; }
}
```

実態は `a + b` のひと言なのに、interface とクラスを増やして、わざわざ複雑にしています。

### 対処

- 「**いま困っているか?**」を、まず確認する
- 「将来必要になるかも」は、たいてい**来ない**
- パターンは「**困ったときの選択肢**」と心得る

設計は**シンプルから始めて、必要になったらリファクタリング**するのが鉄則です。

---

## 2. 過剰な抽象化 ― 使わない interface だらけ

「あとで差し替えるかも」と言って、`interface` を切ってしまう。

```java
// △ 実装が 1 つしかないのに interface を切る
interface UserRepository {
    Optional<User> findById(long id);
}
class UserRepositoryImpl implements UserRepository { ... }
```

実装が 1 つしかなく、テストにもモック化が不要なら、`interface` は要りません。
**`UserRepository` クラスだけで十分**な場合があります。

ただし、

- 第33章で学んだとおり、**Mockito でモック化したいから interface にする**
- 第36章で出てくる、**Spring の DI と相性をよくするため**

といった事情があるなら、interface 化は意味があります。
「**いま、interface があると、何が嬉しいか**」を毎回考えましょう。

---

## 3. パターン名で会話して、中身を共有しない

```text
A: 「ここ、Decorator にしようよ」
B: 「いいね、Decorator で」
（しばらく経って）
A: 「あれ、これ Adapter じゃない?」
B: 「えっ、Decorator のつもりだった……」
```

パターン名は便利な共通語ですが、**名前だけで合意したつもりになる**のは危険です。

### 対処

- パターン名で話したあと、**コード片やクラス図**で必ず確認する
- とくに、**Adapter / Decorator / Facade / Proxy** は混同しやすい

---

## 4. パターン名にこだわって、現代的な書き方を避ける

「Observer は `addObserver` / `removeObserver` で書くものだ」と思い込んで、ラムダ式や `Flow.Publisher` を避けてしまうケース。

```java
// △ 古い書き方にこだわる
abstract class AbstractObservable {
    private List<AbstractObserver> observers = new ArrayList<>();
    public void addObserver(AbstractObserver o) { observers.add(o); }
    ...
}
```

GoF が書かれた時代の Java と、いまの Java は別物です。
**「いまの Java で、その問題をどう解くか」**を、毎回考えましょう。

### 対処

- ラムダ式・関数型インタフェース（第22章）で済むなら、それで書く
- 標準ライブラリ（`Flow.Publisher`、`CompletableFuture` など）があるなら、それを優先する
- 「教科書どおりに書く」より「**問題が解けているか**」を重視する

---

## 5. パターンを覚えて、原則を覚えない

パターンは、**原則の応用例**です。
たとえば、

- **Strategy** … 「変わるものを、変わらないものから切り離せ」（OCP、第35章）
- **Factory** … 「生成を、利用から切り離せ」（SRP、第35章）
- **Template Method** … 「具体に依存するな、抽象に依存せよ」（DIP、第35章）

パターン名だけ覚えると、**「なぜそう書くのか」**が説明できません。
原則を理解して初めて、自分の場面に応用できます。

### 対処

- 第35章の **SOLID 原則** を、必ずセットで学ぶ
- 「このパターンは、どの原則を実現しているか」を意識する

---

## 6. Singleton をテストに残してしまう

第4節で警告したとおり、Singleton は**テストで切り離しにくい**設計です。

```java
public class OrderService {
    public void process() {
        AppConfig.INSTANCE.getDatabaseUrl();   // △ 直接呼んでいる
    }
}
```

このコードは、**`AppConfig` を差し替えてテストできません**。
モックでなんとかしようとしても、`mockStatic` のような特殊な手段が必要になります。

### 対処

- Singleton にしたい状態は、**インタフェース越しに依存**として受け取る
- `OrderService(Config config)` のように、コンストラクタで注入する
- DI コンテナがあるなら、**スコープを Singleton にして外から渡す**（第36章）

---

## 7. パターンの名前を、英語名 / 日本語名で混乱する

| 英語名 | よく見る日本語名 |
|---|---|
| Strategy | ストラテジー / 戦略 |
| Factory | ファクトリー / 工場 |
| Singleton | シングルトン / 単一インスタンス |
| Observer | オブザーバー / 観察者 |
| Template Method | テンプレートメソッド |
| Adapter | アダプター |
| Decorator | デコレーター |
| Facade | ファサード |

業界の慣習として、**英語名（カタカナ）**を使うことが圧倒的に多いです。
「Strategy パターンで」と言えば伝わります。

---

## まとめ

- パターンを覚えた直後は、**使いたがる病**にかかりやすい
- 「**いま困っているか**」を毎回確認する
- 過剰な抽象化（使わない interface）は、設計を重くする
- パターン名は便利だが、**コードと合意**を取る癖をつける
- ラムダ式・標準 API など、**現代の Java**で素直に書ける場合はそうする
- パターンと原則（**SOLID**）はセットで学ぶ
- Singleton は **DI コンテナの Singleton スコープ**で代用するのが現代風

次は、この章で学んだ言葉を、用語集としてまとめます。
