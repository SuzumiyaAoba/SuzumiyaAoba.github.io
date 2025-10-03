import type { Meta, StoryObj } from "@storybook/react";
import { RakutenProductAdComponent } from "./RakutenProductAdComponent";

export default {
  title: "Components/Ads/Provider/Rakuten/RakutenProductAdComponent",
  component: RakutenProductAdComponent,
} satisfies Meta<typeof RakutenProductAdComponent>;

type Story = StoryObj<typeof RakutenProductAdComponent>;

export const Default: Story = {
  args: {
    productUrl: "https://example.com/product",
    imageUrl: "https://via.placeholder.com/64x64.png?text=Prod",
    productName: "Sample Product",
    price: 1234,
    priceDateTime: "2025/01/01 00:00",
    reviewCount: 10,
    trackerUrl: "https://via.placeholder.com/1x1.png",
  },
};
