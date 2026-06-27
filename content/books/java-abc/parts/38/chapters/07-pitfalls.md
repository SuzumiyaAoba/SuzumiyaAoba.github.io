---
title: よくあるつまずき
llm: true
co-author: ["Claude Opus 4.7"]
---

## よくあるつまずき

REST API で、初心者がはまりやすいポイントを整理します。

---

## 1. エンティティをそのまま返す

繰り返し述べてきたとおり、これは**避けましょう**。

```java
@GetMapping("/{id}")
public Book get(@PathVariable Long id) {                 // △ エンティティそのまま
    return bookRepository.findById(id).orElseThrow();
}
```

問題点：

- Lazy ロードがシリアライズ時に発火（N+1 問題）
- DB の構造が API に**漏れる**
- 双方向関連で**JSON 無限ループ**
- 内部フィールドが**そのまま外部に公開**

### 対処

- **DTO**（record で書く）に変換してから返す
- マッピングは `BookResponse.from(book)` のような static ファクトリーで

---

## 2. JSON が無限ループ

第37章の `@OneToMany` の双方向関連で、よく起きます。

```java
@Entity
public class Author {
    @OneToMany(mappedBy = "author")
    private List<Book> books;
}

@Entity
public class Book {
    @ManyToOne
    private Author author;
}
```

これを Jackson が JSON 化しようとすると、

```text
Author → books → Book → author → books → Book → author → ...
```

と、**無限再帰**して `StackOverflowError` になります。

### 対処

- **DTO に変換**して返す（最良）
- どうしても双方向のままなら、`@JsonIgnore` か `@JsonManagedReference` / `@JsonBackReference` で片方を抑える
- 「エンティティを JSON で返さない」が、結局いちばん安全

---

## 3. `@PathVariable` の型変換エラー

```java
@GetMapping("/{id}")
public BookResponse get(@PathVariable Long id) { ... }
```

`/api/books/abc` を投げると、**400 Bad Request** が返ります。
`abc` を `Long` に変換できないからです。
これは想定内の挙動ですが、**メッセージがわかりにくい**ことがあります。

### 対処

- `@RestControllerAdvice` で `MethodArgumentTypeMismatchException` を処理し、わかりやすい 400 を返す
- そもそも、ID が文字列のままで意味があるなら `String` で受ける選択もある

---

## 4. POST のときに `Content-Type` を指定し忘れる

```text
$ curl -X POST http://localhost:8080/api/books -d '{...}'
```

これだと、**415 Unsupported Media Type** が返ります。
curl のデフォルトでは `application/x-www-form-urlencoded` が送られるためです。

### 対処

```text
$ curl -X POST http://localhost:8080/api/books \
       -H "Content-Type: application/json" \
       -d '{...}'
```

`-H "Content-Type: application/json"` を**忘れない**。
これはサーバー側の問題ではなく、**呼び出し側の指定漏れ**です。
業務システムでも、フロントエンドが指定し忘れて 415 を踏むことがあります。

---

## 5. CORS で弾かれる

ブラウザから別オリジン（別のドメイン）のサーバーに REST API を呼ぶと、**CORS**（Cross-Origin Resource Sharing）の制約で**弾かれる**ことがあります。

```text
Access to fetch at 'http://localhost:8080/api/books' from origin
'http://localhost:3000' has been blocked by CORS policy
```

「**ブラウザのセキュリティ機能**」なので、サーバー側のログには何も出ません。
これも、入門段階でハマるポイントです。

### 対処

特定のオリジンを許可するには、`@CrossOrigin` か、設定クラスで `WebMvcConfigurer` を実装します。

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
```

開発時は、フロントエンド側の `localhost:3000` から API を叩く構成が多いです。
本番では、許可するオリジンを**最小限**に絞ります。

---

## 6. `@RequestParam` を `@PathVariable` のように使う

URL を `/api/books?id=1` のように設計してしまうケース。

```java
@GetMapping
public Book get(@RequestParam Long id) { ... }
```

これは技術的には動きますが、**REST 的ではありません**。
ID のような**リソースの識別子**は、**パスに入れる**のが慣習です。

### 対処

```java
@GetMapping("/{id}")
public Book get(@PathVariable Long id) { ... }
```

「**取得対象を特定するキー = パス**」「**絞り込み条件 = クエリ**」と覚えましょう。

---

## 7. 同期と非同期の混乱

REST API のメソッドは、デフォルトで**同期**（呼び出しがブロックして結果を待つ）です。
重い処理を入れると、リクエストごとに**スレッドが食われる**ので、大量アクセスに弱くなります。

### 対処

- 第29章で学んだ **仮想スレッド**を有効化する（Spring Boot 3.2+ の `spring.threads.virtual.enabled: true`）
- **`CompletableFuture<T>`** や **`Mono<T>` / `Flux<T>`**（WebFlux）を返す書き方もある

入門段階では、ふつうの同期で書いて、必要になってから非同期を検討すれば大丈夫です。

---

## 8. Service と Controller の境界が曖昧

```java
@RestController
public class BookController {
    @GetMapping
    public List<BookResponse> list() {
        return bookRepository.findAll().stream()
            .map(BookResponse::from)
            .toList();
    }
}
```

これは小さい例なので OK ですが、ロジックが増えると、**コントローラがビジネスロジックを抱えがち**になります。

### 対処

- ビジネスロジックは **`@Service` クラスに集約**する
- コントローラは「**入力を受け取り、Service を呼び、出力を組み立てる**」だけにする
- これにより、テストもしやすく、SOLID の SRP にも沿う

```java
@RestController
public class BookController {
    private final BookService bookService;
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public List<BookResponse> list() {
        return bookService.listAll();           // ← 中身は Service
    }
}
```

---

## 9. CSV / 画像など、JSON 以外を返すとき

REST API は JSON だけのものではありません。
たとえば「CSV ダウンロード」を返す API もあります。

```java
@GetMapping(value = "/export", produces = "text/csv")
public ResponseEntity<byte[]> export() {
    byte[] csv = "id,title\n1,Java入門\n".getBytes(StandardCharsets.UTF_8);
    return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=books.csv")
        .body(csv);
}
```

`produces = "text/csv"` で、Content-Type を指定します。

「画像」「PDF」「Excel」も同じ要領です。
**`Content-Type` と `Content-Disposition`**を正しく指定するのが、ファイルダウンロード API のお作法です。

---

## 10. テストで HTTP を本当に叩く

REST API のテストで、本物の Tomcat を起動するのは重いです。

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class BookControllerTest {
    @Autowired TestRestTemplate restTemplate;     // 本物の HTTP で叩く
}
```

これは結合テストとして有効ですが、**遅い**です。

### 対処 ― `MockMvc`

```java
@SpringBootTest
@AutoConfigureMockMvc
class BookControllerTest {
    @Autowired MockMvc mockMvc;

    @Test
    void listsBooks() throws Exception {
        mockMvc.perform(get("/api/books"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").value("Java入門"));
    }
}
```

`MockMvc` は、**Tomcat を起動せず**に、コントローラだけを叩けます。
標準的な REST API のテストで、まず使えるようになるとよいパターンです。

---

## まとめ

- **エンティティを直接返さない**（DTO に変換）
- 双方向関連の **JSON 無限ループ**に注意
- `@PathVariable` / `@RequestParam` の**使い分け**を意識
- POST には **`Content-Type: application/json`** が必要
- **CORS** はブラウザのセキュリティ。許可設定が必要
- コントローラは薄く、ロジックは **`@Service`** に
- テストは **`MockMvc`** で軽量に

次は、この章で学んだ言葉を、用語集としてまとめます。
