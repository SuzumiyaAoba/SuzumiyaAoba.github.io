import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const meta: Meta<typeof Card> = {
  title: "shared/Card",
  component: Card,
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Plan</CardTitle>
        <CardDescription>Basic plan for personal projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">$12</div>
        <p className="text-sm text-muted-foreground">per month</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Upgrade</Button>
      </CardFooter>
    </Card>
  ),
};
