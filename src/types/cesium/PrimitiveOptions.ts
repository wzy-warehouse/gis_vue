import type { Cartesian3, Color, NearFarScalar } from 'cesium';

/**
 * Primitive图元配置选项
 */
export interface PrimitiveOptions {
  /** 唯一ID */
  id: string;
  /** 图元类型 */
  type: 'point' | 'polyline' | 'polygon' | 'billboard';
  /** 点集合，线和面需要多个点 */
  positions: [number, number, number][] | Cartesian3[];
  /** 是否为默认图元，默认false */
  isDefault?: boolean;
  /** 颜色 */
  color?: Color;
  /** 点大小 */
  pixelSize?: number;
  /** 线宽 */
  width?: number;
  /** 广告牌图片 */
  image?: string;
  /** 广告牌缩放 */
  scale?: number;
  /** 广告牌距离衰减缩放 */
  scaleByDistance?: NearFarScalar;
  /** 自定义属性对象 */
  customProperties?: Record<string, unknown>;
}
