<template>
  <div></div>
</template>

<script lang="ts" setup>
  import { watch } from 'vue';
  import { useBasicInfoStore } from '@/stores/useBasicInfoStore.ts';
  import config from '@/config/config.json';
  import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';
  import type { WalkingRouteResponse } from '@/types/PointResponse';
  import { ElMessage, ElLoading } from 'element-plus';

  /**
   * 绘制步行路线
   * @param routeData - 高德地图路径规划返回的route对象
   */
  const drawRoute = (routeData: any) => {
    if (!routeData || !routeData.paths || routeData.paths.length === 0) {
      console.warn('无效的路径数据');
      return;
    }

    // 清除之前的路线
    CesiumUtilsSingleton.clearWalkingRoute('walking_route');

    const path = routeData.paths[0];
    const steps = path.steps;
    const entityIds: string[] = [];

    // 为每个step创建一条线
    steps.forEach((step: any, index: number) => {
      if (!step.polyline) return;

      // 解析polyline字符串为坐标数组
      const coordinates = step.polyline.split(';');
      const positions = coordinates.map((coord: string) => {
        const [lon, lat] = coord.split(',').map(Number);
        return CesiumUtilsSingleton.convertPosition([lon, lat, 0]);
      });

      if (positions.length < 2) return;

      const entityId = `walking_route_step_${index}`;

      CesiumUtilsSingleton.addCesiumEntity({
        id: entityId,
        position: positions[0],
        type: 'polyline',
        polylineOptions: {
          positions,
          color: undefined, // 使用默认蓝色
          width: 5,
          clampToGround: true, // 贴地显示
        },
        attributes: {
          stepIndex: index,
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration,
        },
      });

      entityIds.push(entityId);
    });

    console.log(`成功绘制 ${entityIds.length} 段路线`);
    ElMessage.success(`路径规划成功，共 ${path.distance} 米，预计 ${path.duration} 秒`);

    // 飞行到起点
    if (steps.length > 0 && steps[0].polyline) {
      const firstCoord = steps[0].polyline.split(';')[0];
      const [lon, lat] = firstCoord.split(',').map(Number);
      CesiumUtilsSingleton.flyToTarget([lon, lat, 1000], 2);
    }
  };

  /**
   * 监听clickHere变化，发起路径规划请求
   */
  watch(
    () => useBasicInfoStore().clickHere,
    async (newValue) => {
      if (!newValue) return;

      let loadingInstance: any = null;

      try {
        // 显示加载提示
        loadingInstance = ElLoading.service({
          lock: true,
          text: '正在规划路径...',
          background: 'rgba(0, 0, 0, 0.7)',
        });

        // 使用fetch直接请求高德地图API（绕过httpInstance的加解密）
        const url = `https://restapi.amap.com/v3/direction/walking?key=${config.gaodeApi}&origin=${useBasicInfoStore().originPoint.lon},${useBasicInfoStore().originPoint.lat}&destination=${useBasicInfoStore().targetPoint.lon},${useBasicInfoStore().targetPoint.lat}`;

        const response = await fetch(url);
        const res: WalkingRouteResponse = await response.json();

        console.log('路径规划响应:', res);

        if (res.status === '1' && res.route) {
          // 绘制路线
          drawRoute(res.route);
        } else {
          console.error('路径规划失败:', res.info);
          ElMessage.error(`路径规划失败: ${res.info}`);
        }
      } catch (error) {
        console.error('路径规划请求失败:', error);
        ElMessage.error('路径规划失败，请检查网络连接');
      } finally {
        // 关闭加载提示
        if (loadingInstance) {
          loadingInstance.close();
        }

        // 重置clickHere状态
        useBasicInfoStore().clickHere = false;
      }
    }
  );
</script>

<style scoped></style>
