"use client";

import { Tweet } from "react-tweet";

export interface TweetCardProps {
  id: string;
}

export const TweetCard = ({ id }: TweetCardProps) => {
  return (
    <div className="flex justify-center my-6">
      <Tweet id={id} />
    </div>
  );
};
