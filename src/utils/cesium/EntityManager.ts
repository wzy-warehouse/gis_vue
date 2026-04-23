import {
  Entity,
  Cartesian3,
  Color,
  PointGraphics,
  PolylineGraphics,
  BillboardGraphics,
  HeightReference,
  VerticalOrigin,
  HorizontalOrigin,
  PolygonHierarchy,
  PolygonGraphics,
  GridMaterialProperty,
} from 'cesium';
import type { EntityOptions } from '@/types/cesium/EntityOptions';
import type { Viewer } from 'cesium';

/**
 * 实体管理器
 */
export class EntityManager {
  #viewer: Viewer;
  #defaultEntityIds = new Set<string>();
  #customEntityIds = new Set<string>();

  constructor(viewer: Viewer) {
    this.#viewer = viewer;
  }

  /**
   * 批量添加实体
   * @param entityOptionsList - 实体配置选项数组
   * @returns 创建的 Entity 实例数组
   */
  addCesiumEntitiesBatch(entityOptionsList: EntityOptions[]): Entity[] {
    const entities: Entity[] = [];

    // 预验证所有ID的唯一性
    entityOptionsList.forEach(({ id }) => {
      if (!id) throw new Error('实体 id 为必填项');
      this.#validateUniqueId(id);
    });

    // 批量创建并添加实体
    entityOptionsList.forEach((entityOptions) => {
      const {
        id,
        position,
        attributes = {},
        isDefault = false,
      } = entityOptions;

      if (!position) throw new Error(`实体 ${id} 的 position 为必填项`);

      const entity = new Entity({
        id,
        position: this.#convertPosition(position),
        ...attributes,
      });

      this.#configureEntityGraphics(entity, entityOptions);
      this.#viewer.entities.add(entity);
      this.#storeEntityId(id, isDefault);
      entities.push(entity);
    });

    return entities;
  }

  /**
   * 添加实体
   * @param entityOptions - 实体配置选项
   * @returns 创建的 Entity 实例
   */
  addCesiumEntity(entityOptions: EntityOptions): Entity {
    const { id, position, attributes = {}, isDefault = false } = entityOptions;

    if (!id) throw new Error('实体 id 为必填项');
    if (!position) throw new Error('实体 position 为必填项');
    this.#validateUniqueId(id);

    const entity = new Entity({
      id,
      position: this.#convertPosition(position),
      ...attributes,
    });

    this.#configureEntityGraphics(entity, entityOptions);

    this.#viewer.entities.add(entity);
    this.#storeEntityId(id, isDefault);
    return entity;
  }

  /**
   * 查询实体
   * @param entityId - 实体 ID
   * @returns Entity 实例，不存在则返回 null
   */
  getCesiumEntityById(entityId: string): Entity | null {
    if (!this.#entityExists(entityId)) return null;
    return this.#viewer.entities.getById(entityId) || null;
  }

  /**
   * 删除实体
   * @param entityId - 实体 ID
   * @returns 是否删除成功
   */
  removeCesiumEntity(entityId: string): boolean {
    if (!this.#entityExists(entityId)) {
      console.warn(`实体 ID ${entityId} 不存在`);
      return false;
    }

    const entity = this.#viewer.entities.getById(entityId);
    if (entity) {
      this.#viewer.entities.remove(entity);
      this.#removeEntityId(entityId);
      return true;
    }
    return false;
  }

  /**
   * 批量删除实体
   * @param entityIds - 实体 ID 数组
   */
  batchRemoveCesiumEntities(entityIds: string[]): void {
    entityIds.forEach((id) => this.removeCesiumEntity(id));
  }

  /**
   * 清除实体
   * @param clearType - 清除类型：'default'=默认实体，'custom'=自定义实体，'all'=所有实体（默认 'custom'）
   */
  clearAllEntities(clearType: 'default' | 'custom' | 'all' = 'custom'): void {
    const targetIds = this.#getTargetIdsByType(clearType);
    targetIds.forEach((id) => {
      const entity = this.#viewer.entities.getById(id);
      if (entity) this.#viewer.entities.remove(entity);
    });

    this.#clearCollectionsByType(clearType);
  }

  /**
   * 获取所有实体ID
   * @param clearType - 类型：'default'=默认实体，'custom'=自定义实体，'all'=所有实体（默认 'all'）
   * @returns 实体 ID 集合
   */
  getEntityIds(clearType: 'default' | 'custom' | 'all' = 'all'): Set<string> {
    return this.#getTargetIdsByType(clearType);
  }

  // ===================== 私有方法 =====================

  #configureEntityGraphics(entity: Entity, options: EntityOptions): void {
    switch (options.type) {
      case 'point': {
        const {
          color = Color.RED,
          pixelSize = 8,
          outlineColor = Color.WHITE,
          outlineWidth = 1,
          heightReference = HeightReference.CLAMP_TO_GROUND,
        } = options.pointOptions || {};
        entity.point = new PointGraphics({
          color,
          pixelSize,
          outlineColor,
          outlineWidth,
          heightReference,
        });
        break;
      }
      case 'polyline': {
        const {
          positions,
          color = Color.BLUE,
          width = 3,
          clampToGround = false,
        } = options.polylineOptions || {};
        if (!positions)
          throw new Error('线实体必须传入 polylineOptions.positions');

        entity.polyline = new PolylineGraphics({
          positions: this.#convertPositionArray(positions),
          material: color,
          width,
          clampToGround,
        });
        break;
      }
      case 'billboard': {
        const {
          image,
          scale = 1,
          color = Color.WHITE,
          verticalOrigin = VerticalOrigin.CENTER,
          horizontalOrigin = HorizontalOrigin.CENTER,
          heightReference = HeightReference.CLAMP_TO_GROUND,
        } = options.billboardOptions || {};
        if (!image)
          throw new Error('Billboard 实体必须传入 billboardOptions.image');

        entity.billboard = new BillboardGraphics({
          image,
          scale,
          color,
          verticalOrigin,
          horizontalOrigin,
          heightReference,
        });
        break;
      }
      case 'polygon': {
        const {
          hierarchy,
          outline = true,
          outlineColor = Color.BLACK,
          outlineWidth = 1,
          height = 0,
          extrudedHeight,
          heightReference = HeightReference.CLAMP_TO_GROUND,
          material = new GridMaterialProperty({
            color: Color.GREEN.withAlpha(0.3),
            cellAlpha: 0.2,
            lineCount: new Cartesian3(8, 8, 0),
            lineThickness: new Cartesian3(2.0, 2.0, 0),
          }),
        } = options.polygonOptions || {};

        if (!hierarchy)
          throw new Error('多边形实体必须传入 polygonOptions.hierarchy');

        entity.polygon = new PolygonGraphics({
          hierarchy: this.#processHierarchy(hierarchy),
          material: material,
          outline,
          outlineColor,
          outlineWidth,
          height,
          extrudedHeight,
          heightReference,
        });
        break;
      }
      default:
        throw new Error(`不支持的实体类型：${options.type}`);
    }
  }

  #processHierarchy(
    hier:
      | PolygonHierarchy
      | Cartesian3[]
      | [number, number][]
      | [number, number, number][]
  ): PolygonHierarchy {
    if (hier instanceof PolygonHierarchy) return hier;
    if (!Array.isArray(hier) || hier.length < 3) {
      throw new Error('多边形层级必须是非空数组且至少 3 个顶点');
    }

    const positions = hier.map((pos) => {
      if (pos instanceof Cartesian3) return pos;
      if (Array.isArray(pos) && pos.length >= 2) {
        return Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0);
      }
      throw new Error(
        `无效坐标格式：${JSON.stringify(pos)}，应为 [经, 纬] 或 [经, 纬, 高] 或 Cartesian3`
      );
    });

    return new PolygonHierarchy(positions);
  }

  #validateUniqueId(id: string): void {
    if (this.#defaultEntityIds.has(id) || this.#customEntityIds.has(id)) {
      throw new Error(`实体 ID ${id} 已存在`);
    }
  }

  #entityExists(id: string): boolean {
    return this.#defaultEntityIds.has(id) || this.#customEntityIds.has(id);
  }

  #storeEntityId(id: string, isDefault: boolean): void {
    if (isDefault) {
      this.#defaultEntityIds.add(id);
    } else {
      this.#customEntityIds.add(id);
    }
  }

  #removeEntityId(id: string): void {
    this.#defaultEntityIds.delete(id);
    this.#customEntityIds.delete(id);
  }

  #getTargetIdsByType(clearType: 'default' | 'custom' | 'all'): Set<string> {
    const targetIds = new Set<string>();
    if (clearType === 'default' || clearType === 'all')
      this.#defaultEntityIds.forEach((id) => targetIds.add(id));
    if (clearType === 'custom' || clearType === 'all')
      this.#customEntityIds.forEach((id) => targetIds.add(id));
    return targetIds;
  }

  #clearCollectionsByType(clearType: 'default' | 'custom' | 'all'): void {
    if (clearType === 'default' || clearType === 'all')
      this.#defaultEntityIds.clear();
    if (clearType === 'custom' || clearType === 'all')
      this.#customEntityIds.clear();
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
