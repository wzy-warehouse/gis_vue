import { getSm2PublicKey } from './crypto';
import {
  getAddressByCoordinate,
  getLocationByIp,
  getLivingCirclePois,
} from './location';

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

    /**
     * 获取生活圈POI数据（自动获取全部数据）
     * @param lon - 经度
     * @param lat - 纬度
     * @param type - 查询类型：'time'(时间) | 'distance'(距离)
     * @param value - 数值（分钟或米）
     * @param poiType - POI类型，默认为'all'获取所有类型
     */
    getLivingCirclePois: (
      lon: number,
      lat: number,
      type: 'time' | 'distance',
      value: number,
      poiType?: string
    ) => getLivingCirclePois(lon, lat, type, value, poiType),
  },
};
