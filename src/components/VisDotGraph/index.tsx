'use client';

import React, { useState, useMemo } from 'react';
import { D3Graph } from './D3Graph';

export interface TreeNode {
  id: string;
  label: string;
  state?: string;
  color?: string;
  size?: number;
  shape?: string;
  children?: TreeNode[];
  [key: string]: any;
}

export interface GraphData {
  nodes: TreeNode[];
  edges?: Array<{
    from?: string;
    to?: string;
    source?: string;
    target?: string;
    label?: string;
    color?: string;
    style?: string;
    width?: number;
  }>;
}

interface VisDotGraphProps {
  data: GraphData | TreeNode; // 単一のルートノードまたはグラフデータ
  width?: string;
  height?: string;
  className?: string;
  fontSize?: number;
}

export const VisDotGraph: React.FC<VisDotGraphProps> = ({
  data,
  width = '100%',
  height = '400px',
  className = '',
  fontSize = 14,
}) => {
  const [error, setError] = useState<string | null>(null);

  // データの検証と正規化
  const normalizedData = useMemo(() => {
    try {
      // dataがundefinedまたはnullの場合
      if (!data) {
        throw new Error('データが提供されていません');
      }

      // 単一のルートノードの場合
      if ('id' in data && 'label' in data && !('nodes' in data)) {
        const result = {
          nodes: flattenTree(data as TreeNode),
          edges: [],
        };
        return result;
      }

      // グラフデータの場合
      if ('nodes' in data) {
        const graphData = data as GraphData;
        const result = {
          nodes: graphData.nodes,
          edges: graphData.edges || [],
        };
        return result;
      }

      throw new Error('無効なデータ形式です');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return { nodes: [], edges: [] };
    }
  }, [data]);

  // 木構造を平坦化する関数
  const flattenTree = (node: TreeNode): TreeNode[] => {
    const result: TreeNode[] = [node];
    if (node.children) {
      node.children.forEach(child => {
        result.push(...flattenTree(child));
      });
    }
    return result;
  };

  // 木構造からエッジを生成する関数
  const generateEdges = (node: TreeNode): Array<{ from: string; to: string; label?: string }> => {
    const edges: Array<{ from: string; to: string; label?: string }> = [];
    if (node.children) {
      node.children.forEach(child => {
        edges.push({
          from: node.id,
          to: child.id,
          label: child.state || '',
        });
        edges.push(...generateEdges(child));
      });
    }
    return edges;
  };

  // 単一ルートノードの場合、エッジを生成
  const finalData = useMemo(() => {
    if (!data) {
      return { nodes: [], edges: [] };
    }

    if ('id' in data && 'label' in data && !('nodes' in data)) {
      const rootNode = data as TreeNode;
      return {
        nodes: normalizedData.nodes,
        edges: generateEdges(rootNode),
      };
    }
    return normalizedData;
  }, [data, normalizedData]);

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          color: '#6b7280',
          fontFamily: 'monospace',
          fontSize: fontSize.toString() + 'px',
        }}
        className={className}
        role="region"
        aria-label="グラフ表示エリア"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>エラー:</div>
          <div>{error}</div>
          <div style={{ marginTop: '12px', fontSize: '12px' }}>
            データ: {JSON.stringify(data, null, 2)}
          </div>
        </div>
      </div>
    );
  }

  if (finalData.nodes.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          color: '#6b7280',
          fontFamily: 'monospace',
          fontSize: fontSize.toString() + 'px',
        }}
        className={className}
        role="region"
        aria-label="グラフ表示エリア"
      >
        データがありません
      </div>
    );
  }

  return (
    <D3Graph
      data={finalData}
      width={width}
      height={height}
      className={className}
      fontSize={fontSize}
    />
  );
}; 