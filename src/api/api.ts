import { getSm2PublicKey } from './crypto';

/**
 * API接口统一导出对象
 */
export const $api = {
  // 加密模块
  crypto: {
    /**
     * 获取SM2公钥
     * @returns SM2公钥响应
     */
    getSm2PublicKey: () => getSm2PublicKey(),
  },
};
