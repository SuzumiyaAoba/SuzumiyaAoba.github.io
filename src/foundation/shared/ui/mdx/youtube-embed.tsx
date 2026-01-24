/**
 * YouTube 動画を埋め込むためのプロパティ
 */
export type YouTubeEmbedProps = {
  /** YouTube の動画 ID */
  id: string;
  /** iframe の title 属性に使用するタイトル */
  title?: string;
};

/**
 * YouTube 動画を MDX コンテンツ内に埋め込むためのコンポーネント。
 */
export function YouTubeEmbed({ id, title = "YouTube video" }: YouTubeEmbedProps) {
  return (
    <div className="my-6 aspect-video w-full">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
