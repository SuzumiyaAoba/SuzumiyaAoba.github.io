"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { VisDotGraph, TreeNode as VisTreeNode } from "./VisDotGraph";

export interface TreeNode {
  id: string;
  label: string;
  state?: string;
  color?: string;
}

export interface TreeEdge {
  from?: string;
  to?: string;
  source?: string;
  target?: string;
  label?: string;
  color?: string;
}

export interface TransitionStep {
  nodes: TreeNode[];
  edges: TreeEdge[];
  description: string;
  stepNumber: number;
}

interface TreeAutomatonTransitionProps {
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

const TreeAutomatonTransition: React.FC<TreeAutomatonTransitionProps> = ({
  steps = [],
  width = "800px",
  height = "400px",
  fontSize = 16,
  className = "",
  showStepIndicator = true,
  showDescription = true,
  autoPlay = false,
  autoPlayInterval = 2000,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // クライアントサイドでの初期化
  useEffect(() => {
    setIsClient(true);
  }, []);

  // データの検証
  useEffect(() => {
    try {
      if (!steps || !Array.isArray(steps) || steps.length === 0) {
        throw new Error("ステップデータが無効です");
      }

      const currentStepData = steps[currentStep];
      if (
        !currentStepData ||
        !currentStepData.nodes ||
        !Array.isArray(currentStepData.nodes)
      ) {
        throw new Error(`ステップ${currentStep + 1}のデータが無効です`);
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    }
  }, [steps, currentStep]);

  // オートプレイ機能
  useEffect(() => {
    if (!autoPlay || !isPlaying || !isClient) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, isPlaying, steps.length, autoPlayInterval, isClient]);

  // ナビゲーション関数
  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying((prev) => !prev);
  }, [currentStep, steps.length]);

  // 現在のステップデータ
  const currentStepData = useMemo(() => {
    return (
      steps[currentStep] || {
        nodes: [],
        edges: [],
        description: "",
        stepNumber: 0,
      }
    );
  }, [steps, currentStep]);

  // VisDotGraph用のデータ変換
  const visDotGraphData = useMemo(() => {
    const nodes: VisTreeNode[] = currentStepData.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      state: node.state,
      color: node.color,
    }));

    const edges = currentStepData.edges.map((edge) => ({
      source: edge.from || edge.source,
      target: edge.to || edge.target,
      from: edge.from || edge.source,
      to: edge.to || edge.target,
      label: edge.label,
      color: edge.color,
    }));

    const result = {
      nodes,
      edges,
    };

    return result;
  }, [currentStepData]);

  // プログレス計算
  const progress = useMemo(() => {
    return steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  }, [currentStep, steps.length]);

  // サーバーサイドレンダリング時の表示
  if (!isClient) {
    return (
      <div
        className={`tree-automaton-transition border border-gray-200 rounded-lg p-4 my-4 ${className}`}
        role="region"
        aria-label="木オートマトン遷移コンポーネント"
      >
        <div className="text-center p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div
        className={`tree-automaton-transition border border-red-200 rounded-lg p-4 my-4 bg-red-50 ${className}`}
        role="alert"
        aria-live="polite"
      >
        <div className="text-red-800">
          <h4 className="font-semibold mb-2">エラーが発生しました:</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tree-automaton-transition border border-gray-200 rounded-lg p-4 my-4 ${className}`}
      role="region"
      aria-label="木オートマトン遷移コンポーネント"
    >
      {/* コントロール */}
      <div className="transition-controls mb-4 flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="前のステップに移動"
        >
          ← 前へ
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          aria-label="最初のステップにリセット"
        >
          リセット
        </button>

        {autoPlay && (
          <button
            onClick={handlePlayPause}
            className={`px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isPlaying
                ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
            }`}
            aria-label={isPlaying ? "再生を停止" : "自動再生を開始"}
          >
            {isPlaying ? "⏸ 停止" : "▶ 再生"}
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="次のステップに移動"
        >
          次へ →
        </button>
      </div>

      {/* ステップインジケーター */}
      {showStepIndicator && (
        <div className="step-indicator mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              ステップ {currentStep + 1} / {steps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={steps.length}
            />
          </div>
        </div>
      )}

      {/* ステップ説明 */}
      {showDescription && currentStepData.description && (
        <div className="step-description mb-4 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">
            ステップ {currentStep + 1} の説明:
          </h4>
          <p className="text-gray-700">{currentStepData.description}</p>
        </div>
      )}

      {/* グラフ表示 */}
      <div className="graph-container">
        <VisDotGraph
          data={visDotGraphData}
          width={width}
          height={height}
          fontSize={fontSize}
        />
      </div>
    </div>
  );
};

export default TreeAutomatonTransition;
export { TreeAutomatonTransition };
