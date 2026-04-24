import { defineStore } from 'pinia';
import { reactive, type Reactive } from 'vue';
import config from '@/config/config.json';
import type { PoiInfo } from '@/types/PointResponse';

/**
 * 基础信息仓库
 */
export const useBasicInfoStore = defineStore('basicInfo', () => {
  /**
   * 源点信息
   * lat: 纬度
   * lng: 经度
   * height: 高度
   */
  const originPoint = reactive({
    lon: config.defaultPosition[0],
    lat: config.defaultPosition[1],
    height: config.defaultPosition[2],
  });

  /**
   * 目标点信息
   */
  const targetPoint = reactive({
    lon: config.defaultPosition[0],
    lat: config.defaultPosition[1],
    height: config.defaultPosition[2],
  });

  /**
   * 查询条件
   */
  const query: Reactive<{ type: 'time' | 'distance'; value: number }> =
    reactive({
      type: 'time',
      value: 0,
    });

  /**
   * 生活圈POI数据列表
   */
  const livingCirclePois: Reactive<PoiInfo[]> = reactive([]);

  /**
   * 当前选中的POI类型（用于筛选）
   */
  const selectedPoiType = reactive({
    type: 'all' as string,
  });

  /**
   * 当前用户所在地信息
   */
  const currentLocation = reactive({
    province: '',
    city: '',
    district: '',
    adcode: '',
    formattedAddress: '',
    source: '' as '' | 'gps' | 'ip',
  });

  return {
    originPoint,
    targetPoint,
    query,
    livingCirclePois,
    selectedPoiType,
    currentLocation,
  };
});
