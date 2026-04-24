// 单个地理编码信息
interface Geocode {
  /** 国家（国内地址默认返回中国） */
  country: string;
  /** 地址所在的省份名（直辖市也算省级单位） */
  province: string;
  /** 地址所在的城市名 */
  city: string;
  /** 城市编码，例如 010 */
  citycode: string;
  /** 地址所在的区，例如 朝阳区 */
  district: string;
  /** 街道，例如 阜通东大街 */
  street: string;
  /** 门牌号，例如 6号 */
  number: string;
  /** 区域编码，例如 110101 */
  adcode: string;
  /** 坐标点，格式 "经度,纬度" */
  location: string;
  /** 匹配级别（参见地理编码匹配级别列表） */
  level: string;
}

export interface PointResponse {
  /** 返回结果状态值：0-请求失败；1-请求成功 */
  status: 0 | 1;
  /** 返回结果数目（即 geocodes 数组的长度） */
  count: number;
  /** 状态说明，成功时为 "OK"，失败时为具体错误原因 */
  info: string;
  /** 地理编码信息列表（失败时通常为空数组） */
  geocodes: Geocode[];
}

/**
 * POI兴趣点信息
 */
export interface PoiInfo {
  /** POI名称 */
  name: string;
  /** POI类型 */
  type: string;
  /** POI类型编码 */
  typecode: string;
  /** 经纬度坐标 "经度,纬度" */
  location: string;
  /** 地址 */
  address: string;
  /** 距离（米） */
  distance?: string;
  /** 联系电话 */
  tel?: string;
  /** POI ID */
  id: string;
}

/**
 * 生活圈查询响应
 */
export interface LivingCircleResponse {
  /** 返回结果状态值：0-请求失败；1-请求成功 */
  status: '0' | '1';
  /** 返回结果数目 */
  count: string;
  /** 状态说明 */
  info: string;
  /** POI列表 */
  pois: PoiInfo[];
}
