import type { Meta, StoryObj } from '@storybook/react';
import TreeAutomatonTransition, { TransitionStep } from './TreeAutomatonTransition';

const meta: Meta<typeof TreeAutomatonTransition> = {
  title: 'Components/TreeAutomatonTransition',
  component: TreeAutomatonTransition,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    autoPlay: {
      control: 'boolean',
      description: '自動再生機能を有効にする',
    },
    autoPlayInterval: {
      control: { type: 'number', min: 500, max: 5000, step: 100 },
      description: '自動再生の間隔（ミリ秒）',
    },
    showStepIndicator: {
      control: 'boolean',
      description: 'ステップインジケーターを表示する',
    },
    showDescription: {
      control: 'boolean',
      description: 'ステップ説明を表示する',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleSteps: TransitionStep[] = [
  {
    stepNumber: 1,
    description: "初期状態：すべてのノードに初期状態 q_init が割り当てられています",
    nodes: [
      { id: "if_root", label: "$\\mathrm{if}$", state: "$q_\\mathit{init}$" },
      { id: "and_cond", label: "$\\mathrm{and}$", state: "$q_\\mathit{init}$" },
      { id: "true_cond", label: "$\\mathrm{true}$", state: "$q_\\mathit{init}$" },
      { id: "or_cond", label: "$\\mathrm{or}$", state: "$q_\\mathit{init}$" },
      { id: "false_or", label: "$\\mathrm{false}$", state: "$q_\\mathit{init}$" },
      { id: "true_or", label: "$\\mathrm{true}$", state: "$q_\\mathit{init}$" },
      { id: "plus_true", label: "$\\mathrm{+}$", state: "$q_\\mathit{init}$" },
      { id: "num1", label: "$\\mathrm{1}$", state: "$q_\\mathit{init}$" },
      { id: "num2", label: "$\\mathrm{2}$", state: "$q_\\mathit{init}$" },
    ],
    edges: [
      { from: "if_root", to: "and_cond", label: "条件", color: "red" },
      { from: "if_root", to: "plus_true", label: "真の分岐", color: "green" },
      { from: "and_cond", to: "true_cond", label: "左", color: "black" },
      { from: "and_cond", to: "or_cond", label: "右", color: "black" },
      { from: "or_cond", to: "false_or", label: "左", color: "black" },
      { from: "or_cond", to: "true_or", label: "右", color: "black" },
      { from: "plus_true", to: "num1", label: "左", color: "black" },
      { from: "plus_true", to: "num2", label: "右", color: "black" },
    ]
  },
  {
    stepNumber: 2,
    description: "リーフノードの状態を確定：true, false, 1, 2 のノードに適切な状態を割り当て",
    nodes: [
      { id: "if_root", label: "$\\mathrm{if}$", state: "$q_\\mathit{init}$" },
      { id: "and_cond", label: "$\\mathrm{and}$", state: "$q_\\mathit{init}$" },
      { id: "true_cond", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "or_cond", label: "$\\mathrm{or}$", state: "$q_\\mathit{init}$" },
      { id: "false_or", label: "$\\mathrm{false}$", state: "$q_\\mathit{bool}$" },
      { id: "true_or", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "plus_true", label: "$\\mathrm{+}$", state: "$q_\\mathit{init}$" },
      { id: "num1", label: "$\\mathrm{1}$", state: "$q_\\mathit{int}$" },
      { id: "num2", label: "$\\mathrm{2}$", state: "$q_\\mathit{int}$" },
    ],
    edges: [
      { from: "if_root", to: "and_cond", label: "条件", color: "red" },
      { from: "if_root", to: "plus_true", label: "真の分岐", color: "green" },
      { from: "and_cond", to: "true_cond", label: "左", color: "black" },
      { from: "and_cond", to: "or_cond", label: "右", color: "black" },
      { from: "or_cond", to: "false_or", label: "左", color: "black" },
      { from: "or_cond", to: "true_or", label: "右", color: "black" },
      { from: "plus_true", to: "num1", label: "左", color: "black" },
      { from: "plus_true", to: "num2", label: "右", color: "black" },
    ]
  },
  {
    stepNumber: 3,
    description: "OR演算の評価：false OR true の結果が q_bool として計算される",
    nodes: [
      { id: "if_root", label: "$\\mathrm{if}$", state: "$q_\\mathit{init}$" },
      { id: "and_cond", label: "$\\mathrm{and}$", state: "$q_\\mathit{init}$" },
      { id: "true_cond", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "or_cond", label: "$\\mathrm{or}$", state: "$q_\\mathit{bool}$" },
      { id: "false_or", label: "$\\mathrm{false}$", state: "$q_\\mathit{bool}$" },
      { id: "true_or", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "plus_true", label: "$\\mathrm{+}$", state: "$q_\\mathit{init}$" },
      { id: "num1", label: "$\\mathrm{1}$", state: "$q_\\mathit{int}$" },
      { id: "num2", label: "$\\mathrm{2}$", state: "$q_\\mathit{int}$" },
    ],
    edges: [
      { from: "if_root", to: "and_cond", label: "条件", color: "red" },
      { from: "if_root", to: "plus_true", label: "真の分岐", color: "green" },
      { from: "and_cond", to: "true_cond", label: "左", color: "black" },
      { from: "and_cond", to: "or_cond", label: "右", color: "black" },
      { from: "or_cond", to: "false_or", label: "左", color: "black" },
      { from: "or_cond", to: "true_or", label: "右", color: "black" },
      { from: "plus_true", to: "num1", label: "左", color: "black" },
      { from: "plus_true", to: "num2", label: "右", color: "black" },
    ]
  },
  {
    stepNumber: 4,
    description: "AND演算の評価：true AND (false OR true) の結果が q_bool として計算される",
    nodes: [
      { id: "if_root", label: "$\\mathrm{if}$", state: "$q_\\mathit{init}$" },
      { id: "and_cond", label: "$\\mathrm{and}$", state: "$q_\\mathit{bool}$" },
      { id: "true_cond", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "or_cond", label: "$\\mathrm{or}$", state: "$q_\\mathit{bool}$" },
      { id: "false_or", label: "$\\mathrm{false}$", state: "$q_\\mathit{bool}$" },
      { id: "true_or", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "plus_true", label: "$\\mathrm{+}$", state: "$q_\\mathit{init}$" },
      { id: "num1", label: "$\\mathrm{1}$", state: "$q_\\mathit{int}$" },
      { id: "num2", label: "$\\mathrm{2}$", state: "$q_\\mathit{int}$" },
    ],
    edges: [
      { from: "if_root", to: "and_cond", label: "条件", color: "red" },
      { from: "if_root", to: "plus_true", label: "真の分岐", color: "green" },
      { from: "and_cond", to: "true_cond", label: "左", color: "black" },
      { from: "and_cond", to: "or_cond", label: "右", color: "black" },
      { from: "or_cond", to: "false_or", label: "左", color: "black" },
      { from: "or_cond", to: "true_or", label: "右", color: "black" },
      { from: "plus_true", to: "num1", label: "左", color: "black" },
      { from: "plus_true", to: "num2", label: "右", color: "black" },
    ]
  },
  {
    stepNumber: 5,
    description: "加算演算の評価：1 + 2 の結果が q_int として計算される",
    nodes: [
      { id: "if_root", label: "$\\mathrm{if}$", state: "$q_\\mathit{init}$" },
      { id: "and_cond", label: "$\\mathrm{and}$", state: "$q_\\mathit{bool}$" },
      { id: "true_cond", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "or_cond", label: "$\\mathrm{or}$", state: "$q_\\mathit{bool}$" },
      { id: "false_or", label: "$\\mathrm{false}$", state: "$q_\\mathit{bool}$" },
      { id: "true_or", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "plus_true", label: "$\\mathrm{+}$", state: "$q_\\mathit{int}$" },
      { id: "num1", label: "$\\mathrm{1}$", state: "$q_\\mathit{int}$" },
      { id: "num2", label: "$\\mathrm{2}$", state: "$q_\\mathit{int}$" },
    ],
    edges: [
      { from: "if_root", to: "and_cond", label: "条件", color: "red" },
      { from: "if_root", to: "plus_true", label: "真の分岐", color: "green" },
      { from: "and_cond", to: "true_cond", label: "左", color: "black" },
      { from: "and_cond", to: "or_cond", label: "右", color: "black" },
      { from: "or_cond", to: "false_or", label: "左", color: "black" },
      { from: "or_cond", to: "true_or", label: "右", color: "black" },
      { from: "plus_true", to: "num1", label: "左", color: "black" },
      { from: "plus_true", to: "num2", label: "右", color: "black" },
    ]
  },
  {
    stepNumber: 6,
    description: "最終状態：if文の条件が q_bool で真のため、真の分岐 q_int が選択される",
    nodes: [
      { id: "if_root", label: "$\\mathrm{if}$", state: "$q_\\mathit{int}$" },
      { id: "and_cond", label: "$\\mathrm{and}$", state: "$q_\\mathit{bool}$" },
      { id: "true_cond", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "or_cond", label: "$\\mathrm{or}$", state: "$q_\\mathit{bool}$" },
      { id: "false_or", label: "$\\mathrm{false}$", state: "$q_\\mathit{bool}$" },
      { id: "true_or", label: "$\\mathrm{true}$", state: "$q_\\mathit{bool}$" },
      { id: "plus_true", label: "$\\mathrm{+}$", state: "$q_\\mathit{int}$" },
      { id: "num1", label: "$\\mathrm{1}$", state: "$q_\\mathit{int}$" },
      { id: "num2", label: "$\\mathrm{2}$", state: "$q_\\mathit{int}$" },
    ],
    edges: [
      { from: "if_root", to: "and_cond", label: "条件", color: "red" },
      { from: "if_root", to: "plus_true", label: "真の分岐", color: "green" },
      { from: "and_cond", to: "true_cond", label: "左", color: "black" },
      { from: "and_cond", to: "or_cond", label: "右", color: "black" },
      { from: "or_cond", to: "false_or", label: "左", color: "black" },
      { from: "or_cond", to: "true_or", label: "右", color: "black" },
      { from: "plus_true", to: "num1", label: "左", color: "black" },
      { from: "plus_true", to: "num2", label: "右", color: "black" },
    ]
  }
];

export const Default: Story = {
  args: {
    steps: sampleSteps,
    width: "800px",
    height: "400px",
    fontSize: 16,
  },
};

export const SmallSize: Story = {
  args: {
    steps: sampleSteps,
    width: "600px",
    height: "300px",
    fontSize: 14,
  },
};

export const LargeSize: Story = {
  args: {
    steps: sampleSteps,
    width: "1000px",
    height: "500px",
    fontSize: 18,
  },
};

export const WithAutoPlay: Story = {
  args: {
    steps: sampleSteps,
    width: "800px",
    height: "400px",
    fontSize: 16,
    autoPlay: true,
    autoPlayInterval: 1500,
  },
};

export const WithoutStepIndicator: Story = {
  args: {
    steps: sampleSteps,
    width: "800px",
    height: "400px",
    fontSize: 16,
    showStepIndicator: false,
  },
};

export const WithoutDescription: Story = {
  args: {
    steps: sampleSteps,
    width: "800px",
    height: "400px",
    fontSize: 16,
    showDescription: false,
  },
};

export const Minimal: Story = {
  args: {
    steps: sampleSteps,
    width: "800px",
    height: "400px",
    fontSize: 16,
    showStepIndicator: false,
    showDescription: false,
  },
};

export const FastAutoPlay: Story = {
  args: {
    steps: sampleSteps,
    width: "800px",
    height: "400px",
    fontSize: 16,
    autoPlay: true,
    autoPlayInterval: 800,
  },
};

export const SlowAutoPlay: Story = {
  args: {
    steps: sampleSteps,
    width: "800px",
    height: "400px",
    fontSize: 16,
    autoPlay: true,
    autoPlayInterval: 3000,
  },
}; 