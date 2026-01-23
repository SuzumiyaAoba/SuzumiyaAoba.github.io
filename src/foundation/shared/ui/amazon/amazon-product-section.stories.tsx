import type { Meta, StoryObj } from "@storybook/react";
import type { AffiliateProduct } from "@/shared/lib/affiliate-products";

import { AmazonProductSection } from "@/shared/ui/amazon/amazon-product-section";

const dummyProducts: AffiliateProduct[] = [
  {
    id: "1",
    title: "Example Product 1",
    productUrl: "https://example.com/1",
    imageUrl: "https://placehold.co/160x160",
    yahooShoppingUrl: "https://yahoo.co.jp/1",
  },
  {
    id: "2",
    title: "Example Product 2",
    productUrl: "https://example.com/2",
    imageUrl: "https://placehold.co/160x160",
  },
];

const meta: Meta<typeof AmazonProductSection> = {
  title: "shared/amazon/AmazonProductSection",
  component: AmazonProductSection,
  args: {
    products: dummyProducts,
  },
};

export default meta;

type Story = StoryObj<typeof AmazonProductSection>;

export const Default: Story = {};
