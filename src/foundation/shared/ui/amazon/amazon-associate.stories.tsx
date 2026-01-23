import type { Meta, StoryObj } from "@storybook/react";

import { AmazonAssociate } from "@/shared/ui/amazon/amazon-associate";

const meta: Meta<typeof AmazonAssociate> = {
  title: "shared/amazon/AmazonAssociate",
  component: AmazonAssociate,
};

export default meta;

type Story = StoryObj<typeof AmazonAssociate>;

export const Default: Story = {};
