---
title: ArrayListを読んでみる
author: SuzumiyaAoba
date: 2020-01-11 00:43:00 +0800
categories: [Programming, Code Reading]
tags: [Java]
math: true
mermaid: true
---

最近、少しばかりC言語を書いているがC言語では何でも自分できる (書く) 反面、
どのように実装するのがベストプラクティスなのかわからないことが多い。
これは普段C言語を書いていないことが原因なのと、標準ライブラリは glibc が
どの程度のことを提供しているライブラリなのか知らないのが大きいのかもしれない。

そこで、業務で使っているJavaの知識を身に付けつつそれらしいコードを書くために
Javaの標準ライブラリを読んでC言語で移植するということでもしようかと思う。
本当はGoの標準ライブラリでも読んだ方がいいのかもしれないが、
Javaの知識も付けないといけないなーと感じていたので丁度いいかもしれない。
手始めとして今回はArrayListの中身を読んでみる。

この記事は、コードを読んだときのメモです。  
気が向いたら他のコレクションも読んだ後に一つの記事にしようと思う。


## JDK

[AdoptOpenJDK/openjdk-jdk11 jdk-11+28](https://github.com/AdoptOpenJDK/openjdk-jdk11/tree/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d)

## 関連ファイル

- [ArrayList.java](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java)
- [Arrays.java](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/Arrays.java)

## メモ

メモなので `ArrayList` について詳しくは書かない。
内部で配列を用いたリスト実装ということだけ抑えておけば、その利点や欠点が容易に想像できると思う。

### 要素の追加

要素を追加するとき、内部で配列を使うような実装を行うと配列の大きさが要素数に対して少なるなる場面が現れる。
そのような場合には、より大きな配列を確保して新な配列に既存の要素をコピーしてあげる必要がある。
このときに確保すべき配列の大きさや初期の配列の大きさはどれくらいにすべきだろうか。
その辺を知るために調べたメモ。

- `ArrayList` の内部で利用する[配列の大きさのデフォルト値は 10](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java#L113-L116)
- 要素数の最大値は `Integer` の最大値 `-8` ([`MAX_ARRAY_SIZE`](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java#L221-L227))
- 配列の大きさを越えて要素が追加された場合は [grow メソッド](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java#L229-L243) を呼びより大きな配列を確保する
  - 新しく確保される配列の大きさは [newCapacity メソッド](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java#L245-L268) により決められる
  - 基本的には元の大きさの1.5倍
  - 新しく確保される配列の大きさは `oldCapacity + (oldCapacity >> 1)` で計算されるのでオーバーフローの可能性がある
    - オーバーフローが発生した場合、`newCapacity` よりも `oldCapacity` の方が大きくなるためそれを考慮したようなコードが書かれている
    - 現在の capacity が `0` もくは内部の配列が空の場合には `DEFAULT_CAPACITY` (`10`) と引数の `minCapacity` の大きい方を新しい capacity として採用
    - minCapacity が `0` より小さい場合にはオーバーフローのため `OutOfMemoryError` を投げる
  - 元の配列の1.5 倍が正しく計算された場合には、`MAX_ARRAY_SIZE` を越えていなければその数値を新しい capacity とする
  - 越えている場合には [hugeCapacity メソッド](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java#L270-L276) で大きさを計算し直す

ここで疑問に思うのが [hugeCapacity メソッド](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java#L270-L276) の実装だ。
`Integer.MAX_VALUE - 8` が最大になるように計算しているが、最終的には `Integer.MAX_VALUE` も試している。
調べてみると Stack Overflow にそのものズバリな質問があった。

- [Java 8 Arraylist hugeCapacity(int) implementation](https://stackoverflow.com/questions/35582809/java-8-arraylist-hugecapacityint-implementation)
- [ArrayList.java#L221-L227](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java#L221-L227)

ソースコードにもコメントで書かれていたが、配列の最大値は VM の実装に依って変わってくるようだ。
VM によっては配列に何かしらのヘッダーが付与されることがあるようで、それを考慮した実装が `ArrayList` では成されている。

配列のコピーは、[Arrays.copyOf](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/Arrays.java#L3692-L3725) を使って行っている。
内部の実装とは関係ないが、非検査例外についても `@throws` が書かれていて標準ライブラリだけあって丁寧だなーと思った。
ここのコードを正確に理解するには `Class` について理解する必要がありそうだ。
`((Object)newType == (Object)Object[].class)` の部分で何を判定したいのかがわからない。
`new Object[newLength]` と `Array.newInstance(newType.getComponentType(), newLength);` では速度的な有利不利があるのだろうか。

[Array](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/lang/reflect/Array.java) の実態は `java.lang.reflect.Array` にあるようだ。
[newInstance メソッド](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/lang/reflect/Array.java#L49-L79) では `newArray` を呼び出している。
帰り値の型が `Object` なので原始的なメソッドの香りを感じる。
[newArray](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/lang/reflect/Array.java#L480-L486) では `@HotSpotIntrinsicCandidate` アノテーションが付与されている。
ここから先はCPUアーキテクチャごとに実装が異なるみたいだ。
今のところここから先に立ち入るつもりはないのでこの辺で追うのをやめておく。


### 削除による要素の再配置

リストの内部実装として配列を持つと、要素を削除したときに削除された要素以降の要素を詰める必要があると思うが、ここはどのように実装しているだろうか。

[remove メソッド](https://github.com/AdoptOpenJDK/openjdk-jdk11/blob/d17d4c5b52d13307cf8ac8dbf8a17f6bd6a1902d/src/java.base/share/classes/java/util/ArrayList.java#L525-L542) の実装は単純だ。

