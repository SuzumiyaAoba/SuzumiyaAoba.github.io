---
title: よくあるつまずき
llm: true
---

## よくあるつまずき

シールドクラスで、初心者がつまずきやすいポイントを、まとめて確認します。

---

## 1. permits に書き忘れる

`permits` に書かれていないクラスは、シールドクラスを継承（実装）できません。
新しい子クラスを作ったのに、`permits` に追加し忘れると、エラーになります。

```java
sealed interface Shape permits Circle, Rectangle {}   // Triangle がない
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
record Triangle(double b, double h) implements Shape {}   // ✕ permits にない
```

```text
エラー: クラスはシール・クラスShapeを拡張できません('permits'句に指定されていないためです)
```

新しい種類を追加したら、`permits` のリストにも**忘れずに追加**しましょう。
（`.java` ファイルで子クラスを同じファイルに書く場合は、第2節のとおり `permits` を省略でき、この手間がなくなります。ただし jshell では省略できません。）

---

## 2. 子クラスに final / sealed / non-sealed を付け忘れる

シールドクラスを継承する子クラス（**ふつうのクラスの場合**）は、`final`・`sealed`・`non-sealed` のどれかを、必ず付けなければなりません。
付け忘れると、エラーになります。

```java
sealed interface Shape permits Circle {}
class Circle implements Shape {}   // ✕ final / sealed / non-sealed がない
```

```text
エラー: sealed、non-sealedまたはfinal修飾子が必要です
```

「自分も、さらに継承されてよいか」を、はっきりさせる必要があるのです。
ふつうは **`final`**（打ち止め）にします。

```java
final class Circle implements Shape {}   // ◯ final を付ける
```

> **補足: レコードなら、この問題は起きない**
>
> **レコードは自動的に `final`** なので、子クラスをレコードにすれば、この修飾子を意識する必要がありません。
> シールドクラスの子は、レコードにするのが、いちばん手軽です。

---

## 3. default を書いて、もれ検査をつぶす

シールドクラスのいちばんの利点は、「種類の追加もれを、コンパイラが教えてくれる」ことでした（第3節）。
ところが、`switch` に `default` を書いてしまうと、その利点が**消えて**しまいます。

```java
double area = switch (shape) {
    case Circle c    -> ...;
    case Rectangle r -> ...;
    default          -> 0;   // △ これがあると、種類を追加してももれを教えてくれない
};
```

`default` があると、新しい図形を追加しても、それが `default` に吸収され、「処理し忘れ」のエラーが出ません。
**シールドクラスを `switch` するときは、`default` を書かず、すべての `case` を並べる**のが、もれ防止のコツです。

---

## 4. enum で十分なのに、シールドクラスを使う

シールドクラスは、「**種類ごとに、違うデータを持つ**」ときに向いています。
逆に、「単なる選択肢で、みな同じ形」なら、第18章の **enum** のほうが、ずっとシンプルです。

```java
// △ 各要素がデータを持たないなら、シールドクラスは大げさ
sealed interface Color permits Red, Green, Blue {}
record Red() implements Color {}
record Green() implements Color {}
record Blue() implements Color {}

// ◯ こういうのは enum で十分
enum Color { RED, GREEN, BLUE }
```

「信号の色」「曜日」のような単純な選択肢は **enum**、「図形」「イベント」のように**種類ごとに中身が違う**ものは**シールドクラス**、と使い分けましょう。

---

## まとめ

- 新しい子クラスは、**`permits` に追加**する（同じファイルなら省略可）
- 子クラス（ふつうのクラス）には、**`final`・`sealed`・`non-sealed` のどれか**が必須（レコードなら不要）
- `switch` に **`default` を書かない**（書くと、もれ検査の利点が消える）
- 単純な選択肢は **enum**、種類ごとに中身が違うなら**シールドクラス**

次は、この章で学んだ言葉を、用語集としてまとめます。
