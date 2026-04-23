import type { Cartesian3, Color } from 'cesium';
import { HeightReference, MaterialProperty } from 'cesium';

/**
 * 实体配置选项
 * 支持点、线、面、Billboard等基础实体类型
 */
export interface EntityOptions {
  /** 实体唯一标识（必填，用于后续查询/删除） */
  id: string;
  /** 位置（经纬度高程数组或Cartesian3） */
  position: Cartesian3 | [number, number, number];
  /** 实体类型 */
  type: 'point' | 'polyline' | 'billboard' | 'polygon';
  /** 是否为默认实体，默认false */
  isDefault?: boolean;
  /** 点配置（type='point'时必填） */
  pointOptions?: {
    /** 颜色，默认红色 */
    color?: Color;
    /** 像素大小，默认8 */
    pixelSize?: number;
    /** 轮廓颜色，默认白色 */
    outlineColor?: Color;
    /** 轮廓宽度，默认1 */
    outlineWidth?: number;
    /** 高度参考，默认CLAMP_TO_GROUND */
    heightReference?: HeightReference;
  };
  /** 线配置（type='polyline'时必填） */
  polylineOptions?: {
    /** 线顶点数组 */
    positions: Cartesian3[] | [number, number, number][];
    /** 颜色，默认蓝色 */
    color?: Color;
    /** 线宽，默认3 */
    width?: number;
    /** 是否贴地，默认false */
    clampToGround?: boolean;
  };
  /** Billboard配置（type='billboard'时必填） */
  billboardOptions?: {
    /** 图片地址 */
    image: string;
    /** 缩放比例，默认1 */
    scale?: number;
    /** 颜色，默认白色 */
    color?: Color;
    /** 垂直对齐方式，默认CENTER */
    verticalOrigin?: number;
    /** 水平对齐方式，默认CENTER */
    horizontalOrigin?: number;
    /** 高度参考，默认CLAMP_TO_GROUND */
    heightReference?: HeightReference;
  };
  /** 面配置（type='polygon'时必填） */
  polygonOptions?: {
    /** 面顶点数组 */
    hierarchy: Cartesian3[] | [number, number, number][];
    /** 是否显示轮廓，默认true */
    outline?: boolean;
    /** 轮廓颜色，默认黑色 */
    outlineColor?: Color;
    /** 轮廓宽度，默认1 */
    outlineWidth?: number;
    /** 高度，默认0 */
    height?: number;
    /** 拉伸高度，默认0 */
    extrudedHeight?: number;
    /** 高度参考，默认CLAMP_TO_GROUND */
    heightReference?: HeightReference;
    /** 材质，默认Color.WHITE */
    material?: MaterialProperty;
  };
  /** 自定义属性（用于存储额外信息） */
  attributes?: Record<string, unknown>;
}
