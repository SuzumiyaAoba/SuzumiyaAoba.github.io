"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as d3 from "d3";
import { TreeNode } from "./index";
import katex from "katex";

interface D3GraphProps {
  data: {
    nodes: TreeNode[];
    edges: Array<{
      from?: string;
      to?: string;
      source?: string;
      target?: string;
      label?: string;
      color?: string;
      style?: string;
      width?: number;
    }>;
  };
  width?: string;
  height?: string;
  className?: string;
  fontSize?: number;
}

interface DotNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  state?: string;
  shape?: string;
  color?: string;
  size?: number;
  [key: string]: any;
}

interface DotEdge extends d3.SimulationLinkDatum<DotNode> {
  from: string;
  to: string;
  label?: string;
  color?: string;
  style?: string;
  width?: number;
  [key: string]: any;
}

// 木構造かどうかを判定する関数
function isTreeStructure(nodes: DotNode[], edges: DotEdge[]): boolean {
  if (nodes.length === 0) return false;

  // 入次数を計算
  const inDegree = new Map<string, number>();
  nodes.forEach((node) => inDegree.set(node.id, 0));

  edges.forEach((edge) => {
    // from/to または source/target の両方に対応
    const target =
      typeof edge.target === "string"
        ? edge.target
        : typeof edge.to === "string"
          ? edge.to
          : (edge.target as any)?.id || (edge.to as any)?.id;
    if (target) {
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    }
  });

  // ルートノード（入次数0）が1つだけ存在するかチェック
  const roots = Array.from(inDegree.entries()).filter(
    ([_, degree]) => degree === 0,
  );
  if (roots.length !== 1) return false;

  // 全てのノードが到達可能かチェック
  const visited = new Set<string>();
  const queue = [roots[0][0]];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    edges.forEach((edge) => {
      const source =
        typeof edge.source === "string"
          ? edge.source
          : typeof edge.from === "string"
            ? edge.from
            : (edge.source as any)?.id || (edge.from as any)?.id;
      const target =
        typeof edge.target === "string"
          ? edge.target
          : typeof edge.to === "string"
            ? edge.to
            : (edge.target as any)?.id || (edge.to as any)?.id;
      if (source === current && target && !visited.has(target)) {
        queue.push(target);
      }
    });
  }

  return visited.size === nodes.length;
}

// 木構造の階層データを作成する関数
function createHierarchy(
  nodes: DotNode[],
  edges: DotEdge[],
): d3.HierarchyNode<any> | null {
  if (nodes.length === 0) return null;

  // 入次数を計算してルートを特定
  const inDegree = new Map<string, number>();
  nodes.forEach((node) => inDegree.set(node.id, 0));

  edges.forEach((edge) => {
    // from/to または source/target の両方に対応
    const target =
      typeof edge.target === "string"
        ? edge.target
        : typeof edge.to === "string"
          ? edge.to
          : (edge.target as any)?.id || (edge.to as any)?.id;
    if (target) {
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    }
  });

  const rootId = Array.from(inDegree.entries()).find(
    ([_, degree]) => degree === 0,
  )?.[0];
  if (!rootId) return null;

  // ノードマップを作成
  const nodeMap = new Map<string, any>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      ...node,
      children: [],
    });
  });

  // エッジから親子関係を構築
  edges.forEach((edge) => {
    const source =
      typeof edge.source === "string"
        ? edge.source
        : typeof edge.from === "string"
          ? edge.from
          : (edge.source as any)?.id || (edge.from as any)?.id;
    const target =
      typeof edge.target === "string"
        ? edge.target
        : typeof edge.to === "string"
          ? edge.to
          : (edge.target as any)?.id || (edge.to as any)?.id;

    if (source && target) {
      const parent = nodeMap.get(source);
      const child = nodeMap.get(target);

      if (parent && child) {
        parent.children.push(child);
      }
    }
  });

  return d3.hierarchy(nodeMap.get(rootId));
}

const renderMath = (text: string): string => {
  try {
    return text.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        return katex.renderToString(math, {
          throwOnError: false,
          displayMode: false,
          strict: false,
        });
      } catch (error) {
        console.warn("KaTeX rendering error:", error);
        return match;
      }
    });
  } catch (error) {
    console.warn("Math rendering error:", error);
    return text;
  }
};

export const D3Graph: React.FC<D3GraphProps> = ({
  data,
  width = "100%",
  height = "400px",
  className = "",
  fontSize = 12,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // コンポーネントのマウント状態を管理
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // データの変換
  const parsedData = useMemo(() => {
    try {
      if (!data) {
        throw new Error("データが提供されていません");
      }

      const nodes: DotNode[] = data.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        state: node.state,
        shape: node.shape || "circle",
        color: node.color || "#97C2FC",
        size: node.size || 8,
      }));

      const edges: DotEdge[] = data.edges.map((edge) => ({
        source: edge.from || edge.source || "",
        target: edge.to || edge.target || "",
        from: edge.from || edge.source || "",
        to: edge.to || edge.target || "",
        label: edge.label || "",
        color: edge.color || "#2B7CE9",
        style: edge.style || "solid",
        width: edge.width || 2,
      }));

      const result = { nodes, edges };
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return { nodes: [], edges: [] };
    }
  }, [data]);

  // 木構造かどうかを判定
  const isTree = useMemo(() => {
    return isTreeStructure(parsedData.nodes, parsedData.edges);
  }, [parsedData]);

  // 階層データを作成
  const hierarchy = useMemo(() => {
    if (!isTree) {
      return null;
    }
    return createHierarchy(parsedData.nodes, parsedData.edges);
  }, [parsedData, isTree]);

  // グラフの描画
  const renderGraph = useCallback(() => {
    if (!containerRef.current || !isClient || !isMountedRef.current) {
      return;
    }

    try {
      // 既存のSVGをクリア
      d3.select(containerRef.current).selectAll("*").remove();

      if (parsedData.nodes.length === 0) {
        return;
      }

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const graphWidth = containerRect.width;
      const graphHeight = containerRect.height;

      // SVGを作成
      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", graphWidth)
        .attr("height", graphHeight);

      if (isTree && hierarchy) {
        // 木構造の場合は階層レイアウトを使用
        renderTreeLayout(svg, hierarchy, graphWidth, graphHeight);
      } else {
        // 一般グラフの場合はフォースレイアウトを使用
        renderForceLayout(svg, parsedData, graphWidth, graphHeight);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`グラフ描画エラー: ${errorMessage}`);
      }
    }
  }, [parsedData, isTree, hierarchy, isClient, fontSize]);

  // 木構造レイアウトの描画
  const renderTreeLayout = useCallback(
    (
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      hierarchy: d3.HierarchyNode<any>,
      width: number,
      height: number,
    ) => {
      // 階層レイアウトを作成（上から下への向き）
      const treeLayout = d3
        .tree<any>()
        .size([width - 100, height - 100])
        .separation((a, b) => {
          // ノード間の距離を調整
          return (a.parent === b.parent ? 1 : 1.2) / 2;
        });

      const root = treeLayout(hierarchy);

      // リンクを描画（ノードの下から上へ）
      const links = svg
        .append("g")
        .attr("transform", "translate(50,50)")
        .selectAll("line")
        .data(root.links())
        .enter()
        .append("line")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y + 20) // 親ノードの下から
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y - 20) // 子ノードの上から
        .attr("stroke", "#2B7CE9")
        .attr("stroke-width", 2)
        .attr("fill", "none");

      // ノードグループを作成
      const nodeGroups = svg
        .append("g")
        .attr("transform", "translate(50,50)")
        .selectAll("g")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      // ノードを描画（丸を非表示）
      const nodes = nodeGroups
        .append("circle")
        .attr("r", (d: any) => d.data.size || 8)
        .attr("fill", (d: any) => d.data.color || "#97C2FC")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("opacity", 0); // 丸を完全に非表示

      // ラベルを描画（状態情報を含む）
      const labels = nodeGroups
        .append("foreignObject")
        .attr("width", 120)
        .attr("height", 40)
        .attr("x", -60)
        .attr("y", -20)
        .append("xhtml:div")
        .style("text-align", "center")
        .style("font-size", `${fontSize}px`)
        .style("font-weight", "bold")
        .style("color", "#333")
        .style("pointer-events", "none")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("height", "100%")
        .each(function (d: any) {
          const div = d3.select(this);
          const label = d.data.label;
          const state = d.data.state;
          const displayText = state ? `${state} (${label})` : `(${label})`;

          try {
            const renderedText = renderMath(displayText);
            div.html(renderedText);
          } catch (error) {
            console.error("KaTeX rendering error:", error);
            div.text(displayText);
          }
        });
    },
    [fontSize],
  );

  // フォースレイアウトの描画
  const renderForceLayout = useCallback(
    (
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      data: { nodes: DotNode[]; edges: DotEdge[] },
      width: number,
      height: number,
    ) => {
      // シミュレーションを作成
      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3
            .forceLink(data.edges)
            .id((d: any) => d.id)
            .distance(100),
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

      // リンクを描画
      const links = svg
        .append("g")
        .selectAll("line")
        .data(data.edges)
        .enter()
        .append("line")
        .attr("stroke", (d: any) => d.color || "#2B7CE9")
        .attr("stroke-width", (d: any) => d.width || 2)
        .attr("fill", "none");

      // ノードグループを作成
      const nodeGroups = svg
        .append("g")
        .selectAll("g")
        .data(data.nodes)
        .enter()
        .append("g")
        .call(
          (d3.drag() as any)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended),
        );

      // ノードを描画
      const nodes = nodeGroups
        .append("circle")
        .attr("r", (d: DotNode) => d.size || 8)
        .attr("fill", (d: DotNode) => d.color || "#97C2FC")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      // ラベルを描画
      const labels = nodeGroups
        .append("foreignObject")
        .attr("width", 120)
        .attr("height", 40)
        .attr("x", -60)
        .attr("y", -20)
        .append("xhtml:div")
        .style("text-align", "center")
        .style("font-size", `${fontSize}px`)
        .style("font-weight", "bold")
        .style("color", "#333")
        .style("pointer-events", "none")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("height", "100%")
        .each(function (d: any) {
          const div = d3.select(this);
          const label = d.label;
          const state = d.state;
          const displayText = state ? `${state} (${label})` : `(${label})`;

          try {
            const renderedText = renderMath(displayText);
            div.html(renderedText);
          } catch (error) {
            console.error("KaTeX rendering error:", error);
            div.text(displayText);
          }
        });

      // シミュレーションの更新
      simulation.on("tick", () => {
        links
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y + 20) // 親ノードの下から
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y - 20); // 子ノードの上から

        nodeGroups.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      // ドラッグ機能
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      // クリーンアップ関数を保存
      if (isMountedRef.current) {
        (containerRef.current as any).__simulation = simulation;
      }
    },
    [fontSize],
  );

  // クライアントサイドでの初期化
  useEffect(() => {
    setIsClient(true);
  }, []);

  // グラフの描画
  useEffect(() => {
    if (isClient && isMountedRef.current) {
      // 少し遅延させてマウント完了後に描画
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          renderGraph();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [renderGraph, isClient]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // シミュレーションを停止
      if (containerRef.current && (containerRef.current as any).__simulation) {
        (containerRef.current as any).__simulation.stop();
      }
    };
  }, []);

  // エラー表示コンポーネント
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div
      role="alert"
      aria-live="polite"
      style={{
        color: "#dc2626",
        padding: "20px",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        backgroundColor: "#fef2f2",
        fontFamily: "monospace",
        fontSize: "14px",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>エラー:</div>
      <div>{message}</div>
      <div style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280" }}>
        有効なデータを入力してください。
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: "relative",
      }}
      className={className}
      role="region"
      aria-label="グラフ表示エリア"
    >
      {error && <ErrorDisplay message={error} />}
    </div>
  );
};
