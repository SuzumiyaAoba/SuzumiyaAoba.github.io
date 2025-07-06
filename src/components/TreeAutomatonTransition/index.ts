export interface TreeNode {
  id: string;
  label: string;
  state?: string;
  color?: string;
}

export interface TreeEdge {
  from: string;
  to: string;
  label?: string;
  color?: string;
}

export interface TransitionStep {
  nodes: TreeNode[];
  edges: TreeEdge[];
  description: string;
  stepNumber: number;
}

export interface TreeAutomatonTransitionProps {
  steps?: TransitionStep[];
  width?: string;
  height?: string;
  fontSize?: number;
  className?: string;
  showStepIndicator?: boolean;
  showDescription?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export { default as TreeAutomatonTransition } from '../TreeAutomatonTransition'; 