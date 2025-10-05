import Script from "next/script";

export interface TweetCardProps {
  id: string;
}

async function getTweetEmbed(tweetId: string) {
  try {
    const url = `https://publish.twitter.com/oembed?url=https://twitter.com/x/status/${tweetId}&omit_script=true`;
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // キャッシュを1時間保持
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tweet: ${response.status}`);
    }

    const data = await response.json();
    return data.html as string;
  } catch (error) {
    console.error("Error fetching tweet embed:", error);
    return null;
  }
}

export const TweetCard = async ({ id }: TweetCardProps) => {
  const html = await getTweetEmbed(id);

  if (!html) {
    return (
      <div className="flex justify-center my-6">
        <div className="border rounded-lg p-4 text-center text-muted">
          ツイートの読み込みに失敗しました
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex justify-center my-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <Script
        async
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />
    </>
  );
};
