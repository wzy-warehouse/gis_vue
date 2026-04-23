import { defineStore } from 'pinia';
import { reactive, type Reactive } from 'vue';
import config from '@/config/config.json';
import type { PointResponse } from '@/types/PointResponse';

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
   * 查询点列表
   */
  const pointsList: Reactive<PointResponse[]> = reactive([]);

  return { originPoint, targetPoint, pointsList };
});
