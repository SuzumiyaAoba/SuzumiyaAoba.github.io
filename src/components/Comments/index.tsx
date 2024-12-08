"use client";

import Giscus from "@giscus/react";

export const Comments = () => {
  return (
    <Giscus
      id="comments"
      repo="SuzumiyaAoba/comments"
      repoId="R_kgDONaoFSA"
      category="Announcements"
      categoryId="DIC_kwDONaoFSM4ClCYN"
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
