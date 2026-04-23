import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 全局状态管理
 * @returns 应用状态及相关方法
 */
export const useStatusStore = defineStore('status', () => {
  // ============================ 应用级状态 ================================

  /**
   * 应用加载完成状态
   */
  const appLoadingCompleted = ref(false);

  return {
    appLoadingCompleted,
  };
});
