import type { Color } from 'cesium';
import type { GeoJsonFileType } from './GeoJsonFileType';

/**
 * Cesium Viewer初始化配置选项
 */
export interface CesiumInitOptions {
  /** 容器DOM ID */
  containerId: string;
  /** 地形服务地址 */
  terrain?: string;

  /** 是否自动播放动画，默认true */
  shouldAnimate?: boolean;
  /** 是否显示图层选择器，默认false */
  baseLayerPicker?: boolean;
  /** 是否显示时间轴，默认false */
  timeline?: boolean;
  /** 是否显示动画控件，默认false */
  animation?: boolean;
  /** 是否显示信息框，默认false */
  infoBox?: boolean;
  /** 是否显示导航帮助按钮，默认false */
  navigationHelpButton?: boolean;
  /** 是否显示全屏按钮，默认false */
  fullscreenButton?: boolean;
  /** 是否显示主页按钮，默认false */
  homeButton?: boolean;
  /** 是否3D场景，默认false */
  scene3DOnly?: boolean;
  /** 场景模式选择器，默认false */
  sceneModePicker?: boolean;
  /** 搜索功能，默认false */
  geocoder?: boolean;

  /** 初始场景模式（2D=1, COLUMBUS_VIEW=2, 3D=3），默认3D */
  sceneMode?: number;

  /** 遮罩配置 */
  mark?: {
    /** 是否包含遮罩，默认false */
    include?: boolean;
    /** GeoJSON数据，用于突出显示某一区域 */
    geoJson?: GeoJsonFileType;
    /** 孔洞属于半球，默认东半球 */
    belongingHemisphere?: 'east' | 'west';
    /** 遮罩颜色，默认黑色 */
    color?: Color;
    /** 边框配置 */
    border?: {
      /** 是否显示边框，默认true */
      show?: boolean;
      /** 边框颜色，默认白色 */
      color?: Color;
      /** 边框宽度，默认1 */
      width?: number;
    };
  };
}
