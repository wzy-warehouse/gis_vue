import type {
  Cartesian3,
  Color,
  HorizontalOrigin,
  VerticalOrigin,
} from 'cesium';

/**
 * 标签配置接口
 */
export interface LabelConfig {
  /** 文本内容，默认空白 */
  labelText?: string;
  /** 字体样式，默认16px "微软雅黑" */
  labelFont?: string;
  /** 标签颜色，默认白色 */
  labelColor?: Color;
  /** 字体大小，默认16 */
  labelSize?: number;
  /** 标签偏移，默认{x:0, y:0} */
  labelOffset?: { x: number; y: number };
  /** 水平位置，默认居中 */
  horizontalOrigin?: HorizontalOrigin;
  /** 垂直位置，默认居中 */
  verticalOrigin?: VerticalOrigin;
  /** 背景颜色，默认透明 */
  backgroundColor?: Color;
  /** 中心点位置 */
  center?: Cartesian3 | [number, number, number];
}
