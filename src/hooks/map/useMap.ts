import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';
import { ScreenSpaceEventType } from 'cesium';
import type { ClickObject } from '@/types/cesium/ClickObject';
/**
 * 地图交互相关钩子函数
 * @returns 注册监听器和视角控制方法
 */
export const useMap = () => {
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
    prohibitedEvents,
  };
};
