import {
  Primitive,
  BillboardCollection,
  GeometryInstance,
  CircleGeometry,
  ColorGeometryInstanceAttribute,
  PerInstanceColorAppearance,
  PolylineGeometry,
  PolylineColorAppearance,
  PolygonGeometry,
  PolygonHierarchy,
  Cartesian3,
  Color,
} from 'cesium';
import type { PrimitiveOptions } from '@/types/cesium/PrimitiveOptions';
import type { NearFarScalar, Viewer } from 'cesium';

/**
 * Primitive 管理器
 */
export class PrimitiveManager {
  #viewer: Viewer;
  #defaultPrimitiveMap = new Map<string, Primitive | BillboardCollection>();
  #customPrimitiveMap = new Map<string, Primitive | BillboardCollection>();

  constructor(viewer: Viewer) {
    this.#viewer = viewer;
  }

  /**
   * 添加单个 Primitive
   * @param primitive - Primitive 配置选项
   */
  addPrimitive(primitive: PrimitiveOptions): void {
    this.addPrimitivesBatch([primitive]);
  }

  /**
   * 批量添加 Primitive
   * - 按类型分组后批量创建，减少 scene.primitives.add 调用次数
   * - 同类型的多个实例合并到一个 Primitive 或 BillboardCollection 中
   * @param primitives - Primitive 配置选项数组
   */
  addPrimitivesBatch(primitives: PrimitiveOptions[]): void {
    if (primitives.length === 0) return;

    const grouped = this.#groupPrimitivesByType(primitives);

    // 并行添加不同类型的 Primitive
    const promises: Promise<void>[] = [];

    if (grouped.points.length > 0) {
      promises.push(Promise.resolve(this.#addPointPrimitives(grouped.points)));
    }
    if (grouped.polylines.length > 0) {
      promises.push(
        Promise.resolve(this.#addPolylinePrimitives(grouped.polylines))
      );
    }
    if (grouped.polygons.length > 0) {
      promises.push(
        Promise.resolve(this.#addPolygonPrimitives(grouped.polygons))
      );
    }
    if (grouped.billboards.length > 0) {
      promises.push(
        Promise.resolve(this.#addBillboardPrimitives(grouped.billboards))
      );
    }
  }

  /**
   * 查询 Primitive
   * @param id - Primitive ID
   * @returns Primitive 或 BillboardCollection 实例，不存在则返回 undefined
   */
  getPrimitiveById(id: string): Primitive | BillboardCollection | undefined {
    return (
      this.#defaultPrimitiveMap.get(id) || this.#customPrimitiveMap.get(id)
    );
  }

  /**
   * 删除 Primitive
   * @param id - Primitive ID
   * @returns 是否删除成功
   */
  removePrimitiveById(id: string): boolean {
    const { isDefault, primitive } = this.#getPrimitiveInfo(id);
    if (!primitive) {
      console.warn(`Primitive ID ${id} 不存在`);
      return false;
    }

    this.#viewer.scene.primitives.remove(primitive);
    this.#removePrimitiveId(id, isDefault);
    return true;
  }

  /**
   * 清除 Primitive
   * @param clearType - 清除类型：'default'=默认 Primitive，'custom'=自定义 Primitive，'all'=所有 Primitive（默认 'custom'）
   */
  clearAllPrimitives(clearType: 'default' | 'custom' | 'all' = 'custom'): void {
    const targetMap = this.#getTargetMapByType(clearType);
    targetMap.forEach((primitive) => {
      this.#viewer.scene.primitives.remove(primitive);
    });

    this.#clearMapsByType(clearType);
  }

  /**
   * 获取所有Primitive ID
   * @param clearType - 类型：'default'=默认 Primitive，'custom'=自定义 Primitive，'all'=所有 Primitive（默认 'all'）
   * @returns Primitive ID 集合
   */
  getPrimitiveIds(
    clearType: 'default' | 'custom' | 'all' = 'all'
  ): Set<string> {
    return this.#getTargetIdsByType(clearType);
  }

  /**
   * 批量显示或隐藏Primitive
   * @param ids - Primitive ID 数组
   * @param visible - 是否显示
   */
  batchTogglePrimitives(ids: string[], visible: boolean): void {
    const uniquePrimitives = new Set<Primitive | BillboardCollection>();

    for (const id of ids) {
      const primitive = this.getPrimitiveById(id);
      if (primitive) {
        uniquePrimitives.add(primitive);
      } else {
        console.warn(`Primitive ID "${id}" 不存在，无法设置显示`);
      }
    }

    for (const primitive of uniquePrimitives) {
      primitive.show = visible;
    }
  }

  /**
   * 批量显示Primitive
   * @param ids - Primitive ID 数组
   */
  batchShowPrimitives(ids: string[]): void {
    this.batchTogglePrimitives(ids, true);
  }

  /**
   * 批量隐藏Primitive
   * @param ids - Primitive ID 数组
   */
  batchHidePrimitives(ids: string[]): void {
    this.batchTogglePrimitives(ids, false);
  }

  // ===================== 私有方法 =====================

  #groupPrimitivesByType(primitives: PrimitiveOptions[]) {
    const grouped: {
      points: PrimitiveOptions[];
      polylines: PrimitiveOptions[];
      polygons: PrimitiveOptions[];
      billboards: PrimitiveOptions[];
    } = {
      points: [],
      polylines: [],
      polygons: [],
      billboards: [],
    };

    primitives.forEach((option) => {
      const { id } = option;
      this.#validatePrimitiveUniqueId(id);

      switch (option.type) {
        case 'point':
          grouped.points.push(option);
          break;
        case 'polyline':
          grouped.polylines.push(option);
          break;
        case 'polygon':
          grouped.polygons.push(option);
          break;
        case 'billboard':
          grouped.billboards.push(option);
          break;
      }
    });

    return grouped;
  }

  #validatePrimitiveUniqueId(id: string): void {
    if (this.#defaultPrimitiveMap.has(id) || this.#customPrimitiveMap.has(id)) {
      throw new Error(`Primitive ID ${id} 已存在`);
    }
  }

  #getPrimitiveInfo(id: string) {
    const isDefault = this.#defaultPrimitiveMap.has(id);
    const primitive = isDefault
      ? this.#defaultPrimitiveMap.get(id)
      : this.#customPrimitiveMap.get(id);
    return { isDefault, primitive };
  }

  #removePrimitiveId(id: string, isDefault: boolean): void {
    if (isDefault) {
      this.#defaultPrimitiveMap.delete(id);
    } else {
      this.#customPrimitiveMap.delete(id);
    }
  }

  #addPointPrimitives(options: PrimitiveOptions[]): void {
    const instances = options.map((option) => {
      const position = this.#convertPosition(option.positions[0]!);
      return new GeometryInstance({
        id: option.id,
        geometry: new CircleGeometry({
          center: position,
          radius: option.pixelSize || 8,
          vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            option.color || Color.RED
          ),
        },
      });
    });

    const primitive = new Primitive({
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({
        translucent: false,
        closed: true,
      }),
      asynchronous: false,
    });

    this.#viewer.scene.primitives.add(primitive);
    this.#storePrimitives(options, primitive);
  }

  #addPolylinePrimitives(options: PrimitiveOptions[]): void {
    const instances = options.map((option) => {
      const positions = this.#convertPositionArray(option.positions);
      return new GeometryInstance({
        id: option.id,
        geometry: new PolylineGeometry({
          positions,
          width: option.width || 3,
          vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            option.color || Color.BLUE
          ),
        },
      });
    });

    const primitive = new Primitive({
      geometryInstances: instances,
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: false,
    });

    this.#viewer.scene.primitives.add(primitive);
    this.#storePrimitives(options, primitive);
  }

  #addPolygonPrimitives(options: PrimitiveOptions[]): void {
    const instances = options.map((option) => {
      const positions = this.#convertPositionArray(option.positions);
      return new GeometryInstance({
        id: option.id,
        geometry: new PolygonGeometry({
          polygonHierarchy: new PolygonHierarchy(positions),
          vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            option.color || Color.GREEN.withAlpha(0.5)
          ),
        },
      });
    });

    const primitive = new Primitive({
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({
        translucent: true,
        closed: true,
      }),
      asynchronous: false,
    });

    this.#viewer.scene.primitives.add(primitive);
    this.#storePrimitives(options, primitive);
  }

  #addBillboardPrimitives(options: PrimitiveOptions[]): void {
    // 定义类型，仅供临时使用
    type BillboardConfig = {
      id: string;
      position: Cartesian3;
      image: string | undefined;
      scale?: number;
      color?: Color;
      scaleByDistance?: NearFarScalar;
      [key: string]: unknown;
    };

    const collection = new BillboardCollection();

    options.forEach((option) => {
      const position = this.#convertPosition(option.positions[0]!);

      const billboardConfig: BillboardConfig = {
        id: option.id,
        position,
        image: option.image,
        scale: option.scale || 1,
        color: option.color || Color.WHITE,
      };

      if (option.scaleByDistance) {
        billboardConfig.scaleByDistance = option.scaleByDistance;
      }

      if (option.customProperties) {
        Object.assign(billboardConfig, option.customProperties);
      }

      collection.add(billboardConfig);
    });

    this.#viewer.scene.primitives.add(collection);
    this.#storePrimitives(options, collection);
  }

  #storePrimitives(
    options: PrimitiveOptions[],
    primitive: Primitive | BillboardCollection
  ): void {
    options.forEach((option) => {
      if (option.isDefault) {
        this.#defaultPrimitiveMap.set(option.id, primitive);
      } else {
        this.#customPrimitiveMap.set(option.id, primitive);
      }
    });
  }

  #getTargetMapByType(
    clearType: 'default' | 'custom' | 'all'
  ): Map<string, Primitive | BillboardCollection> {
    const targetMap = new Map<string, Primitive | BillboardCollection>();
    if (clearType === 'default' || clearType === 'all')
      this.#defaultPrimitiveMap.forEach((value, key) =>
        targetMap.set(key, value)
      );
    if (clearType === 'custom' || clearType === 'all')
      this.#customPrimitiveMap.forEach((value, key) =>
        targetMap.set(key, value)
      );
    return targetMap;
  }

  #clearMapsByType(clearType: 'default' | 'custom' | 'all'): void {
    if (clearType === 'default' || clearType === 'all')
      this.#defaultPrimitiveMap.clear();
    if (clearType === 'custom' || clearType === 'all')
      this.#customPrimitiveMap.clear();
  }

  #getTargetIdsByType(clearType: 'default' | 'custom' | 'all'): Set<string> {
    const targetIds = new Set<string>();
    if (clearType === 'default' || clearType === 'all')
      this.#defaultPrimitiveMap.forEach((_, key) => targetIds.add(key));
    if (clearType === 'custom' || clearType === 'all')
      this.#customPrimitiveMap.forEach((_, key) => targetIds.add(key));
    return targetIds;
  }

  #convertPosition(pos: Cartesian3 | [number, number, number]): Cartesian3 {
    return Array.isArray(pos)
      ? Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0)
      : pos;
  }

  #convertPositionArray(
    positions: (Cartesian3 | [number, number, number])[]
  ): Cartesian3[] {
    return positions.map((pos) => this.#convertPosition(pos));
  }
}
