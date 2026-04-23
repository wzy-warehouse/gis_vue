/**
 * 图层配置接口
 */
export interface LayerConfig {
  /** 唯一ID */
  id: string;

  /** 图层类型，支持imagery、wms、wmts */
  type: 'imagery' | 'wms' | 'wmts';
  /** 图层提供者 */
  provider: string;
  /** 图层地址 */
  url: string;
  /** 图层名称 */
  layers: string;

  /** 是否为默认图层，默认false */
  isDefault?: boolean;

  /** WMTS图层样式，默认default */
  style?: string;
  /** WMTS图层格式，默认image/png */
  format?: string;
  /** WMTS瓦片矩阵集ID，默认EPSG:4326 */
  tileMatrixSetID?: string;
  /** WMTS图层版权信息，默认空 */
  credit?: string;

  /** 图层参数 */
  parameters?: Record<string, unknown>;
}
