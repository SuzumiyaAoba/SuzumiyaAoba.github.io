import type { Meta, StoryObj } from '@storybook/react';
import { VisDotGraph } from './index';

const meta: Meta<typeof VisDotGraph> = {
  title: 'Components/VisDotGraph',
  component: VisDotGraph,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'JSONオブジェクトによるグラフデータ',
    },
    width: {
      control: 'text',
      description: 'グラフの幅',
    },
    height: {
      control: 'text',
      description: 'グラフの高さ',
    },
    className: {
      control: 'text',
      description: '追加のCSSクラス',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 木構造（状態付き）
export const TreeStructure: Story = {
  args: {
    data: {
      id: "root",
      label: "ルート",
      state: "開始",
      color: "lightblue",
      children: [
        {
          id: "child1",
          label: "子1",
          state: "処理中",
          color: "lightgreen",
          children: [
            {
              id: "grandchild1",
              label: "孫1",
              state: "完了",
              color: "lightcoral"
            },
            {
              id: "grandchild2",
              label: "孫2",
              state: "待機",
              color: "lightyellow"
            }
          ]
        },
        {
          id: "child2",
          label: "子2",
          state: "エラー",
          color: "lightpink",
          children: [
            {
              id: "grandchild3",
              label: "孫3",
              state: "再試行",
              color: "lightgray"
            }
          ]
        }
      ]
    },
    width: '600px',
    height: '400px',
  },
};

// ファイルシステム構造（状態付き）
export const FileSystem: Story = {
  args: {
    data: {
      id: "root",
      label: "/",
      state: "アクティブ",
      color: "lightblue",
      children: [
        {
          id: "home",
          label: "home",
          state: "読み取り専用",
          color: "lightgreen",
          children: [
            {
              id: "user",
              label: "user",
              state: "書き込み可能",
              color: "lightyellow",
              children: [
                {
                  id: "documents",
                  label: "Documents",
                  state: "同期中",
                  color: "lightcoral"
                },
                {
                  id: "downloads",
                  label: "Downloads",
                  state: "ダウンロード中",
                  color: "lightpink"
                }
              ]
            }
          ]
        }
      ]
    },
    width: '600px',
    height: '400px',
  },
};

// 組織構造図（状態付き）
export const Organization: Story = {
  args: {
    data: {
      id: "ceo",
      label: "CEO",
      state: "在席",
      color: "gold",
      children: [
        {
          id: "cto",
          label: "CTO",
          state: "会議中",
          color: "lightblue",
          children: [
            {
              id: "dev1",
              label: "開発者1",
              state: "コーディング中",
              color: "lightcoral"
            },
            {
              id: "dev2",
              label: "開発者2",
              state: "レビュー中",
              color: "lightpink"
            },
            {
              id: "dev3",
              label: "開発者3",
              state: "休憩中",
              color: "lightyellow"
            }
          ]
        },
        {
          id: "cfo",
          label: "CFO",
          state: "出張中",
          color: "lightgreen"
        }
      ]
    },
    width: '700px',
    height: '500px',
  },
};

// 状態遷移図（JSON形式）
export const StateTransition: Story = {
  args: {
    data: {
      nodes: [
        { id: "idle", label: "待機状態", state: "アクティブ", color: "lightblue" },
        { id: "working", label: "作業中", state: "処理中", color: "yellow" },
        { id: "completed", label: "完了", state: "成功", color: "green" },
        { id: "error", label: "エラー", state: "失敗", color: "red" }
      ],
      edges: [
        { from: "idle", to: "working", label: "開始" },
        { from: "working", to: "completed", label: "成功" },
        { from: "working", to: "error", label: "失敗" },
        { from: "error", to: "idle", label: "リセット" },
        { from: "completed", to: "idle", label: "リセット" }
      ]
    },
    width: '700px',
    height: '500px',
  },
};

// オートマトン（状態表示）
export const Automaton: Story = {
  args: {
    data: {
      nodes: [
        { id: "q0", label: "q₀", state: "初期状態", shape: "circle" },
        { id: "q1", label: "q₁", state: "処理中", shape: "circle" },
        { id: "q2", label: "q₂", state: "検証中", shape: "circle" },
        { id: "q3", label: "q₃", state: "受理状態", shape: "doublecircle" }
      ],
      edges: [
        { from: "q0", to: "q1", label: "a" },
        { from: "q1", to: "q2", label: "b" },
        { from: "q2", to: "q3", label: "c" },
        { from: "q0", to: "q3", label: "ε" },
        { from: "q1", to: "q1", label: "a" },
        { from: "q2", to: "q0", label: "b" }
      ]
    },
    width: '700px',
    height: '500px',
  },
};

// 基本的なグラフ（状態付き）
export const BasicGraph: Story = {
  args: {
    data: {
      nodes: [
        { id: "a", label: "Node A", state: "アクティブ", color: "lightblue" },
        { id: "b", label: "Node B", state: "待機中", color: "lightgreen" },
        { id: "c", label: "Node C", state: "完了", color: "lightcoral" }
      ],
      edges: [
        { from: "a", to: "b", label: "Edge 1" },
        { from: "b", to: "c", label: "Edge 2" },
        { from: "a", to: "c", label: "Edge 3" }
      ]
    },
    width: '600px',
    height: '400px',
  },
};

// エラーケース
export const ErrorCase: Story = {
  args: {
    data: null as any,
    width: '600px',
    height: '400px',
  },
  parameters: {
    docs: {
      description: {
        story: '無効なデータ（null）を渡した場合のエラーハンドリングをテストします。',
      },
    },
  },
};

// 空のグラフ
export const EmptyGraph: Story = {
  args: {
    data: { nodes: [], edges: [] },
    width: '600px',
    height: '400px',
  },
};

// 複雑なグラフ（状態付き）
export const ComplexGraph: Story = {
  args: {
    data: {
      nodes: [
        { id: "input", label: "入力", state: "受信済み", color: "lightgreen" },
        { id: "validate", label: "検証", state: "処理中", color: "yellow" },
        { id: "process", label: "処理", state: "実行中", color: "lightblue" },
        { id: "output", label: "出力", state: "送信済み", color: "lightcoral" },
        { id: "log", label: "ログ", state: "記録中", color: "gray" }
      ],
      edges: [
        { from: "input", to: "validate", label: "データ" },
        { from: "validate", to: "process", label: "有効" },
        { from: "validate", to: "log", label: "無効" },
        { from: "process", to: "output", label: "結果" },
        { from: "process", to: "log", label: "エラー" },
        { from: "output", to: "log", label: "完了" }
      ]
    },
    width: '800px',
    height: '600px',
  },
};

export const WithoutCircles = {
  args: {
    data: {
      nodes: [
        { id: '1', label: 'A', state: 'q0', hideCircle: true },
        { id: '2', label: 'B', state: 'q1', hideCircle: true },
        { id: '3', label: 'C', state: 'q2', hideCircle: true },
        { id: '4', label: 'D', state: 'q3', hideCircle: true }
      ],
      edges: [
        { source: '1', target: '2', label: 'a' },
        { source: '2', target: '3', label: 'b' },
        { source: '3', target: '4', label: 'c' },
        { source: '1', target: '4', label: 'd' }
      ]
    },
    width: 600,
    height: 400
  }
};

export const WithMathLabels = {
  args: {
    data: {
      nodes: [
        { id: '1', label: 'q_0', state: '初期状態', hideCircle: true },
        { id: '2', label: 'q_1', state: '処理中', hideCircle: true },
        { id: '3', label: 'q_2', state: '検証中', hideCircle: true },
        { id: '4', label: 'q_3', state: '受理状態', hideCircle: true }
      ],
      edges: [
        { source: '1', target: '2', label: 'a' },
        { source: '2', target: '3', label: 'b' },
        { source: '3', target: '4', label: 'c' },
        { source: '1', target: '4', label: 'ε' },
        { source: '1', target: '1', label: 'a*' },
        { source: '2', target: '0', label: 'b*' }
      ]
    },
    width: 600,
    height: 400
  }
};

export const WithComplexMath = {
  args: {
    data: {
      nodes: [
        { id: '1', label: 'q_0', state: '初期状態', hideCircle: true },
        { id: '2', label: 'q_1', state: '処理中', hideCircle: true },
        { id: '3', label: 'q_2', state: '検証中', hideCircle: true },
        { id: '4', label: 'q_3', state: '受理状態', hideCircle: true }
      ],
      edges: [
        { source: '1', target: '2', label: 'a' },
        { source: '2', target: '3', label: 'b' },
        { source: '3', target: '4', label: 'c' },
        { source: '1', target: '4', label: 'ε' },
        { source: '1', target: '1', label: 'a*' },
        { source: '2', target: '0', label: 'b*' }
      ]
    },
    width: 600,
    height: 400
  }
};

export const SimpleMathTest = {
  args: {
    data: {
      nodes: [
        { id: '1', label: 'q_0', state: '初期状態', hideCircle: true },
        { id: '2', label: 'q_1', state: '処理中', hideCircle: true }
      ],
      edges: [
        { source: '1', target: '2', label: 'a' }
      ]
    },
    width: 400,
    height: 300
  }
};

export const MathTest = {
  args: {
    data: {
      nodes: [
        { id: '1', label: 'q_0', state: '初期状態', hideCircle: true },
        { id: '2', label: 'q_1', state: '処理中', hideCircle: true }
      ],
      edges: [
        { source: '1', target: '2', label: 'a' }
      ]
    },
    width: 400,
    height: 300
  }
};

export const MathTestWithDollar = {
  args: {
    data: {
      nodes: [
        { id: '1', label: '$q_0$', state: '初期状態', hideCircle: true },
        { id: '2', label: '$q_1$', state: '処理中', hideCircle: true }
      ],
      edges: [
        { source: '1', target: '2', label: '$a$' }
      ]
    },
    width: 400,
    height: 300
  }
};

export const LargeFont = {
  args: {
    data: {
      nodes: [
        { id: '1', label: 'q_0', state: '初期状態', hideCircle: true },
        { id: '2', label: 'q_1', state: '処理中', hideCircle: true },
        { id: '3', label: 'q_2', state: '検証中', hideCircle: true },
        { id: '4', label: 'q_3', state: '受理状態', hideCircle: true }
      ],
      edges: [
        { source: '1', target: '2', label: 'a' },
        { source: '2', target: '3', label: 'b' },
        { source: '3', target: '4', label: 'c' },
        { source: '1', target: '4', label: 'ε' }
      ]
    },
    width: 600,
    height: 400,
    fontSize: 18
  }
};

export const SmallFont = {
  args: {
    data: {
      nodes: [
        { id: '1', label: 'q_0', state: '初期状態', hideCircle: true },
        { id: '2', label: 'q_1', state: '処理中', hideCircle: true },
        { id: '3', label: 'q_2', state: '検証中', hideCircle: true },
        { id: '4', label: 'q_3', state: '受理状態', hideCircle: true }
      ],
      edges: [
        { source: '1', target: '2', label: 'a' },
        { source: '2', target: '3', label: 'b' },
        { source: '3', target: '4', label: 'c' },
        { source: '1', target: '4', label: 'ε' }
      ]
    },
    width: 600,
    height: 400,
    fontSize: 8
  }
}; 