import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';
import { ScreenSpaceEventType, Cartesian3 } from 'cesium';
import type { ClickObject } from '@/types/cesium/ClickObject';
import { useBasicInfoStore } from '@/stores/useBasicInfoStore';

/**
 * 地图交互相关钩子函数
 * @returns 注册监听器和视角控制方法
 */
export const useMap = () => {
  const basicInfoStore = useBasicInfoStore();

  /**
   * 注册全局点击监听器
   */
  const registerAndClickOnTheListener = () => {
    CesiumUtilsSingleton.clickLayer((pickedObject: ClickObject) => {
      if (
        pickedObject &&
        pickedObject.id &&
        typeof pickedObject.id === 'string'
      ) {
        const matchResult = pickedObject.id.match(/\d+$/);
        const id = matchResult ? parseInt(matchResult[0]) : -1;
      }
    });
  };

  /**
   * 注册双击设置目标点监听器
   */
  const registerDoubleClickSetTarget = () => {
    const viewer = CesiumUtilsSingleton.getViewer();
    if (!viewer) return;

    viewer.screenSpaceEventHandler.setInputAction(
      (clickEvent: { position: { x: number; y: number } }) => {
        // 获取点击位置的笛卡尔坐标
        const cartesian = viewer.scene.pickPosition(clickEvent.position);
        if (cartesian) {
          // 转换为经纬度
          const cartographic = Cartesian3.fromRadians(
            Math.atan2(cartesian.y, cartesian.x),
            Math.asin(cartesian.z / Math.sqrt(cartesian.x ** 2 + cartesian.y ** 2 + cartesian.z ** 2)),
            0
          );
          
          // 获取经纬度（弧度转度）
          const lon = (Math.atan2(cartesian.y, cartesian.x) * 180) / Math.PI;
          const lat =
            (Math.asin(
              cartesian.z /
                Math.sqrt(cartesian.x ** 2 + cartesian.y ** 2 + cartesian.z ** 2)
            ) *
              180) /
            Math.PI;

          // 更新目标点
          basicInfoStore.targetPoint.lon = lon;
          basicInfoStore.targetPoint.lat = lat;
          basicInfoStore.targetPoint.height = 0;
        }
      },
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  };

  /**
   * 禁止默认事件
   */
  const prohibitedEvents = () => {
    // 禁止全局默认双击事件
    CesiumUtilsSingleton.getViewer()?.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  };

  return {
    registerAndClickOnTheListener,
    registerDoubleClickSetTarget,
    prohibitedEvents,
  };
};
