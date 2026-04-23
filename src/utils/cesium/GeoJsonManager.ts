import {
  DataSource,
  GeoJsonDataSource,
  ConstantProperty,
  ColorMaterialProperty,
  LabelGraphics,
  LabelStyle,
  Cartesian2,
  VerticalOrigin,
  HorizontalOrigin,
  Color,
  ConstantPositionProperty,
  Cartesian3,
  Cartographic,
  JulianDate,
  NearFarScalar,
} from 'cesium';
import type {
  CustomizeGeoJsonDataSource,
  GeoJsonOptions,
} from '@/types/cesium/GeoJsonOptions';
import type { LabelConfig } from '@/types/cesium/LabelConfig';
import type { Viewer, Entity } from 'cesium';

// 定义清除类型枚举
export type ClearType = 'default' | 'custom' | 'all';

/**
 * GeoJSON 图层管理器
 */
export class GeoJsonManager {
  #viewer: Viewer;
  #defaultGeoJsonMap = new Map<string, DataSource>();
  #customGeoJsonMap = new Map<string, DataSource>();

  // 默认配置
  static readonly DEFAULT_OPTIONS: Required<GeoJsonOptions> = {
    showName: false,
    isDefault: false,
    labelStyle: {
      labelFont: '16px "微软雅黑"',
      labelColor: Color.RED,
      backgroundColor: Color.BLACK,
      labelSize: 16,
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.CENTER,
      labelOffset: new Cartesian2(0, -10),
    },
    polygonStyle: {
      fill: true,
      fillColor: Color.RED.withAlpha(0.3),
      outline: true,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
    },
    polylineStyle: {
      width: 2,
      material: Color.BLUE,
      clampToGround: true,
    },
    pointStyle: {
      pixelSize: 8,
      color: Color.RED,
      outlineColor: Color.WHITE,
      outlineWidth: 2,
    },
    onComplete: () => {},
  };

  constructor(viewer: Viewer) {
    this.#viewer = viewer;
  }

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
    if (this.#exists(layerId)) throw new Error(`图层 ${layerId} 已存在`);
    const opt = this.#mergeOptions(options);

    // 加载并应用样式
    const dataSource = await GeoJsonDataSource.load(geojsonData);
    dataSource.entities.values.forEach((e) => this.#applyStyle(e, opt));

    // 添加到地图
    await this.#viewer.dataSources.add(dataSource);
    if (opt.isDefault) {
      this.#defaultGeoJsonMap.set(layerId, dataSource);
    } else {
      this.#customGeoJsonMap.set(layerId, dataSource);
    }
    // 如果需要显示标签，调用 addLabelsToDataSource
    if (opt.showName && opt.labelStyle) {
      this.#addLabelsToDataSource(dataSource, {
        labelText: opt.labelStyle.labelText,
        labelFont: opt.labelStyle.labelFont,
        labelColor: opt.labelStyle.labelColor,
        labelSize: opt.labelStyle.labelSize,
        labelOffset: opt.labelStyle.labelOffset,
        horizontalOrigin: opt.labelStyle.horizontalOrigin,
        verticalOrigin: opt.labelStyle.verticalOrigin,
        backgroundColor: opt.labelStyle.backgroundColor,
        center: opt.labelStyle.center,
      });
    }

    opt.onComplete(dataSource);
    return dataSource;
  }

  /**
   * 根据ID查询图层
   * @param layerId - 图层 ID
   * @returns DataSource 实例，不存在则返回 undefined
   */
  getGeoJsonLayerById(layerId: string): DataSource | undefined {
    return this.#getGeoJsonLayer(layerId).ds;
  }

  /**
   * 删除图层
   * @param layerId - 图层 ID
   * @returns 是否删除成功
   */
  removeGeoJsonLayer(layerId: string): boolean {
    const { isDefault, ds } = this.#getGeoJsonLayer(layerId);
    if (!ds) return false;

    const removed = this.#viewer.dataSources.remove(ds, true);
    if (removed) {
      if (isDefault) {
        this.#defaultGeoJsonMap.delete(layerId);
      } else {
        this.#customGeoJsonMap.delete(layerId);
      }
    }
    return removed;
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
    await Promise.all(
      layerConfigs.map(({ layerId, geojsonData, options }) =>
        this.addGeoJsonLayer(layerId, geojsonData, options)
      )
    );
  }

  /**
   * 批量删除
   * @param layerIds - 图层 ID 数组
   */
  batchRemoveGeoJsonLayers(layerIds: string[]): void {
    layerIds.forEach((id) => this.removeGeoJsonLayer(id));
  }

  /**
   * 清空图层
   * @param clearType - 清除类型：'default'=默认图层，'custom'=自定义图层，'all'=所有图层（默认 'custom'）
   */
  clearAllGeoJsonLayers(clearType: ClearType = 'custom'): void {
    const maps = {
      default: this.#defaultGeoJsonMap,
      custom: this.#customGeoJsonMap,
      all: new Map([...this.#defaultGeoJsonMap, ...this.#customGeoJsonMap]),
    };

    maps[clearType].forEach((ds) => this.#viewer.dataSources.remove(ds, true));
    if (clearType === 'all') {
      this.#defaultGeoJsonMap.clear();
      this.#customGeoJsonMap.clear();
    } else {
      maps[clearType].clear();
    }
  }

  /**
   * 显示图层
   * @param layerId - 图层 ID
   * @returns 是否操作成功
   */
  showGeoJsonLayer(layerId: string): boolean {
    const ds = this.getGeoJsonLayerById(layerId);
    if (!ds) return false;
    ds.show = true;
    ds.entities.values.forEach(
      (e) => e.label && (e.label.show = new ConstantProperty(true))
    );
    return true;
  }

  /**
   * 隐藏图层
   * @param layerId - 图层 ID
   * @returns 是否操作成功
   */
  hideGeoJsonLayer(layerId: string): boolean {
    const ds = this.getGeoJsonLayerById(layerId);
    if (!ds) return false;
    ds.show = false;
    ds.entities.values.forEach(
      (e) => e.label && (e.label.show = new ConstantProperty(false))
    );
    return true;
  }

  /**
   * 切换显隐
   * @param layerId - 图层 ID
   * @returns 切换后的显示状态，图层不存在则返回 null
   */
  toggleGeoJsonLayer(layerId: string): boolean | null {
    const ds = this.getGeoJsonLayerById(layerId);
    if (!ds) return null;
    const state = !ds.show;
    ds.show = state;
    ds.entities.values.forEach(
      (e) => e.label && (e.label.show = new ConstantProperty(state))
    );
    return state;
  }

  /**
   * 批量显示
   * @param layerIds - 图层 ID 数组
   * @returns 成功显示的图层数量
   */
  batchShowGeoJsonLayers(layerIds: string[]): number {
    return layerIds.reduce(
      (n, id) => n + (this.showGeoJsonLayer(id) ? 1 : 0),
      0
    );
  }

  /**
   * 批量隐藏
   * @param layerIds - 图层 ID 数组
   * @returns 成功隐藏的图层数量
   */
  batchHideGeoJsonLayers(layerIds: string[]): number {
    return layerIds.reduce(
      (n, id) => n + (this.hideGeoJsonLayer(id) ? 1 : 0),
      0
    );
  }

  /**
   * 获取显示状态
   * @param layerId - 图层 ID
   * @returns 显示状态，图层不存在则返回 null
   */
  getGeoJsonLayerVisibility(layerId: string): boolean | null {
    const ds = this.getGeoJsonLayerById(layerId);
    return ds ? ds.show : null;
  }

  /**
   * 获取所有 GeoJSON 图层 ID
   * @param clearType - 类型：'default'=默认图层，'custom'=自定义图层，'all'=所有图层（默认 'all'）
   * @returns GeoJSON 图层 ID 集合
   */
  getGeoJsonLayerIds(clearType: ClearType = 'all'): Set<string> {
    return this.#getTargetIdsByType(clearType);
  }

  // ===================== 私有方法 =====================

  /** 图层是否存在 */
  #exists(layerId: string): boolean {
    return (
      this.#defaultGeoJsonMap.has(layerId) ||
      this.#customGeoJsonMap.has(layerId)
    );
  }

  /** 合并用户配置 + 默认配置 */
  #mergeOptions(options?: GeoJsonOptions): Required<GeoJsonOptions> {
    return {
      ...GeoJsonManager.DEFAULT_OPTIONS,
      ...options,
      labelStyle: {
        ...GeoJsonManager.DEFAULT_OPTIONS.labelStyle,
        ...options?.labelStyle,
      },
      polygonStyle: {
        ...GeoJsonManager.DEFAULT_OPTIONS.polygonStyle,
        ...options?.polygonStyle,
      },
      polylineStyle: {
        ...GeoJsonManager.DEFAULT_OPTIONS.polylineStyle,
        ...options?.polylineStyle,
      },
      pointStyle: {
        ...GeoJsonManager.DEFAULT_OPTIONS.pointStyle,
        ...options?.pointStyle,
      },
    };
  }

  /** 统一应用样式到实体 */
  #applyStyle(entity: Entity, options: Required<GeoJsonOptions>): void {
    const { polygonStyle, polylineStyle, pointStyle } = options;

    if (entity.point) {
      Object.assign(entity.point, {
        pixelSize: new ConstantProperty(pointStyle.pixelSize),
        color: new ConstantProperty(pointStyle.color),
        outlineColor: new ConstantProperty(pointStyle.outlineColor),
        outlineWidth: new ConstantProperty(pointStyle.outlineWidth),
      });
    }

    if (entity.polyline) {
      Object.assign(entity.polyline, {
        width: new ConstantProperty(polylineStyle.width),
        material: new ColorMaterialProperty(polylineStyle.material as Color),
        clampToGround: new ConstantProperty(polylineStyle.clampToGround),
      });
    }

    if (entity.polygon) {
      Object.assign(entity.polygon, {
        fill: new ConstantProperty(polygonStyle.fill),
        material: new ColorMaterialProperty(polygonStyle.fillColor as Color),
        outline: new ConstantProperty(polygonStyle.outline),
        outlineColor: new ConstantProperty(polygonStyle.outlineColor),
        outlineWidth: new ConstantProperty(polygonStyle.outlineWidth),
      });
    }
  }

  /**
   * 添加标签到数据源
   * - 禁用描边以提升渲染性能
   * - 添加距离衰减以减少远距离渲染负担
   */
  #addLabelsToDataSource(dataSource: DataSource, label: LabelConfig): void {
    const entities = dataSource.entities.values;

    entities.forEach((entity) => {
      const labelText = label?.labelText || 'name';

      const center: Cartesian3 | [number, number, number] =
        label.center || this.#calculateTheCenterPositionOfTheSurface(entity);

      // 设置中心位置
      entity.position = new ConstantPositionProperty(
        this.#convertPosition(center)
      );

      if (labelText && entity.position) {
        entity.label = new LabelGraphics({
          text: new ConstantProperty(labelText),
          font: new ConstantProperty(
            label?.labelFont || `${label?.labelSize || 16}px "微软雅黑"`
          ),
          fillColor: new ConstantProperty(label?.labelColor || Color.WHITE),
          // 性能优化：禁用描边
          style: new ConstantProperty(LabelStyle.FILL),
          pixelOffset: new ConstantProperty(
            new Cartesian2(
              label?.labelOffset?.x || 0,
              label?.labelOffset?.y || -20
            )
          ),
          verticalOrigin: new ConstantProperty(
            label?.verticalOrigin || VerticalOrigin.CENTER
          ),
          horizontalOrigin: new ConstantProperty(
            label?.horizontalOrigin || HorizontalOrigin.CENTER
          ),
          showBackground: new ConstantProperty(true),
          backgroundColor: new ConstantProperty(
            label?.backgroundColor || Color.TRANSPARENT
          ),
          backgroundPadding: new ConstantProperty(new Cartesian2(5, 3)),
          disableDepthTestDistance: new ConstantProperty(
            Number.POSITIVE_INFINITY
          ),
          // 性能优化：添加距离衰减，减少远距离渲染负担
          scaleByDistance: new ConstantProperty(
            new NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5)
          ),
          translucencyByDistance: new ConstantProperty(
            new NearFarScalar(1.5e2, 1.0, 1.5e7, 0.3)
          ),
        });
      }
    });
  }

  /** 获取图层信息 */
  #getGeoJsonLayer(layerId: string): {
    isDefault: boolean;
    ds: DataSource | undefined;
  } {
    const def = this.#defaultGeoJsonMap.get(layerId);
    if (def) return { isDefault: true, ds: def };
    const custom = this.#customGeoJsonMap.get(layerId);
    return { isDefault: false, ds: custom };
  }

  /**
   * 计算面要素的中心点作为标签位置
   */
  #calculateTheCenterPositionOfTheSurface(entity: Entity): Cartesian3 {
    if (entity.polygon) {
      const hierarchy = entity.polygon.hierarchy?.getValue(JulianDate.now());
      if (hierarchy) {
        const positions = hierarchy.positions;
        if (positions && positions.length > 0) {
          let lonSum = 0,
            latSum = 0,
            heightSum = 0;
          positions.forEach((pos: Cartesian3) => {
            const cartographic = Cartographic.fromCartesian(pos);
            lonSum += cartographic.longitude;
            latSum += cartographic.latitude;
            heightSum += cartographic.height || 0;
          });
          const centerLon = lonSum / positions.length;
          const centerLat = latSum / positions.length;
          const centerHeight = heightSum / positions.length + 100;
          return Cartesian3.fromRadians(centerLon, centerLat, centerHeight);
        }
      }
    }
    return Cartesian3.ZERO;
  }

  #convertPosition(pos: Cartesian3 | [number, number, number]): Cartesian3 {
    return Array.isArray(pos)
      ? Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0)
      : pos;
  }

  #getTargetIdsByType(clearType: ClearType): Set<string> {
    const targetIds = new Set<string>();
    if (clearType === 'default' || clearType === 'all')
      this.#defaultGeoJsonMap.forEach((_, key) => targetIds.add(key));
    if (clearType === 'custom' || clearType === 'all')
      this.#customGeoJsonMap.forEach((_, key) => targetIds.add(key));
    return targetIds;
  }
}
