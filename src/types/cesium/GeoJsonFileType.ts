/**
 * GeoJSON文件类型接口
 */
export interface GeoJsonFileType {
  /** 类型，固定为FeatureCollection */
  type: 'FeatureCollection';
  /** 要素数组 */
  features: {
    geometry: {
      coordinates: number[][][][];
    };
  }[];
}
