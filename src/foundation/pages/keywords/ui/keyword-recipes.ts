/** 一覧ページで紹介する、技法を組み合わせた作例。[category, subcategory, slug, 表示名] */
export const keywordRecipes = [
  {
    name: "曲がって飛ぶレーザー",
    english: "Curved laser",
    terms: [
      ["simulation", "curves", "cubic-hermite-curve", "エルミート曲線"],
      [
        "simulation",
        "curves",
        "arc-length-parameterization",
        "弧長パラメータ化",
      ],
      ["graphics", "particles", "ribbon", "リボン・トレイル"],
      ["graphics", "post", "bloom", "ブルーム"],
    ],
  },
  {
    name: "渦巻く煙",
    english: "Swirling smoke",
    terms: [
      ["graphics", "noise", "curl-noise", "カールノイズ"],
      [
        "simulation",
        "fluids",
        "semi-lagrangian-advection",
        "半ラグランジュ移流",
      ],
      ["graphics", "particles", "soft-particles", "ソフトパーティクル"],
    ],
  },
  {
    name: "融合するスライム",
    english: "Merging slime",
    terms: [
      ["graphics", "fields", "signed-distance-field", "符号付き距離場"],
      ["graphics", "fields", "smooth-union", "スムーズユニオン"],
      ["graphics", "lighting", "fresnel", "フレネル"],
    ],
  },
  {
    name: "自然に散らばる森林",
    english: "Natural forest",
    terms: [
      ["world", "sampling", "poisson-disk-sampling", "ポアソンディスク分布"],
      ["world", "generation", "density-masked-scattering", "密度マスク散布"],
      [
        "implementation",
        "performance",
        "gpu-instancing",
        "GPUインスタンシング",
      ],
    ],
  },
] as const;
