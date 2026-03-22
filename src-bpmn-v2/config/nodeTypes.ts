import { ProcessType } from '../../src-bpmn/types/bpmn';
import type { NodeTypeCategory } from '../types/editor';

export const NODE_TYPE_CATEGORIES: NodeTypeCategory[] = [
  {
    id: 'control',
    name: '控制节点',
    types: [
      {
        type: 'startEvent',
        name: '开始事件',
        icon: 'Play',
        color: '#10B981'
      },
      {
        type: 'endEvent',
        name: '结束事件',
        icon: 'Square',
        color: '#EF4444'
      },
      {
        type: 'exclusiveGateway',
        name: '独占网关',
        icon: 'Split',
        color: '#F59E0B'
      },
      {
        type: 'parallelGateway',
        name: '并行网关',
        icon: 'GitBranch',
        color: '#8B5CF6'
      }
    ]
  },
  {
    id: 'process',
    name: '工艺节点',
    types: [
      {
        type: ProcessType.DISSOLUTION,
        name: '溶解',
        icon: 'Droplets',
        color: '#3B82F6'
      },
      {
        type: ProcessType.COMPOUNDING,
        name: '调配',
        icon: 'Mix',
        color: '#3B82F6'
      },
      {
        type: ProcessType.FILTRATION,
        name: '过滤',
        icon: 'Filter',
        color: '#3B82F6'
      },
      {
        type: ProcessType.TRANSFER,
        name: '赶料',
        icon: 'ArrowRight',
        color: '#3B82F6'
      },
      {
        type: ProcessType.FLAVOR_ADDITION,
        name: '香精添加',
        icon: 'Droplet',
        color: '#3B82F6'
      },
      {
        type: ProcessType.EXTRACTION,
        name: '萃取',
        icon: 'Beaker',
        color: '#3B82F6'
      },
      {
        type: ProcessType.CENTRIFUGE,
        name: '离心',
        icon: 'Circle',
        color: '#3B82F6'
      },
      {
        type: ProcessType.COOLING,
        name: '冷却',
        icon: 'Snowflake',
        color: '#3B82F6'
      },
      {
        type: ProcessType.HOLDING,
        name: '暂存',
        icon: 'Database',
        color: '#3B82F6'
      },
      {
        type: ProcessType.MEMBRANE_FILTRATION,
        name: '膜过滤',
        icon: 'Layers',
        color: '#3B82F6'
      },
      {
        type: ProcessType.UHT,
        name: 'UHT杀菌',
        icon: 'Thermometer',
        color: '#3B82F6'
      },
      {
        type: ProcessType.FILLING,
        name: '灌装',
        icon: 'Package',
        color: '#3B82F6'
      },
      {
        type: ProcessType.MAGNETIC_ABSORPTION,
        name: '磁棒吸附',
        icon: 'Magnet',
        color: '#3B82F6'
      },
      {
        type: ProcessType.ASEPTIC_TANK,
        name: '无菌罐',
        icon: 'Box',
        color: '#3B82F6'
      },
      {
        type: ProcessType.OTHER,
        name: '其他',
        icon: 'MoreHorizontal',
        color: '#3B82F6'
      }
    ]
  }
];

export const getNodeColor = (type: string): string => {
  const colors: Record<string, string> = {
    startEvent: '#10B981',
    endEvent: '#EF4444',
    exclusiveGateway: '#F59E0B',
    parallelGateway: '#8B5CF6',
    process: '#1F6FEB',
    [ProcessType.DISSOLUTION]: '#1F6FEB',
    [ProcessType.COMPOUNDING]: '#0F766E',
    [ProcessType.FILTRATION]: '#1D4ED8',
    [ProcessType.TRANSFER]: '#D97706',
    [ProcessType.FLAVOR_ADDITION]: '#C026D3',
    [ProcessType.EXTRACTION]: '#0E7490',
    [ProcessType.CENTRIFUGE]: '#7C3AED',
    [ProcessType.COOLING]: '#0284C7',
    [ProcessType.HOLDING]: '#475569',
    [ProcessType.MEMBRANE_FILTRATION]: '#2563EB',
    [ProcessType.UHT]: '#DC2626',
    [ProcessType.FILLING]: '#059669',
    [ProcessType.MAGNETIC_ABSORPTION]: '#4F46E5',
    [ProcessType.ASEPTIC_TANK]: '#0F766E',
    [ProcessType.OTHER]: '#64748B',
  };
  return colors[type] || '#6B7280';
};

export const getNodeBgColor = (type: string): string => {
  const colors: Record<string, string> = {
    startEvent: '#ECFDF5',
    endEvent: '#FEF2F2',
    exclusiveGateway: '#FFFBEB',
    parallelGateway: '#F5F3FF',
    process: '#EFF6FF',
    [ProcessType.DISSOLUTION]: '#EAF2FF',
    [ProcessType.COMPOUNDING]: '#E7FBF5',
    [ProcessType.FILTRATION]: '#EEF5FF',
    [ProcessType.TRANSFER]: '#FFF4E5',
    [ProcessType.FLAVOR_ADDITION]: '#FDF0FF',
    [ProcessType.EXTRACTION]: '#ECFEFF',
    [ProcessType.CENTRIFUGE]: '#F3F0FF',
    [ProcessType.COOLING]: '#E8F8FF',
    [ProcessType.HOLDING]: '#F1F5F9',
    [ProcessType.MEMBRANE_FILTRATION]: '#EAF3FF',
    [ProcessType.UHT]: '#FEF2F2',
    [ProcessType.FILLING]: '#ECFDF5',
    [ProcessType.MAGNETIC_ABSORPTION]: '#EEF2FF',
    [ProcessType.ASEPTIC_TANK]: '#ECFEF4',
    [ProcessType.OTHER]: '#F8FAFC',
  };
  return colors[type] || '#F3F4F6';
};
