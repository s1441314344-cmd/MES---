import { memo, useMemo } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';

// 走廊路由参数
const CORRIDOR_CLEARANCE_PX = 60;
const MIN_TARGET_CLEARANCE_PX = 24;
const MIN_SOURCE_DROP_PX = 12;
const CORNER_RADIUS = 20;
const FAN_IN_LANE_GAP = 14;
const FAN_OUT_SPREAD = 16;

function generateSequencePath(sourceX: number, sourceY: number, targetX: number, targetY: number): string {
  const deltaY = Math.max(36, targetY - sourceY);
  const curvature = Math.min(48, deltaY * 0.35);

  return [
    `M ${sourceX} ${sourceY}`,
    `C ${sourceX} ${sourceY + curvature}, ${targetX} ${targetY - curvature}, ${targetX} ${targetY}`,
  ].join(' ');
}

/**
 * 生成走廊路径（三段式：垂直-水平-垂直）
 * 用于多入边汇入同一节点时，避免连线交叉
 */
function generateCorridorPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  incomingIndex: number,
  incomingTotal: number
): string {
  // 计算走廊Y坐标
  let corridorY = targetY - CORRIDOR_CLEARANCE_PX;

  // 夹紧条件1：确保走廊不压住目标节点
  const minCorridorY = targetY - MIN_TARGET_CLEARANCE_PX;
  corridorY = Math.min(corridorY, minCorridorY);

  // 夹紧条件2：确保有足够的下降距离
  const minSourceY = sourceY + MIN_SOURCE_DROP_PX;
  corridorY = Math.max(corridorY, minSourceY);

  // 计算水平移动方向
  const horizontalDistance = Math.abs(targetX - sourceX);

  // 修复点2：不允许斜线 - 统一使用走廊路径
  // 当源点在目标点下方时，调整走廊Y到源点下方
  if (sourceY >= targetY) {
    // 源点在目标点下方，走廊设置在源点下方
    corridorY = sourceY + CORRIDOR_CLEARANCE_PX;
    // 确保走廊不压住目标节点
    corridorY = Math.max(corridorY, targetY + MIN_TARGET_CLEARANCE_PX);
  }

  // 动态调整圆角半径（确保不超过水平距离的一半）
  // 注意：如果圆角几何不成立，应该通过布局侧吸附解决，这里只做动态调整
  const effectiveCornerRadius = Math.min(CORNER_RADIUS, horizontalDistance / 2);

  // 生成三段式路径（带圆角）
  // 1. 从源点垂直下降到走廊（留出圆角空间）
  const verticalDropEndY = corridorY - effectiveCornerRadius;

  // 2. 圆角过渡到水平段
  // 如果目标在右侧，圆角向右；如果目标在左侧，圆角向左
  const isTargetRight = targetX > sourceX;
  const cornerX1 = isTargetRight
    ? sourceX + effectiveCornerRadius
    : sourceX - effectiveCornerRadius;

  // 3. 圆角过渡到垂直段
  const verticalRiseStartY = corridorY + effectiveCornerRadius;

  const centeredIndex = incomingIndex - (incomingTotal - 1) / 2;
  const targetLaneX = targetX + centeredIndex * FAN_IN_LANE_GAP;

  const path = [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX} ${verticalDropEndY}`,
    `Q ${sourceX} ${corridorY} ${cornerX1} ${corridorY}`,
    `L ${targetLaneX} ${corridorY}`,
    `Q ${targetX} ${corridorY} ${targetX} ${verticalRiseStartY}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');

  return path;
}

export const SequenceEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
  }: EdgeProps) => {
    // 判断是否使用走廊路由
    const incomingTotal = data?.incomingTotal;
    const incomingIndex = data?.incomingIndex || 0;
    const outgoingIndex = data?.outgoingIndex || 0;
    const outgoingTotal = data?.outgoingTotal || 0;
    const useCorridor = incomingTotal !== undefined && incomingTotal > 1;

    // 根据路由模式生成路径
    const edgePath = useMemo(() => {
      if (useCorridor) {
        // 使用走廊路径
        return generateCorridorPath(sourceX, sourceY, targetX, targetY, incomingIndex, incomingTotal);
      }

      if (outgoingTotal > 1) {
        const centeredIndex = outgoingIndex - (outgoingTotal - 1) / 2;
        const startX = sourceX + centeredIndex * FAN_OUT_SPREAD;
        return generateSequencePath(startX, sourceY, targetX, targetY);
      }

      if (Math.abs(targetX - sourceX) <= 8) {
        return generateSequencePath(sourceX, sourceY, targetX, targetY);
      }

      const [path] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 20,
      });
      return path;
    }, [useCorridor, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, incomingIndex, incomingTotal, outgoingIndex, outgoingTotal]);

    // 计算靠近终点 (Target) 的位置
    // badgeX 必须精确等于 targetX (锚点 X 坐标)
    // badgeY 距离 targetY (锚点 Y 坐标) 保持固定间距，以对齐所有汇入线
    const badgeX = targetX;
    const badgeY = targetY - 30; // 稍微调高一点，避免挡住节点标题栏

    const sequenceOrder = data?.sequenceOrder;
    const isEditingDashed = data?.isEditingDashed || false;

    // 根据编辑态决定样式
    const edgeStyle = useMemo(() => {
      const baseStyle: { stroke: string; strokeWidth: number; strokeDasharray?: string; opacity?: number } = {
        stroke: useCorridor ? '#0FA67A' : '#94a3b8',
        strokeWidth: useCorridor ? 2.4 : 2,
      };

      if (isEditingDashed) {
        baseStyle.strokeDasharray = '6 6';
        baseStyle.opacity = 0.8;
      }

      return baseStyle;
    }, [isEditingDashed, useCorridor]);

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={edgeStyle}
        />
        {sequenceOrder && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${badgeX}px,${badgeY}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow-md ring-2 ring-white">
                {sequenceOrder}
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

SequenceEdge.displayName = 'SequenceEdge';
