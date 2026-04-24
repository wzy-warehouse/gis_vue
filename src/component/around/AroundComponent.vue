<template>
  <div></div>
</template>

<script lang="ts" setup>
  import { watch, onMounted } from 'vue';
  import { useBasicInfoStore } from '@/stores/useBasicInfoStore';
  import { $api } from '@/api/api';
  import { ElMessage, ElLoading } from 'element-plus';
  import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';

  const basicInfoStore = useBasicInfoStore();

  /**
   * 添加起点图标
   */
  const addOriginMarker = (lon: number, lat: number) => {
    // 先删除旧的起点图标（如果存在）
    CesiumUtilsSingleton.removePrimitiveById('origin_marker');
    
    // 添加新的起点图标
    CesiumUtilsSingleton.addPrimitivesBatch([
      {
        id: 'origin_marker',
        type: 'billboard' as const,
        positions: [[lon, lat, 0]] as [number, number, number][],
        image: new URL('@/assets/images/起点.png', import.meta.url).href,
        scale: 1.2,
      },
    ]);
    
    console.log('✅ 起点图标已添加:', lon, lat);
  };

  /**
   * 获取生活圈POI数据
   */
  const fetchLivingCirclePois = async () => {
    const { originPoint, query, selectedPoiType } = basicInfoStore;

    // 验证查询条件
    if (!query.value || query.value <= 0) {
      console.warn('查询值无效，请输入大于0的数值');
      return;
    }

    let loadingInstance: any = null;

    try {
      // 显示加载提示
      loadingInstance = ElLoading.service({
        lock: true,
        text: '正在获取生活圈数据...',
        background: 'rgba(0, 0, 0, 0.7)',
      });

      // 调用API获取生活圈POI数据（自动获取全部）
      const response = await $api.location.getLivingCirclePois(
        originPoint.lon,
        originPoint.lat,
        query.type,
        query.value,
        selectedPoiType.type
      );

      if (response.status === '1' && response.pois) {
        // 清空旧数据
        basicInfoStore.livingCirclePois.splice(
          0,
          basicInfoStore.livingCirclePois.length
        );
        // 添加新数据
        basicInfoStore.livingCirclePois.push(...response.pois);

        console.log(
          `成功获取 ${response.count} 个生活圈POI数据`,
          basicInfoStore.livingCirclePois
        );
        ElMessage.success(`找到 ${response.count} 个兴趣点`);
      } else {
        console.error('获取生活圈数据失败:', response.info);
        ElMessage.error(`获取数据失败: ${response.info}`);
      }
    } catch (error) {
      console.error('获取生活圈数据异常:', error);
      ElMessage.error('获取数据失败，请检查网络连接');
    } finally {
      // 关闭加载提示
      if (loadingInstance) {
        loadingInstance.close();
      }
    }
  };

  /**
   * 监听查询条件变化，自动获取生活圈数据
   */
  watch(
    () => [basicInfoStore.query.type, basicInfoStore.query.value],
    ([newType, newValue]) => {
      // 时间不能超过1小时，距离不能超过5公里
      if (newType === 'time' && (newValue as number) > 60) {
        ElMessage.warning('时间不能超过1小时');
        return;
      }
      if (newType === 'distance' && (newValue as number) > 5000) {
        ElMessage.warning('距离不能超过5公里');
        return;
      }
      // 只有当值有效时才触发查询
      if (newValue && (newValue as number) > 0) {
        fetchLivingCirclePois();
      }
    },
    { deep: true }
  );

  /**
   * 监听POI类型变化，重新查询
   */
  watch(
    () => basicInfoStore.selectedPoiType.type,
    () => {
      // 类型变化时，重新查询
      if (basicInfoStore.query.value && basicInfoStore.query.value > 0) {
        fetchLivingCirclePois();
      }
    }
  );

  /**
   * 组件挂载时添加初始起点图标
   */
  onMounted(() => {
    const { originPoint } = basicInfoStore;
    if (originPoint.lon && originPoint.lat) {
      console.log('初始化起点图标:', originPoint.lon, originPoint.lat);
      addOriginMarker(originPoint.lon, originPoint.lat);
    }
  });

  /**
   * 监听源点位置变化，更新图标和视角
   */
  watch(
    () => [basicInfoStore.originPoint.lon, basicInfoStore.originPoint.lat],
    ([newLon, newLat], [oldLon, oldLat]) => {
      // 确保新坐标有效
      if (!newLon || !newLat) {
        console.warn('源点坐标无效');
        return;
      }
      
      console.log(`源点位置变化: ${oldLon},${oldLat} -> ${newLon},${newLat}`);
      
      // 1. 视角飞到新位置（总是执行）
      CesiumUtilsSingleton.flyToTarget([newLon, newLat, 1000], 2);
      
      // 2. 添加/更新起点图标（总是执行）
      addOriginMarker(newLon, newLat);
      
      // 3. 只有当查询值有效时才重新获取生活圈数据
      if (
        basicInfoStore.query.value &&
        basicInfoStore.query.value > 0
      ) {
        console.log('查询条件有效，重新获取POI数据');
        fetchLivingCirclePois();
      } else {
        console.log('查询条件未设置，仅更新起点图标和视角');
      }
    },
    { deep: true }
  );
</script>

<style scoped></style>
