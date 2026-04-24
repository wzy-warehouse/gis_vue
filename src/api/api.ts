import { getSm2PublicKey } from './crypto';
import { getAddressByCoordinate, getLocationByIp } from './location';

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

  // 定位模块
  location: {
    /**
     * 根据IP获取当前所在地
     */
    getLocationByIp: () => getLocationByIp(),

    /**
     * 根据经纬度获取地址
     */
    getAddressByCoordinate: (lon: number, lat: number) =>
      getAddressByCoordinate(lon, lat),
  },
};
