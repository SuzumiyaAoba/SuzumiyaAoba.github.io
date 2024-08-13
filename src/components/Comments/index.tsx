"use client";

import Giscus from "@giscus/react";

export const Comments = () => {
  return (
    <Giscus
      id="comments"
      repo="SuzumiyaAoba/SuzumiyaAoba.github.io"
      repoId="R_kgDOMVzVAQ"
      category="Announcements"
      categoryId="DIC_kwDOMVzVAc4ChaeG"
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="1"
      inputPosition="top"
      theme="light"
      lang="ja"
      loading="lazy"
    />
  );
};
