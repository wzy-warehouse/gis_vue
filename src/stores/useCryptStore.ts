import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';

/**
 * 加密相关状态管理
 * @returns SM2公钥状态
 */
export const useCryptStore = defineStore('crypt', () => {
  /**
   * SM2公钥
   */
  const sm2PublicKey: Ref<string> = ref('');

  return { sm2PublicKey };
});
