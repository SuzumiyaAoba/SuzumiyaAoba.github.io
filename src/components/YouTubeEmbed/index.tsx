'use client';

import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

export interface YouTubeEmbedProps {
  id: string;
  title?: string;
}

export const YouTubeEmbed = ({ id, title = "YouTube video" }: YouTubeEmbedProps) => {
  return (
    <div className="my-6">
      <LiteYouTubeEmbed
        id={id}
        title={title}
      />
    </div>
  );
};
