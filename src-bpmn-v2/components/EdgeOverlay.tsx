import React, { useEffect, useMemo, useState } from 'react';
import type { EditorEdge } from '../types/editor';

interface EdgeOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  nodeRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
  edges: EditorEdge[];
  selectedNodeId: string | null;
}

interface MeasuredEdge {
  id: string;
  d: string;
  color: string;
  width: number;
  active: boolean;
  marker: 'default' | 'parallel' | 'active';
}

const measureEdgePath = (
  sourceEl: HTMLDivElement,
  targetEl: HTMLDivElement,
  containerEl: HTMLDivElement,
  edge: EditorEdge
): MeasuredEdge => {
  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const containerRect = containerEl.getBoundingClientRect();

  const sourceX = sourceRect.left - containerRect.left + sourceRect.width / 2;
  const sourceY = sourceRect.top - containerRect.top + sourceRect.height;
  const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
  const targetY = targetRect.top - containerRect.top;
  const deltaX = targetX - sourceX;
  const deltaY = Math.max(24, targetY - sourceY);

  const isStraight = Math.abs(deltaX) < 10;
  const verticalLead = Math.min(28, Math.max(14, deltaY * 0.35));
  const horizontalLead = Math.max(18, Math.min(42, Math.abs(deltaX) * 0.28));
  const laneY = sourceY + verticalLead;

  const path = isStraight
    ? [
        `M ${sourceX} ${sourceY}`,
        `C ${sourceX} ${sourceY + verticalLead * 0.55}, ${targetX} ${targetY - verticalLead * 0.55}, ${targetX} ${targetY}`,
      ].join(' ')
    : [
        `M ${sourceX} ${sourceY}`,
        `C ${sourceX} ${sourceY + verticalLead}, ${sourceX} ${laneY}, ${sourceX + Math.sign(deltaX) * horizontalLead} ${laneY}`,
        `L ${targetX - Math.sign(deltaX) * horizontalLead} ${laneY}`,
        `C ${targetX} ${laneY}, ${targetX} ${targetY - verticalLead}, ${targetX} ${targetY}`,
      ].join(' ');

  return {
    id: edge.id,
    d: path,
    color: edge.type === 'parallel' ? '#0FA67A' : '#A8B5C7',
    width: edge.type === 'parallel' ? 2.2 : 2,
    active: false,
    marker: edge.type === 'parallel' ? 'parallel' : 'default',
  };
};

export const EdgeOverlay: React.FC<EdgeOverlayProps> = ({
  containerRef,
  nodeRefs,
  edges,
  selectedNodeId,
}) => {
  const [measureVersion, setMeasureVersion] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = 0;
    const triggerMeasure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => setMeasureVersion((value) => value + 1));
    };

    const resizeObserver = new ResizeObserver(triggerMeasure);
    resizeObserver.observe(container);
    nodeRefs.current.forEach((node) => {
      if (node) resizeObserver.observe(node);
    });

    container.addEventListener('scroll', triggerMeasure, { passive: true });
    window.addEventListener('resize', triggerMeasure);
    triggerMeasure();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeEventListener('scroll', triggerMeasure);
      window.removeEventListener('resize', triggerMeasure);
    };
  }, [containerRef, nodeRefs, edges]);

  const measuredEdges = useMemo(() => {
    const container = containerRef.current;
    if (!container) return [];

    return edges
      .map((edge) => {
        const sourceNode = nodeRefs.current.get(edge.source);
        const targetNode = nodeRefs.current.get(edge.target);
        if (!sourceNode || !targetNode) return null;

        const measured = measureEdgePath(sourceNode, targetNode, container, edge);
        measured.active = edge.source === selectedNodeId || edge.target === selectedNodeId;
        if (measured.active) {
          measured.color = edge.type === 'parallel' ? '#059669' : '#1F6FEB';
          measured.width = 3;
          measured.marker = 'active';
        }
        return measured;
      })
      .filter((edge): edge is MeasuredEdge => edge !== null);
  }, [containerRef, edges, nodeRefs, selectedNodeId, measureVersion]);

  if (!containerRef.current || measuredEdges.length === 0) {
    return null;
  }

  return (
    <svg className="pointer-events-none absolute inset-0 z-0 overflow-visible">
      <defs>
        <marker
          id="workflow-arrow-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#A8B5C7" />
        </marker>
        <marker
          id="workflow-arrow-active"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1F6FEB" />
        </marker>
        <marker
          id="workflow-arrow-parallel"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0FA67A" />
        </marker>
      </defs>

      {measuredEdges.map((edge) => (
        <path
          key={edge.id}
          d={edge.d}
          fill="none"
          stroke={edge.color}
          strokeWidth={edge.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={`url(#workflow-arrow-${edge.marker})`}
          className="drop-shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
        />
      ))}
    </svg>
  );
};
