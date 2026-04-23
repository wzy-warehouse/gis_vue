import {
  ImageryLayer,
  ArcGisMapServerImageryProvider,
  WebMapServiceImageryProvider,
  WebMapTileServiceImageryProvider,
  ImageryProvider,
} from 'cesium';
import type { LayerConfig } from '@/types/cesium/LayerConfig';
import type { Viewer } from 'cesium';

/**
 * 图层管理器
 */
export class LayerManager {
  #viewer: Viewer;
  #defaultLayerMap = new Map<string, ImageryLayer>();
  #customLayerMap = new Map<string, ImageryLayer>();

  constructor(viewer: Viewer) {
    this.#viewer = viewer;
  }

  /**
   * 批量创建图层
   * @param layerConfigs - 图层配置数组
   * @returns 创建的 ImageryLayer 实例数组（失败的为 null）
   */
  createLayersBatch(layerConfigs: LayerConfig[]): (ImageryLayer | null)[] {
    return layerConfigs.map((config) => {
      try {
        return this.createLayer(config);
      } catch (error) {
        console.error(`创建图层 ${config.layers} 失败:`, error);
        return null;
      }
    });
  }

  /**
   * 创建图层
   * @param layerConfig - 图层配置
   * @returns 创建的 ImageryLayer 实例，失败则返回 null
   */
  createLayer(layerConfig: LayerConfig): ImageryLayer | null {
    const { layers: layerKey, isDefault = false } = layerConfig;

    if (!layerKey) throw new Error('layers 参数未定义');
    this.#validateUniqueLayerKey(layerKey);

    const provider = this.#createImageryProvider(layerConfig);
    if (!provider) return null;

    const layer = this.#viewer.imageryLayers.addImageryProvider(provider);
    this.#storeLayer(layerKey, layer!, isDefault);
    return layer!;
  }

  /**
   * 查询图层
   * @param key - 图层 key
   * @returns ImageryLayer 实例，不存在则返回 undefined
   */
  getLayerByKey(key: string): ImageryLayer | undefined {
    return this.#defaultLayerMap.get(key) || this.#customLayerMap.get(key);
  }

  /**
   * 删除图层
   * @param key - 图层 key
   * @returns 是否删除成功
   */
  removeLayerByKey(key: string): boolean {
    const { isDefault, layer } = this.#getLayerInfo(key);
    if (!layer) {
      console.warn(`图层 key ${key} 不存在`);
      return false;
    }

    const removed = this.#viewer.imageryLayers.remove(layer, true);
    if (removed) {
      this.#removeLayerKey(key, isDefault);
    }
    return removed!;
  }

  /**
   * 批量删除图层
   * @param layerIds - 图层 ID 数组
   */
  batchRemoveLayers(layerIds: string[]): void {
    layerIds.forEach((id) => this.removeLayerByKey(id));
  }

  /**
   * 清除图层
   * @param clearType - 清除类型：'default'=默认图层，'custom'=自定义图层，'all'=所有图层（默认 'custom'）
   */
  clearAllLayers(clearType: 'default' | 'custom' | 'all' = 'custom'): void {
    const targetMap = this.#getTargetMapByType(clearType);

    targetMap.forEach((layer) => {
      this.#viewer.imageryLayers.remove(layer, true);
    });

    this.#clearMapsByType(clearType);
  }

  /**
   * 获取所有图层 Key
   * @param clearType - 类型：'default'=默认图层，'custom'=自定义图层，'all'=所有图层（默认 'all'）
   * @returns 图层 Key 集合
   */
  getLayerKeys(clearType: 'default' | 'custom' | 'all' = 'all'): Set<string> {
    return this.#getTargetIdsByType(clearType);
  }

  // ===================== 私有方法 =====================

  #validateUniqueLayerKey(key: string): void {
    if (this.#defaultLayerMap.has(key) || this.#customLayerMap.has(key)) {
      console.warn(`图层 ${key} 已存在，将覆盖原有图层`);
      this.removeLayerByKey(key);
    }
  }

  #createImageryProvider(layerConfig: LayerConfig): ImageryProvider | null {
    switch (layerConfig.type) {
      case 'imagery':
        return new ArcGisMapServerImageryProvider({ url: layerConfig.url });
      case 'wms':
        return new WebMapServiceImageryProvider({
          url: layerConfig.url,
          layers: layerConfig.layers,
          parameters: layerConfig.parameters || { format: 'image/png' },
        });
      case 'wmts':
        return new WebMapTileServiceImageryProvider({
          url: layerConfig.url,
          layer: layerConfig.layers,
          style: layerConfig.style || 'default',
          format: layerConfig.format || 'image/png',
          tileMatrixSetID: layerConfig.tileMatrixSetID || 'EPSG:4326',
          credit: '',
        });
      default:
        console.error(`不支持的图层类型：${layerConfig.type}`);
        return null;
    }
  }

  #storeLayer(key: string, layer: ImageryLayer, isDefault: boolean): void {
    if (isDefault) {
      this.#defaultLayerMap.set(key, layer);
    } else {
      this.#customLayerMap.set(key, layer);
    }
  }

  #getLayerInfo(key: string) {
    const isDefault = this.#defaultLayerMap.has(key);
    const layer = isDefault
      ? this.#defaultLayerMap.get(key)
      : this.#customLayerMap.get(key);
    return { isDefault, layer };
  }

  #removeLayerKey(key: string, isDefault: boolean): void {
    if (isDefault) this.#defaultLayerMap.delete(key);
    else this.#customLayerMap.delete(key);
  }

  #getTargetMapByType(
    clearType: 'default' | 'custom' | 'all'
  ): Map<string, ImageryLayer> {
    const targetMap = new Map<string, ImageryLayer>();
    if (clearType === 'default' || clearType === 'all')
      this.#defaultLayerMap.forEach((value, key) => targetMap.set(key, value));
    if (clearType === 'custom' || clearType === 'all')
      this.#customLayerMap.forEach((value, key) => targetMap.set(key, value));
    return targetMap;
  }

  #clearMapsByType(clearType: 'default' | 'custom' | 'all'): void {
    if (clearType === 'default' || clearType === 'all')
      this.#defaultLayerMap.clear();
    if (clearType === 'custom' || clearType === 'all')
      this.#customLayerMap.clear();
  }

  #getTargetIdsByType(clearType: 'default' | 'custom' | 'all'): Set<string> {
    const targetIds = new Set<string>();
    if (clearType === 'default' || clearType === 'all')
      this.#defaultLayerMap.forEach((_, key) => targetIds.add(key));
    if (clearType === 'custom' || clearType === 'all')
      this.#customLayerMap.forEach((_, key) => targetIds.add(key));
    return targetIds;
  }
}
