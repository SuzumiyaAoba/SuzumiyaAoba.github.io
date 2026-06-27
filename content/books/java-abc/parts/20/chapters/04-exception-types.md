---
title: 例外の種類 ― チェック例外と非チェック例外
llm: true
co-author: ["Claude Opus 4.7"]
---

## 例外の種類 ― チェック例外と非チェック例外

例外には、大きく分けて2つの種類があります。
**チェック例外**と**非チェック例外**です。
この違いは、「その例外を、必ず処理しなければならないか」に関わる、大切な区別です。

---

## 例外の家系図

まず、例外の種類が、どう枝分かれしているかを見ておきましょう。
すべての例外は、`Throwable`（スローアブル）という共通の先祖から、次のように分かれています。

```text
Throwable（すべての例外の先祖）
├─ Error            … 深刻なシステムの問題（メモリ不足など）。基本、扱わない
└─ Exception        … プログラムで対応すべき例外
   ├─ RuntimeException  … 非チェック例外（プログラムの誤り）
   │    （NullPointerException, ArrayIndexOutOfBoundsException, ...）
   └─ （その他の Exception） … チェック例外（外部の問題など）
        （IOException, ...）
```

- **`Error`** … メモリ不足など、回復が難しい深刻な問題。私たちが `catch` して対処するものではありません。
- **`Exception`** … プログラムで対応すべき例外。さらに2つに分かれます。
  - **`RuntimeException` とその仲間** … **非チェック例外**
  - **それ以外の `Exception`** … **チェック例外**

この「`RuntimeException` の仲間かどうか」が、2種類を分ける境界です。

![例外の家系図。すべての例外の先祖は Throwable。その下に Error（深刻な問題、扱わない）と Exception があり、Exception はさらに RuntimeException の仲間（非チェック例外、処理は任意、多くはプログラムの誤り）と、それ以外（チェック例外、処理は必須、多くは外部の事情）に分かれる。](./images/exception-hierarchy.svg)

---

## 非チェック例外 ― 処理を強制されない

**非チェック例外**（Unchecked Exception）は、`RuntimeException` とその仲間です。
これまで見てきた例外は、ほとんどがこちらでした。

- `NullPointerException`（第11章）
- `ArrayIndexOutOfBoundsException`（第8章）
- `ClassCastException`（第15章）
- `ArithmeticException`（第1節）
- `NumberFormatException`（第2節）

これらは、**try-catch で処理することを、強制されません**。
処理しなくてもコンパイルは通り、もし起きたら（対応していなければ）プログラムが止まります。

なぜ強制されないかというと、非チェック例外は、多くが**プログラムの書き方の誤り**だからです。
「`null` をチェックし忘れた」「配列の範囲を間違えた」といったものは、try-catch で隠すより、**コードを直して、そもそも起きないようにする**べきものです。
だから Java は、これらの処理を強制しないのです。

---

## チェック例外 ― 処理を強制される

**チェック例外**（Checked Exception）は、`RuntimeException` 以外の `Exception` です。
こちらは、**必ず処理（または宣言）しなければならない**、と Java が強制します。

代表例は、ファイルやネットワークなど、**外部とのやりとりで起きる例外**です。
身近な例として、`Thread.sleep(...)`（指定したミリ秒だけ処理を止める）があります。これは、`InterruptedException` というチェック例外を起こす可能性があります。

これを、何も処理せずに書くと、**コンパイルエラー**になります。

```java
public class Main {
    public static void main(String[] args) {
        Thread.sleep(1000);   // チェック例外を処理していない
    }
}
```

```text
エラー: 例外InterruptedExceptionは報告されません。スローするには、捕捉または宣言する必要があります
```

「`InterruptedException` を、捕捉（catch）するか、宣言する必要があります」と言われました。
非チェック例外と違い、チェック例外は**処理しないとコンパイルが通らない**のです。

try-catch で処理すれば、コンパイルが通ります。

```java
public class Main {
    public static void main(String[] args) {
        try {
            Thread.sleep(100);
            IO.println("100ミリ秒 待ちました");
        } catch (InterruptedException e) {
            IO.println("待機が中断されました");
        }
    }
}
```

```text
$ java Main.java
100ミリ秒 待ちました
```

なぜ強制されるかというと、チェック例外は、**プログラムの外側の事情**（ファイルがない、通信が切れた、など）で起きるものが多いからです。
これらは、コードを直しても完全には防げません。「**起きうるものとして、あらかじめ対応を考えておくべき**」なので、Java は処理を強制するのです。

---

## 2種類のまとめ

| | 非チェック例外 | チェック例外 |
|---|---|---|
| 正体 | `RuntimeException` とその仲間 | それ以外の `Exception` |
| 主な原因 | プログラムの書き方の誤り | 外部の事情（ファイル・通信など） |
| 処理（try-catch） | 強制されない | **強制される**（しないとコンパイルエラー） |
| 例 | `NullPointerException` など | `IOException`, `InterruptedException` |
| 基本の対応 | コードを直して起きないようにする | あらかじめ try-catch などで備える |

「**書き方の誤り（非チェック）は、直す。外部の事情（チェック）は、備える**」と整理すると、覚えやすいでしょう。

---

## まとめ

- 例外は、`Throwable` を先祖に、`Error`／`Exception` に分かれる
- `Exception` は、**非チェック例外**（`RuntimeException` の仲間）と**チェック例外**（それ以外）に分かれる
- **非チェック例外** … 処理を強制されない。多くは**プログラムの誤り**（直すべきもの）
- **チェック例外** … 処理しないと**コンパイルエラー**。多くは**外部の事情**（備えるべきもの）
- `NullPointerException` などは非チェック、`InterruptedException`・`IOException` などはチェック例外

次の節では、自分で例外を**投げる** `throw` と、**宣言する** `throws` を学びます。
