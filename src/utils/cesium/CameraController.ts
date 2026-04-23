import { Cartesian3, Cartographic, Math as CesiumMath } from 'cesium';
import { Rectangle, type Viewer } from 'cesium';

/**
 * 相机控制器
 */
export class CameraController {
  #viewer: Viewer;

  // 设置相机相关参数
  #minHeight: number = 0;
  #maxHeight: number = Number.MAX_VALUE;
  #oldListener: (() => void) | null = null;

  constructor(viewer: Viewer) {
    this.#viewer = viewer;
  }

  /**
   * 飞行到目标位置
   * @param target - 目标位置 [经度, 纬度, 高度] 或 Cartesian3
   * @param duration - 飞行持续时间（秒，默认 2）
   */
  flyToTarget(
    target: [number, number, number] | Cartesian3,
    duration = 2
  ): void {
    const position = this.#convertPosition(target);
    const cartographic = Cartographic.fromCartesian(position);
    this.#viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        CesiumMath.toDegrees(cartographic.longitude),
        CesiumMath.toDegrees(cartographic.latitude),
        cartographic.height
      ),
      duration,
    });
  }

  /**
   * 调整视角到目标位置
   * @param target - 目标位置 [经度, 纬度, 高度] 或 Cartesian3
   */
  viewToTarget(target: [number, number, number] | Cartesian3): void {
    const position = this.#convertPosition(target);
    this.#viewer?.camera.setView({
      destination: position,
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0.0,
      },
    });
  }

  /**
   * 滚轮事件处理
   * @param event - 滚轮事件
   * @param minHeight - 最小高度
   * @param maxHeight - 最大高度
   */
  setHeightLimits(minHeight: number, maxHeight: number): void {
    this.#minHeight = minHeight;
    this.#maxHeight = maxHeight;

    // 移除旧的监听器
    if (this.#oldListener) {
      this.#removeOldListener();
    }

    // 添加相机移动结束监听器，约束高度
    this.#oldListener = this.#viewer.camera.moveEnd.addEventListener(() => {
      const currentHeight = this.#getCameraHeight();

      if (currentHeight < this.#minHeight) {
        // 低于最小高度，调整到最小高度
        this.#setCameraHeight(this.#minHeight);
      } else if (currentHeight > this.#maxHeight) {
        // 高于最大高度，调整到最大高度
        this.#setCameraHeight(this.#maxHeight);
      }
    });
  }

  /**
   * 清除高度限制
   */
  clearHeightLimits(): void {
    if (this.#oldListener) {
      this.#removeOldListener();
      this.#oldListener = null;
    }
    this.#minHeight = 0;
    this.#maxHeight = Number.MAX_VALUE;
  }

  /**
   * 监听相机移动结束事件，并判断相机是否超出指定矩形范围
   * @param rectangle - 矩形范围
   * @param duration - 飞行持续时间（秒）
   */
  outOverView(rectangle: Rectangle, duration: number): void {
    // 监听相机移动结束事件
    this.#viewer.scene.camera.moveEnd.addEventListener(() => {
      if (this.#isOutOverView(rectangle)) {
        // 执行飞行动画，飞回西安范围
        this.#viewer.camera.flyTo({
          destination: rectangle,
          duration: duration,
        });
      }
    });
  }

  // ===================== 私有方法 =====================

  #convertPosition(pos: Cartesian3 | [number, number, number]): Cartesian3 {
    return Array.isArray(pos)
      ? Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0)
      : pos;
  }

  /**
   * 获取相机高度
   * @returns 相机高度
   */
  #getCameraHeight(): number {
    const cartographic = Cartographic.fromCartesian(
      this.#viewer.camera.position
    );
    return cartographic.height;
  }

  /**
   * 设置相机高度
   * @param height - 目标高度（米）
   */
  #setCameraHeight(height: number): void {
    const cartographic = Cartographic.fromCartesian(
      this.#viewer.camera.position
    );
    const newPosition = Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      height
    );
    this.#viewer.camera.setView({
      destination: newPosition,
    });
  }

  /**
   * 移除旧的监听器
   */
  #removeOldListener(): void {
    if (this.#oldListener) {
      this.#viewer.camera.moveEnd.removeEventListener(this.#oldListener);
      this.#oldListener = null;
    }
  }

  /**
   * 判断相机是否超出指定矩形范围
   * @param rectangle - 矩形范围
   * @returns 是否超出
   */
  #isOutOverView(rectangle: Rectangle): boolean {
    // 获取当前相机的可视范围
    const currentViewRect = this.#viewer.camera.computeViewRectangle();

    // 如果无法获取可视范围，直接返回 false，不做处理
    if (!currentViewRect) return false;

    // 判断两个矩形是否相交
    // 如果相交，返回false， 如果不相交，返回true
    const intersectionResult = Rectangle.intersection(
      currentViewRect,
      rectangle
    );

    // 如果不相交，则说明已经超出视角
    if (!intersectionResult) {
      return true;
    }
    return false;
  }
}
