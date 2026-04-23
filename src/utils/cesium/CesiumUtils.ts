import type { CesiumInitOptions } from '@/types/cesium/CesiumInitOptions';
import type { EntityOptions } from '@/types/cesium/EntityOptions';
import type { PrimitiveOptions } from '@/types/cesium/PrimitiveOptions';
import type { LayerConfig } from '@/types/cesium/LayerConfig';
import type {
  CustomizeGeoJsonDataSource,
  GeoJsonOptions,
} from '@/types/cesium/GeoJsonOptions';
import {
  Viewer,
  Entity,
  DataSource,
  ImageryLayer,
  Primitive,
  BillboardCollection,
  Cartesian3,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
  SceneTransforms,
} from 'cesium';
import { CesiumViewerManager } from './CesiumViewerManager';
import { EntityManager } from './EntityManager';
import { PrimitiveManager } from './PrimitiveManager';
import { LayerManager } from './LayerManager';
import { GeoJsonManager, type ClearType } from './GeoJsonManager';
import { CameraController } from './CameraController';
import type { ClickObject } from '@/types/cesium/ClickObject';

// 导出 ClearType 类型
export type { ClearType };

/**
 * Cesium 工具类（重构版 - 委托模式）
 */
export class CesiumUtils {
  // 管理器实例
  #viewerManager: CesiumViewerManager;
  #entityManager: EntityManager | null = null;
  #primitiveManager: PrimitiveManager | null = null;
  #layerManager: LayerManager | null = null;
  #geoJsonManager: GeoJsonManager | null = null;
  #cameraController: CameraController | null = null;

  constructor() {
    this.#viewerManager = new CesiumViewerManager();
  }

  /**
   * 初始化 Cesium Viewer
   * @param options - Viewer 初始化选项
   * @param type - 底图类型：0=影像图，1=矢量图（默认 0）
   * @param tdMapToken - 天地图 Token 数组（可选）
   */
  async initCesiumViewer(
    options: CesiumInitOptions,
    type: number = 0,
    tdMapToken?: string[]
  ): Promise<void> {
    await this.#viewerManager.initCesiumViewer(options, type, tdMapToken);

    const viewer = this.#viewerManager.getViewer();
    if (viewer) {
      this.#entityManager = new EntityManager(viewer);
      this.#primitiveManager = new PrimitiveManager(viewer);
      this.#layerManager = new LayerManager(viewer);
      this.#geoJsonManager = new GeoJsonManager(viewer);
      this.#cameraController = new CameraController(viewer);
    }
  }

  /**
   * 销毁 Cesium Viewer
   */
  destroyCesiumViewer(): void {
    this.#viewerManager.destroyCesiumViewer(() =>
      this.clearAllResources('all')
    );
  }

  // ===================== 实体管理 =====================

  /**
   * 添加 Cesium 实体
   * @param entityOptions - 实体配置选项
   * @returns 创建的 Entity 实例
   */
  addCesiumEntity(entityOptions: EntityOptions): Entity {
    this.#checkManager(this.#entityManager, 'EntityManager');
    return this.#entityManager!.addCesiumEntity(entityOptions);
  }

  /**
   * 批量添加实体
   * @param entityOptionsList - 实体配置选项数组
   * @returns 创建的 Entity 实例数组
   */
  addCesiumEntitiesBatch(entityOptionsList: EntityOptions[]): Entity[] {
    this.#checkManager(this.#entityManager, 'EntityManager');
    return this.#entityManager!.addCesiumEntitiesBatch(entityOptionsList);
  }

  /**
   * 查询实体
   * @param entityId - 实体 ID
   * @returns Entity 实例，不存在则返回 null
   */
  getCesiumEntityById(entityId: string): Entity | null {
    this.#checkManager(this.#entityManager, 'EntityManager');
    return this.#entityManager!.getCesiumEntityById(entityId);
  }

  /**
   * 删除实体
   * @param entityId - 实体 ID
   * @returns 是否删除成功
   */
  removeCesiumEntity(entityId: string): boolean {
    this.#checkManager(this.#entityManager, 'EntityManager');
    return this.#entityManager!.removeCesiumEntity(entityId);
  }

  /**
   * 批量删除实体
   * @param entityIds - 实体 ID 数组
   */
  batchRemoveCesiumEntities(entityIds: string[]): void {
    this.#checkManager(this.#entityManager, 'EntityManager');
    this.#entityManager!.batchRemoveCesiumEntities(entityIds);
  }

  /**
   * 清除实体
   * @param clearType - 清除类型：'default'=默认实体，'custom'=自定义实体，'all'=所有实体（默认 'custom'）
   */
  clearAllEntities(clearType: ClearType = 'custom'): void {
    this.#checkManager(this.#entityManager, 'EntityManager');
    this.#entityManager!.clearAllEntities(clearType);
  }

  /**
   * 获取所有实体ID
   * @param clearType - 类型：'default'=默认实体，'custom'=自定义实体，'all'=所有实体（默认 'all'）
   * @returns 实体 ID 集合
   */
  getEntityIds(clearType: ClearType = 'all'): Set<string> {
    this.#checkManager(this.#entityManager, 'EntityManager');
    return this.#entityManager!.getEntityIds(clearType);
  }

  // ===================== Primitive 管理 =====================

  /**
   * 添加单个 Primitive
   * @param primitive - Primitive 配置选项
   */
  addPrimitive(primitive: PrimitiveOptions): void {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    this.#primitiveManager!.addPrimitive(primitive);
  }

  /**
   * 批量添加 Primitive
   * - 按类型分组后批量创建，减少 scene.primitives.add 调用次数
   * - 同类型的多个实例合并到一个 Primitive 或 BillboardCollection 中
   * @param primitives - Primitive 配置选项数组
   */
  addPrimitivesBatch(primitives: PrimitiveOptions[]): void {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    this.#primitiveManager!.addPrimitivesBatch(primitives);
  }

  /**
   * 查询 Primitive
   * @param id - Primitive ID
   * @returns Primitive 或 BillboardCollection 实例，不存在则返回 undefined
   */
  getPrimitiveById(id: string): Primitive | BillboardCollection | undefined {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    return this.#primitiveManager!.getPrimitiveById(id);
  }

  /**
   * 删除 Primitive
   * @param id - Primitive ID
   * @returns 是否删除成功
   */
  removePrimitiveById(id: string): boolean {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    return this.#primitiveManager!.removePrimitiveById(id);
  }

  /**
   * 清除 Primitive
   * @param clearType - 清除类型：'default'=默认 Primitive，'custom'=自定义 Primitive，'all'=所有 Primitive（默认 'custom'）
   */
  clearAllPrimitives(clearType: ClearType = 'custom'): void {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    this.#primitiveManager!.clearAllPrimitives(clearType);
  }

  /**
   * 获取所有Primitive ID
   * @param clearType - 类型：'default'=默认 Primitive，'custom'=自定义 Primitive，'all'=所有 Primitive（默认 'all'）
   * @returns Primitive ID 集合
   */
  getPrimitiveIds(clearType: ClearType = 'all'): Set<string> {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    return this.#primitiveManager!.getPrimitiveIds(clearType);
  }

  /**
   * 批量切换Primitives可见性
   * @param ids - Primitive ID 数组
   * @param visible - 是否可见
   */
  batchTogglePrimitives(ids: string[], visible: boolean): void {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    this.#primitiveManager!.batchTogglePrimitives(ids, visible);
  }

  /**
   * 批量显示Primitives
   * @param ids - Primitive ID 数组
   */
  batchShowPrimitives(ids: string[]): void {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    this.#primitiveManager!.batchShowPrimitives(ids);
  }

  /**
   * 批量隐藏Primitives
   * @param ids - Primitive ID 数组
   */
  batchHidePrimitives(ids: string[]): void {
    this.#checkManager(this.#primitiveManager, 'PrimitiveManager');
    this.#primitiveManager!.batchHidePrimitives(ids);
  }

  // ===================== 图层管理 =====================

  /**
   * 批量创建图层
   * @param layerConfigs - 图层配置数组
   * @returns 创建的 ImageryLayer 实例数组（失败的为 null）
   */
  createLayersBatch(layerConfigs: LayerConfig[]): (ImageryLayer | null)[] {
    this.#checkManager(this.#layerManager, 'LayerManager');
    return this.#layerManager!.createLayersBatch(layerConfigs);
  }

  /**
   * 创建图层
   * @param layerConfig - 图层配置
   * @returns 创建的 ImageryLayer 实例，失败则返回 null
   */
  createLayer(layerConfig: LayerConfig): ImageryLayer | null {
    this.#checkManager(this.#layerManager, 'LayerManager');
    return this.#layerManager!.createLayer(layerConfig);
  }

  /**
   * 查询图层
   * @param key - 图层 key
   * @returns ImageryLayer 实例，不存在则返回 undefined
   */
  getLayerByKey(key: string): ImageryLayer | undefined {
    this.#checkManager(this.#layerManager, 'LayerManager');
    return this.#layerManager!.getLayerByKey(key);
  }

  /**
   * 删除图层
   * @param key - 图层 key
   * @returns 是否删除成功
   */
  removeLayerByKey(key: string): boolean {
    this.#checkManager(this.#layerManager, 'LayerManager');
    return this.#layerManager!.removeLayerByKey(key);
  }

  /**
   * 批量删除图层
   * @param layerIds - 图层 ID 数组
   */
  batchRemoveLayers(layerIds: string[]): void {
    this.#checkManager(this.#layerManager, 'LayerManager');
    this.#layerManager!.batchRemoveLayers(layerIds);
  }

  /**
   * 清除图层
   * @param clearType - 清除类型：'default'=默认图层，'custom'=自定义图层，'all'=所有图层（默认 'custom'）
   */
  clearAllLayers(clearType: ClearType = 'custom'): void {
    this.#checkManager(this.#layerManager, 'LayerManager');
    this.#layerManager!.clearAllLayers(clearType);
  }

  /**
   * 获取所有图层 Key
   * @param clearType - 类型：'default'=默认图层，'custom'=自定义图层，'all'=所有图层（默认 'all'）
   * @returns 图层 Key 集合
   */
  getLayerKeys(clearType: ClearType = 'all'): Set<string> {
    this.#checkManager(this.#layerManager, 'LayerManager');
    return this.#layerManager!.getLayerKeys(clearType);
  }

  // ===================== GeoJSON 图层管理 =====================

  /**
   * 添加 GeoJSON 图层
   * @param layerId - 图层唯一标识
   * @param geojsonData - GeoJSON 数据（路径、URL 或对象）
   * @param options - 配置选项（样式、标签等）
   * @returns Promise<DataSource> 数据源实例
   */
  async addGeoJsonLayer(
    layerId: string,
    geojsonData: CustomizeGeoJsonDataSource,
    options?: GeoJsonOptions
  ): Promise<DataSource> {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.addGeoJsonLayer(layerId, geojsonData, options);
  }

  /**
   * 根据ID查询图层
   * @param layerId - 图层 ID
   * @returns DataSource 实例，不存在则返回 undefined
   */
  getGeoJsonLayerById(layerId: string): DataSource | undefined {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.getGeoJsonLayerById(layerId);
  }

  /**
   * 删除图层
   * @param layerId - 图层 ID
   * @returns 是否删除成功
   */
  removeGeoJsonLayer(layerId: string): boolean {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.removeGeoJsonLayer(layerId);
  }

  /**
   * 批量添加GeoJSON图层
   * @param layerConfigs - 图层配置数组，每个元素包含 layerId、geojsonData 和 options
   */
  async batchAddGeoJsonLayers(
    layerConfigs: Array<{
      layerId: string;
      geojsonData: CustomizeGeoJsonDataSource;
      options?: GeoJsonOptions;
    }>
  ): Promise<void> {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    await this.#geoJsonManager!.batchAddGeoJsonLayers(layerConfigs);
  }

  /**
   * 批量删除
   * @param layerIds - 图层 ID 数组
   */
  batchRemoveGeoJsonLayers(layerIds: string[]): void {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    this.#geoJsonManager!.batchRemoveGeoJsonLayers(layerIds);
  }

  /**
   * 清空图层
   * @param clearType - 清除类型：'default'=默认图层，'custom'=自定义图层，'all'=所有图层（默认 'custom'）
   */
  clearAllGeoJsonLayers(clearType: ClearType = 'custom'): void {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    this.#geoJsonManager!.clearAllGeoJsonLayers(clearType);
  }

  /**
   * 显示图层
   * @param layerId - 图层 ID
   * @returns 是否操作成功
   */
  showGeoJsonLayer(layerId: string): boolean {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.showGeoJsonLayer(layerId);
  }

  /**
   * 隐藏图层
   * @param layerId - 图层 ID
   * @returns 是否操作成功
   */
  hideGeoJsonLayer(layerId: string): boolean {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.hideGeoJsonLayer(layerId);
  }

  /**
   * 切换显隐
   * @param layerId - 图层 ID
   * @returns 切换后的显示状态，图层不存在则返回 null
   */
  toggleGeoJsonLayer(layerId: string): boolean | null {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.toggleGeoJsonLayer(layerId);
  }

  /**
   * 批量显示
   * @param layerIds - 图层 ID 数组
   * @returns 成功显示的图层数量
   */
  batchShowGeoJsonLayers(layerIds: string[]): number {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.batchShowGeoJsonLayers(layerIds);
  }

  /**
   * 批量隐藏
   * @param layerIds - 图层 ID 数组
   * @returns 成功隐藏的图层数量
   */
  batchHideGeoJsonLayers(layerIds: string[]): number {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.batchHideGeoJsonLayers(layerIds);
  }

  /**
   * 获取显示状态
   * @param layerId - 图层 ID
   * @returns 显示状态，图层不存在则返回 null
   */
  getGeoJsonLayerVisibility(layerId: string): boolean | null {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.getGeoJsonLayerVisibility(layerId);
  }

  /**
   * 获取所有 GeoJSON 图层 ID
   * @param clearType - 类型：'default'=默认图层，'custom'=自定义图层，'all'=所有图层（默认 'all'）
   * @returns GeoJSON 图层 ID 集合
   */
  getGeoJsonLayerIds(clearType: ClearType = 'all'): Set<string> {
    this.#checkManager(this.#geoJsonManager, 'GeoJsonManager');
    return this.#geoJsonManager!.getGeoJsonLayerIds(clearType);
  }

  // ===================== 图层操作 =====================
  /**
   * 监听点击事件
   */
  clickLayer(callback: (pickedObject: ClickObject) => void) {
    const handler = new ScreenSpaceEventHandler(this.getViewer()?.scene.canvas);
    handler.setInputAction((clickEvent: { position: Cartesian2 }) => {
      // 在点击位置进行拾取
      const pickedObject = CesiumUtilsSingleton.getViewer()?.scene.pick(
        clickEvent.position
      );
      callback(pickedObject);
    }, ScreenSpaceEventType.LEFT_CLICK);
  }

  // ===================== 视角控制 =====================

  /**
   * 飞行到目标位置
   * @param target - 目标位置 [经度, 纬度, 高度] 或 Cartesian3
   * @param duration - 飞行持续时间（秒，默认 2）
   */
  flyToTarget(
    target: [number, number, number] | Cartesian3,
    duration = 2
  ): void {
    this.#checkManager(this.#cameraController, 'CameraController');
    this.#cameraController!.flyToTarget(target, duration);
  }

  /**
   * 跳转到目标位置
   * @param target - 目标位置 [经度, 纬度, 高度] 或 Cartesian3
   */
  viewToTarget(target: [number, number, number] | Cartesian3): void {
    this.#checkManager(this.#cameraController, 'CameraController');
    this.#cameraController!.viewToTarget(target);
  }

  // ===================== 清除与资源管理 =====================

  /**
   * 清除所有资源
   * @param clearType - 清除类型：'default'=默认资源，'custom'=自定义资源，'all'=所有资源（默认 'custom'）
   */
  clearAllResources(clearType: ClearType = 'custom'): void {
    this.clearAllEntities(clearType);
    this.clearAllPrimitives(clearType);
    this.clearAllLayers(clearType);
    this.clearAllGeoJsonLayers(clearType);
  }

  // ===================== getter 和 setter函数 =====================

  /**
   * 获取 Viewer 实例
   * @returns Viewer 实例，如果未初始化则返回 null
   */
  getViewer(): Viewer | null {
    return this.#viewerManager.getViewer();
  }

  // ===================== 辅助函数 =====================

  /**
   * 转换位置坐标
   * @param pos - 位置坐标
   * @returns Cartesian3 坐标
   */
  convertPosition(pos: Cartesian3 | [number, number, number]): Cartesian3 {
    return Array.isArray(pos)
      ? Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0)
      : pos;
  }

  /**
   * 批量转换位置坐标
   * @param positions - 位置坐标数组
   * @returns Cartesian3 坐标数组
   */
  convertPositionArray(
    positions: (Cartesian3 | [number, number, number])[]
  ): Cartesian3[] {
    return positions.map((pos) => this.convertPosition(pos));
  }

  /**
   * 将Cartesian3坐标转换为屏幕坐标
   * @param pos 坐标
   * @returns 偏移量
   */
  convertScreenPosition(pos: Cartesian3): { x: number; y: number } {
    const windowCoord = SceneTransforms.wgs84ToWindowCoordinates(
      this.getViewer()!.scene,
      pos
    );
    return { x: windowCoord.x, y: windowCoord.y };
  }

  // ===================== 私有方法 =====================

  /**
   * 检查管理器是否已初始化
   * @param manager - 管理器实例
   * @param managerName - 管理器名称（用于错误提示）
   */
  #checkManager(manager: unknown, managerName: string): void {
    if (!manager) {
      throw new Error(`${managerName} 未初始化，请先调用 initCesiumViewer()`);
    }
  }
}

/**
 * CesiumUtils 单例实例
 */
export const CesiumUtilsSingleton = new CesiumUtils();
