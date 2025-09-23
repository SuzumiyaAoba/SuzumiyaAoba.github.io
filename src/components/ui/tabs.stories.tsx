import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import type { Meta, StoryObj } from "@storybook/nextjs";

const TabsComponent = (props: React.ComponentProps<typeof Tabs>) => <Tabs {...props} />;

export default {
  title: "Components/Ui/Tabs",
  component: TabsComponent,
} satisfies Meta<typeof TabsComponent>;

type Story = StoryObj<typeof TabsComponent>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
    </Tabs>
  ),
};
