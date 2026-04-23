import type { Cartesian3, Color, DataSource } from 'cesium';
import type { LabelConfig } from './LabelConfig';

/**
 * GeoJSON数据源类型：字符串路径/URL或GeoJSON对象
 */
export type CustomizeGeoJsonDataSource = string | object;

/**
 * GeoJSON图层配置选项
 */
export interface GeoJsonOptions {
  /** 是否显示名称 */
  showName?: boolean;
  /** 是否为默认图层 */
  isDefault?: boolean;
  /** 标签样式配置 */
  labelStyle?: LabelConfig;
  /** 多边形样式配置 */
  polygonStyle?: {
    /** 是否填充 */
    fill?: boolean;
    /** 填充颜色 */
    fillColor?: Color;
    /** 是否显示轮廓 */
    outline?: boolean;
    /** 轮廓颜色 */
    outlineColor?: Color;
    /** 轮廓宽度 */
    outlineWidth?: number;
    /** 中心点位置 */
    center?: Cartesian3 | [number, number, number];
  };
  /** 线样式配置 */
  polylineStyle?: {
    /** 线宽 */
    width?: number;
    /** 材质颜色 */
    material?: Color;
    /** 是否贴地 */
    clampToGround?: boolean;
  };
  /** 点样式配置 */
  pointStyle?: {
    /** 像素大小 */
    pixelSize?: number;
    /** 颜色 */
    color?: Color;
    /** 轮廓颜色 */
    outlineColor?: Color;
    /** 轮廓宽度 */
    outlineWidth?: number;
  };
  /** 加载完成回调 */
  onComplete?: (dataSource: DataSource) => void;
}
