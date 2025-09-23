
// 開発環境用Pagefindスタブファイル
const search = async (query) => {
  console.log('[開発環境] 検索クエリ:', query);
  
  // 開発環境用サンプルデータ
  const sampleResults = [
    {
      url: "/blog/2023-09-30-astro/",
      meta: { title: "Astroを使ったブログサイトの構築" },
      excerpt: "Astroは<mark>静的</mark>サイトジェネレーターで、高速なウェブサイト構築に適しています。",
    },
    {
      url: "/blog/2024-11-17-scala-rebeginning/",
      meta: { title: "Scalaの再学習" },
      excerpt: "関数型プログラミング言語<mark>Scala</mark>の基本から応用まで解説します。",
    },
    {
      url: "/blog/2024-10-14-tmux-with-nix/",
      meta: { title: "Nixでtmux環境を構築する" },
      excerpt: "<mark>tmux</mark>と<mark>Nix</mark>を組み合わせた開発環境の構築方法について。",
    }
  ];
  
  // クエリに基づいてフィルタリング（空の場合は全て返す）
  const results = query.trim() 
    ? sampleResults.filter(r => 
        r.url.toLowerCase().includes(query.toLowerCase()) || 
        r.meta.title.toLowerCase().includes(query.toLowerCase()) ||
        r.excerpt.toLowerCase().includes(query.toLowerCase())
      )
    : [];
    
  return {
    results: results.map(result => ({
      id: result.url,
      score: 1.0,
      data: async () => result
    })),
    term: query,
    total: results.length
  };
};

const debouncedSearch = async (query, options, debounceTimeoutMs) => search(query);
const filters = async () => ({});
const destroy = async () => {};
const init = async () => {};
const mergeIndex = async () => {};
const options = async () => {};
const preload = async () => {};

export { search, debouncedSearch, filters, destroy, init, mergeIndex, options, preload };

console.log('[開発環境] Pagefindスタブがロードされました');
