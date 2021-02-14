---
title: queue.h の list を使う
author: SuzumiyaAoba
date: 2021-01-12 00:00:00 +0800
categories: [Programming, C言語, glibc]
tags: [C言語, Programming]
math: true
mermaid: true
---

glibc の queue.h にある list を使ってみる。
glibc の関数やマクロって実際のところC言語での開発でどの程度使われているのだろうか…

queue.h には lists, singly linked lists, simple queues, tail queues, circular queues の
5つのデータ構造が定義されている。
中身を見るとわかるけど全てマクロで定義されていてこれがC言語のやり方か、と思った。
どの言語でも習熟度によって結果として同じことをするコードでも書き方に違いが出るが、
自身のC言語に対する知識の無さが自覚できた。

## バージョン

弱いエンジニアなので Apple M1 で glibc を使う方法がわからなかったので仕方なく実装では BSD libc を使うことにする。

- [queue.h](https://github.com/freebsd/freebsd-src/blob/098dbd7ff7f3da9dda03802cdb2d8755f816eada/sys/sys/queue.h)

記事内のコードの説明では GNU libc のコードを用いる。リストの実装なんて対して変わらんやろ (適当)。

## List の定義

```c
/*
 * List definitions.
 */
#define        LIST_HEAD(name, type)                                                \
struct name {                                                                \
        struct type *lh_first;        /* first element */                        \
}
 
#define        LIST_HEAD_INITIALIZER(head)                                        \
        { NULL }
 
#define        LIST_ENTRY(type)                                                \
struct {                                                                \
        struct type *le_next;        /* next element */                        \
        struct type **le_prev;        /* address of previous next element */        \
}
 
/*
 * List functions.
 */
#define        LIST_INIT(head) do {                                                \
        (head)->lh_first = NULL;                                        \
} while (/*CONSTCOND*/0)
 
#define        LIST_INSERT_AFTER(listelm, elm, field) do {                        \
        if (((elm)->field.le_next = (listelm)->field.le_next) != NULL)        \
                (listelm)->field.le_next->field.le_prev =                \
                    &(elm)->field.le_next;                                \
        (listelm)->field.le_next = (elm);                                \
        (elm)->field.le_prev = &(listelm)->field.le_next;                \
} while (/*CONSTCOND*/0)
 
#define        LIST_INSERT_BEFORE(listelm, elm, field) do {                        \
        (elm)->field.le_prev = (listelm)->field.le_prev;                \
        (elm)->field.le_next = (listelm);                                \
        *(listelm)->field.le_prev = (elm);                                \
        (listelm)->field.le_prev = &(elm)->field.le_next;                \
} while (/*CONSTCOND*/0)
 
#define        LIST_INSERT_HEAD(head, elm, field) do {                                \
        if (((elm)->field.le_next = (head)->lh_first) != NULL)                \
                (head)->lh_first->field.le_prev = &(elm)->field.le_next;\
        (head)->lh_first = (elm);                                        \
        (elm)->field.le_prev = &(head)->lh_first;                        \
} while (/*CONSTCOND*/0)
 
#define        LIST_REMOVE(elm, field) do {                                        \
        if ((elm)->field.le_next != NULL)                                \
                (elm)->field.le_next->field.le_prev =                         \
                    (elm)->field.le_prev;                                \
        *(elm)->field.le_prev = (elm)->field.le_next;                        \
} while (/*CONSTCOND*/0)
 
#define        LIST_FOREACH(var, head, field)                                        \
        for ((var) = ((head)->lh_first);                                \
                (var);                                                        \
                (var) = ((var)->field.le_next))
 
/*
 * List access methods.
 */
#define        LIST_EMPTY(head)                ((head)->lh_first == NULL)
#define        LIST_FIRST(head)                ((head)->lh_first)
#define        LIST_NEXT(elm, field)                ((elm)->field.le_next)
```

この list の実装については、最近 Gigazine の[記事](https://gigazine.net/news/20201208-linked-list-good-taste/)で紹介されていた。
ここで用意されている操作は以下の 9 つ。

- `LIST_INIT`
- `LIST_INSERT_AFTER`
- `LIST_INSERT_BEFORE`
- `LIST_INSERT_HEAD`
- `LIST_REMOVE`
- `LIST_FOREACH`
- `LIST_EMPTY`
- `LIST_FIRST`
- `LIST_NEXT`

BSD libc ではより多くの操作を提供しているようだ ([該当コード](https://github.com/freebsd/freebsd-src/blob/098dbd7ff7f3da9dda03802cdb2d8755f816eada/sys/sys/queue.h#L440-L612))。
GNU libc の中身を確認してから余裕があればこちらも見ていこうと思う。

マクロとポインタにある程度慣れている人ならば直ぐにコードを理解できると思うが、ここでは少しずつコードを紐解いていく。
このコードを見ただけだと使い方が想像し難いので list を使う例を示そう。

```c
#include <stdio.h>
#include <stdlib.h>

#include <sys/queue.h>

struct Integer {
  int data;
  LIST_ENTRY(Integer) entries;
};

int main(int argc, char **argv) {
  LIST_HEAD(IntegerListHead, Integer) head;
  
  return 0;
}
```

list で用いるために必要な `struct` の定義や `HEAD` の変数宣言までを行うと上記のようなコードになる
(`#include <sys/queue.h>` では BSD libc を読み込んでいるが GNU libc と中身が同じことは確認済み)。
ここでは、list の要素として `Integer` を用いる。`Integer` はメンバとして `int` 型の変数 `data` と `LIST_ENTRY(Integer)` 型の変数 `entries` を持つ。
`LIST_ENTRY(Integer)` を展開すると以下のような構造体になっている。

```c
struct {
  struct Integer *le_next;
  struct Integer **le_prev;
}
```

`le_next` と `le_prev` にどのような値が入るかは後々見ていくので今は気にしなくてよい。
上記からマクロ展開後の `Integer` は、

```c
struct Integer {
  int data;
  struct {
    struct Integer *le_next;
    struct Integer **le_prev;
  } entries;
};
```

であることがわかる。
次に `main` 関数を見ると、

```c
  LIST_HEAD(IntegerListHead, Integer) head;
```

とあるのでこちらもマクロを展開すると、

```c
  struct IntegerListHead {
    struct Integer *lh_first;
  } head;
```

となる。
ここまで見れば list のデータ構造がどのようなものか理解できる。

```
+-----------------+    +------------+
| IntegerListHead |    | Integer    |
+-----------------+    +------------+
| lh_first -------+--->| le_next ---+---> NULL
| ^               |    | le_prev -+ |
+-+---------------+    | data     | |
  |                    +----------+-+
  |                               |
  +-------------------------------+
```

下手なアスキーアートになっているが、要素が一つの場合に各変数の値の関係は上記の図のようになっているのだろう
(`Integer` のメンバ `entities` は図を単純にする都合上から平坦化されている)。
このリストの末尾に要素を一つ追加すると、上図の `le_next` には追加された `Integer` 型の変数のポインタを入れてやり、
末尾に追加される要素の `le_prev` には上図の `le_next` 変数のポインタを入れてやれば上手いこと繋がる。
doubly linked list を実装したことがある人は、この説明だけで最初に載せたコードを理解できると思う。

> A list is headed by a single forward pointer (or an array of forward
> pointers for a hash table header). The elements are doubly linked
> so that an arbitrary element can be removed without a need to
> traverse the list. New elements can be added to the list before
> or after an existing element or at the head of the list. A list
> may be traversed in either direction.

そういうこと。
あとは Gigazine の[記事](https://gigazine.net/news/20201208-linked-list-good-taste/)読めばわかる。

最後に動作を見るために書いたコードだけ載せて終わり。
かなり雑な記事になってしまったなぁ…。
今どき glibc の使い方わからん〜〜〜とか言って list の使い方調べる人なんておらんでしょ (確信)。

list 以外のデータ構造についても同じような調子でマクロだけで書かれてる。
使い方も list と同じような感じ。
正直なところ list, Singly-linked List は使い勝手が悪いし、使い所が限られているように思えた。
実際にどこかで使われているのだろうか…

```c
#include <stdio.h>
#include <stdlib.h>

#include <sys/queue.h>

#define BOOL_STRING(bool) ((bool) ? "true" : "false")

struct Integer {
  int data;
  LIST_ENTRY(Integer) entries;
};

void print_int(struct Integer *integer) {
  printf("Integer {\n");
  printf("  data = %d;\n", integer->data);
  printf("  entries {\n");
  printf("    le_next = %p;\n", integer->entries.le_next);
  printf("    &le_next = %p;\n", &integer->entries.le_next);
  printf("    le_prev = %p;\n", integer->entries.le_prev);
  printf("  };\n");
  printf("};\n");
}

int main(int argc, char **argv) {
  LIST_HEAD(IntListHead, Integer) head;
  struct Integer *n1, *n2, *np;

  LIST_INIT(&head);

  n1 = malloc(sizeof(struct Integer));
  n1->data = 1;
  LIST_INSERT_HEAD(&head, n1, entries);

  LIST_FOREACH(np, &head, entries) {
    print_int(np);
  }
  
  n2 = malloc(sizeof(struct Integer));
  n2->data = 2;
  LIST_INSERT_AFTER(n1, n2, entries);

  LIST_FOREACH(np, &head, entries) {
    print_int(np);
  }

  printf("list is empty: %s\n", BOOL_STRING(LIST_EMPTY(&head)));

  LIST_REMOVE(n1, entries);
  LIST_REMOVE(n2, entries);

  printf("list is empty: %s\n", BOOL_STRING(LIST_EMPTY(&head)));

  free(n1);
  free(n2);

  return 0;
}
```
