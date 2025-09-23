import type { Meta, StoryObj } from "@storybook/nextjs";
import { A8netAdComponent } from "./A8netAdComponent";

export default {
  title: "Components/Ads/Provider/A8net/A8netAdComponent",
  component: A8netAdComponent,
} satisfies Meta<typeof A8netAdComponent>;

type Story = StoryObj<typeof A8netAdComponent>;

export const Default: Story = {
  args: {
    linkUrl: "https://example.com",
    imageUrl: "https://via.placeholder.com/300x250.png?text=Ad",
    trackerUrl: "https://via.placeholder.com/1x1.png",
    width: 300,
    height: 250,
    alt: "Sample Ad",
    withContainer: true,
    description: "Sample A8.net Ad",
  },
};
