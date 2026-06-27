---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

JPA で、初心者（と中堅以上も）がはまりやすいポイントを、まとめて確認します。

---

## 1. N+1 問題

JPA でいちばん有名な性能トラブルです。
たとえば、

```java
List<Author> authors = authorRepository.findAll();   // ① SELECT * FROM authors

for (Author author : authors) {
    int count = author.getBooks().size();             // ② SELECT * FROM books WHERE author_id = ?
}
```

これを実行すると、

- ①で `SELECT * FROM authors` が **1 回**
- 各 `Author` について、`books` を取りに行く **N 回**の SELECT

―― 合計 **1 + N 回** の SELECT が発行されます。
著者が 100 人いれば、SELECT が 101 回。
本番でこれが起きると、**1 ページの表示に数秒**かかる、という状態になります。

### 対処

#### 1. **JOIN FETCH** で 1 回にまとめる

```java
@Query("SELECT a FROM Author a LEFT JOIN FETCH a.books")
List<Author> findAllWithBooks();
```

JPQL の `JOIN FETCH` で、本も**1 回の SELECT** にまとめて取ります。
JOIN 1 つで終わるので、N+1 が解消します。

#### 2. **`@EntityGraph`** で宣言する

```java
@EntityGraph(attributePaths = "books")
List<Author> findAll();
```

派生クエリにも書けて、より宣言的です。

#### 3. **`Pageable` を伴うときの注意**

`JOIN FETCH` + `Pageable` を一緒に使うと、警告が出ます（ページングを Hibernate がメモリ内で処理して非効率になる）。
**集計が必要なときは、別途 `count` クエリを書く**などの工夫が必要です。

`N+1` は、**SQL ログを ON** にしておけば気づきやすくなります。
学習中は、必ず `show-sql: true` で SQL を見ながら書きましょう。

---

## 2. エンティティの `equals` / `hashCode`

`@Entity` のクラスで、`equals` / `hashCode` を**フィールド全部**でオーバーライドすると、罠にはまります。

```java
@Override
public boolean equals(Object o) {
    if (!(o instanceof Book b)) return false;
    return Objects.equals(id, b.id)
        && Objects.equals(title, b.title)
        && Objects.equals(author, b.author);
}
```

JPA のエンティティは、

- 保存前は `id` が `null`
- 保存後に `id` が振られる
- 一度 `Set` に入れたあと、保存して `id` が変わると、**`hashCode` が変わって取り出せなくなる**

という事故が起きます。

### 対処

- **`id` だけ**で `equals` / `hashCode` を判断する
- かつ、`id` が `null` のときも安全に動くようにする

```java
@Override
public boolean equals(Object o) {
    if (!(o instanceof Book b)) return false;
    return id != null && id.equals(b.id);
}

@Override
public int hashCode() {
    return getClass().hashCode();   // クラスごとに固定
}
```

`hashCode` を **クラスごとに固定**にすることで、`id` が変わっても `hashCode` が変わらない構造にします。

これは Vlad Mihalcea の有名な記事で広まったパターンで、JPA の世界では**事実上の標準**です。

---

## 3. Lazy ロードと `LazyInitializationException`

第5節で見た Lazy ロードは、**トランザクションの外で呼ぶと例外になる**点に注意です。

```java
@Service
public class AuthorService {

    @Transactional(readOnly = true)
    public Author getAuthor(long id) {
        return authorRepository.findById(id).orElseThrow();
    }
}

// コントローラから
Author author = authorService.getAuthor(1L);   // ここでトランザクション終了
author.getBooks().size();                       // → LazyInitializationException
```

トランザクションが閉じると、**永続コンテキストも閉じる**ため、Lazy なフィールドにアクセスできなくなります。

### 対処

- **必要なデータは、トランザクションの中で取り出しておく**（`size()` を呼ぶ、リストを `new ArrayList<>(...)` でコピーするなど）
- 専用の DTO に**変換してから**返す（次項）
- どうしても必要なら、`open-in-view` 設定（ただし非推奨）

---

## 4. エンティティを REST API のレスポンスにそのまま返す

Web 層から、`Book` エンティティをそのまま JSON で返すコードを書きがちです。

```java
@GetMapping("/books/{id}")
public Book get(@PathVariable Long id) {
    return bookRepository.findById(id).orElseThrow();
}
```

これは、いくつかの問題を抱えます。

- **Lazy ロード**が、シリアライズ時にトリガーされて N+1 を引き起こす
- DB のカラムをそのまま API の構造にしてしまう（**内部実装が公開**）
- 双方向関連で、**JSON が無限ループ**になる（`Author → Book → Author → ...`）

### 対処

**DTO**（Data Transfer Object）に変換してから返します。

```java
public record BookResponse(Long id, String title, String author) {
    public static BookResponse from(Book book) {
        return new BookResponse(book.getId(), book.getTitle(), book.getAuthor().getName());
    }
}

@GetMapping("/books/{id}")
public BookResponse get(@PathVariable Long id) {
    return bookRepository.findById(id)
        .map(BookResponse::from)
        .orElseThrow();
}
```

record で DTO を書くと、簡潔・不変・自動 JSON 化、と相性抜群です。
第38章で詳しく扱います。

---

## 5. `save` を呼ばないと反映されないと思い込む

第6節で見た通り、永続コンテキスト内のエンティティは、**`save` を呼ばなくても**変更が反映されます。

```java
@Transactional
public void changeAuthor(long bookId, String newAuthorName) {
    Book book = bookRepository.findById(bookId).orElseThrow();
    book.setAuthor(...);
    bookRepository.save(book);   // ← この行は省略しても、ちゃんと UPDATE される
}
```

「**書いてもよいが、省略しても動く**」ので、コードが混乱します。

### 対処

- **書くスタイル**を、チームで揃える
- 「**書かなくても動くこと**」は、レビューで明示する

「書いておく派」と「書かない派」がいて、好みです。
「書く派」のメリットは、`save` を grep するだけで「UPDATE が走る場所」を全部見つけられること。
「書かない派」は、永続コンテキストの動きを正しく理解した、より上級の書き方です。

---

## 6. テストで `@SpringBootTest` を乱用

第36章でも触れましたが、JPA のテストでも同じです。

```java
@SpringBootTest        // ← 全コンテキストを立てる
class BookRepositoryTest { ... }
```

これは重いので、**JPA だけを切り出した軽量テスト**を使います。

```java
@DataJpaTest           // ← JPA 関連だけを起動。H2 を使ってトランザクションも自動制御
class BookRepositoryTest {

    @Autowired BookRepository bookRepository;

    @Test
    void findsByAuthor() {
        bookRepository.save(new Book(null, "Test", "Author", 2026));
        assertThat(bookRepository.findByAuthor("Author")).hasSize(1);
    }
}
```

`@DataJpaTest` は、

- JPA・エンティティ・リポジトリだけを準備
- **テスト終了時にトランザクションを自動ロールバック**
- インメモリ DB（H2）を自動使用

と、**テスト用にちょうどよい軽量設定**を提供してくれます。

---

## 7. `findAll()` で全件取得

「100 万件のデータがあるテーブルで、`findAll()` を呼んだ」事故は、現場でよく聞く話です。

```java
List<Order> all = orderRepository.findAll();   // 100 万件メモリに乗る → OutOfMemoryError
```

### 対処

- 全件が必要なケースは、ほぼない
- **ページング**（`findAll(Pageable)`）か、**ストリーム取得**（`Stream<T>`）を使う
- 「件数が多いかも」と思ったら、`count()` で先に確認する

入門段階から、「`findAll()` は危険」と意識しておくとよいです。

---

## 8. `@Transactional` を `private` メソッドに付ける

```java
@Service
public class OrderService {

    @Transactional
    private void doStuff() { ... }   // ← 効かない
}
```

Spring の `@Transactional` は、プロキシ経由で動くため、**`public` メソッドにしか効きません**。
`private` や `protected` に付けても、サイレントに無視されます。

### 対処

- `@Transactional` を付けたいメソッドは、**`public` にする**
- それでもプライベートに見せたければ、**別のクラスに切り出す**

---

## 9. テーブル設計を後から変える

エンティティ設計が固まってからテーブルを変えると、データ移行が必要になります。
`ddl-auto: update` は、**新しいカラムを足す**ことはできても、**カラムの変更や削除はやってくれません**。

### 対処

- 本番では `ddl-auto: validate` か `none` にして、テーブル管理は**マイグレーションツール**に任せる
- 代表的なのは **Flyway** や **Liquibase**
- マイグレーションファイルは Git で管理し、**コードと一緒にバージョン管理**

「ローカルでは `ddl-auto: create-drop`、CI と本番では Flyway」が、よくある構成です。

---

## まとめ

- **N+1 問題**は、`JOIN FETCH` または `@EntityGraph` で解消
- エンティティの **`equals` / `hashCode`** は `id` だけで判断、`hashCode` はクラス固定
- **`LazyInitializationException`** は、トランザクション内で必要データを取り出す
- API のレスポンスは**DTO**（record）に変換する
- `save` 呼び出しは省略できるが、**チームでスタイルを揃える**
- テストは **`@DataJpaTest`** で軽量に
- **`findAll()`** は危険。ページングを使う
- **`@Transactional`** は `public` のみ。`private` には効かない
- 本番のテーブル管理は、**マイグレーションツール（Flyway/Liquibase）**へ

次は、この章で学んだ言葉を、用語集としてまとめます。
