import type { MDXComponents } from "mdx/types";
import React from "react";
import { VisDotGraph, TreeNode } from "@/components/VisDotGraph";
import TreeAutomatonTransition, {
  TransitionStep,
} from "@/components/TreeAutomatonTransition";
import { TweetCard } from "@/components/TweetCard";
import { Img } from "@/components/Mdx/Img";

// VisDotGraphコンポーネントをMDXで使用するためのラッパー
const VisDotGraphMDX: React.FC<{
  data:
    | TreeNode
    | {
        nodes: TreeNode[];
        edges?: Array<{
          from: string;
          to: string;
          label?: string;
          color?: string;
          style?: string;
          width?: number;
        }>;
      };
  width?: string;
  height?: string;
  className?: string;
}> = ({ data, width = "100%", height = "400px", className = "" }) => {
  return (
    <VisDotGraph
      data={data}
      width={width}
      height={height}
      className={className}
    />
  );
};

// TreeAutomatonTransitionコンポーネントをMDXで使用するためのラッパー
const TreeAutomatonTransitionMDX: React.FC<{
  steps: TransitionStep[];
  width?: string;
  height?: string;
  fontSize?: number;
}> = ({ steps, width = "800px", height = "400px", fontSize = 16 }) => {
  return (
    <TreeAutomatonTransition
      steps={steps}
      width={width}
      height={height}
      fontSize={fontSize}
    />
  );
};

// デフォルトのMDXコンポーネント
const defaultComponents: MDXComponents = {
  // Markdownの画像にzoom機能を追加
  img: Img as any,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
    VisDotGraph: VisDotGraphMDX,
    TreeAutomatonTransition: TreeAutomatonTransitionMDX,
    TweetCard,
  };
}
