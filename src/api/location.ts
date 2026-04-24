import config from '@/config/config.json'
import type { LivingCircleResponse } from '@/types/PointResponse'

interface AmapIpLocationResponse {
  status: '0' | '1'
  info: string
  province: string
  city: string
  adcode: string
  rectangle: string
}

interface AmapReverseGeocodeResponse {
  status: '0' | '1'
  info: string
  regeocode?: {
    formatted_address: string
    addressComponent: {
      province: string
      city: string | string[]
      district: string
      adcode: string
    }
  }
}

const AMAP_BASE_URL = 'https://restapi.amap.com'

const buildUrl = (path: string, query: Record<string, string>) => {
  const url = new URL(path, AMAP_BASE_URL)
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url.toString()
}

export const getLocationByIp = async (): Promise<AmapIpLocationResponse> => {
  const url = buildUrl('/v3/ip', {
    key: config.gaodeApi,
  })
  const response = await fetch(url)
  return response.json()
}

export const getAddressByCoordinate = async (
  lon: number,
  lat: number
): Promise<AmapReverseGeocodeResponse> => {
  const url = buildUrl('/v3/geocode/regeo', {
    key: config.gaodeApi,
    location: `${lon},${lat}`,
    extensions: 'base',
  })
  const response = await fetch(url)
  return response.json()
}

/**
 * 生活圈类型配置
 * 基于高德地图POI分类编码标准
 */
const LIVING_CIRCLE_TYPES = {
  // 餐饮类
  restaurant: '050100|050101|050102|050103|050104|050105|050106|050107', // 中餐厅|西餐厅|快餐|咖啡厅|甜品店|其他餐饮
  // 购物类
  supermarket: '060102|060103', // 超市|便利店
  shopping_mall: '060100|060101', // 商场|购物中心
  bakery: '050108', // 面包店/糕点店
  // 交通类
  bus_station: '150700|150701', // 公交车站|BRT车站
  bike_sharing: '150900', // 共享单车停放点
  parking: '151000|151001|151002', // 停车场|室内停车场|路边停车位
  gas_station: '180100', // 加油站
  // 休闲娱乐
  park: '110100|110101|110102|110103', // 公园|广场|风景名胜区|森林公园
  gym: '080100|080101|080102', // 健身房|健身中心|体育场馆
  // 教育类
  school: '141200|141201|141202|141203|141204|141205', // 幼儿园|小学|中学|大学|职业学校|培训机构
  kindergarten: '141200', // 幼儿园
  library: '140100|140101', // 图书馆|图书室
  // 医疗类
  hospital: '090100|090101', // 综合医院|专科医院
  pharmacy: '090103', // 药店
  clinic: '090102', // 诊所
  // 住宅类
  residential: '120200|120201|120202', // 住宅小区|别墅|宿舍
  // 公共服务
  government: '130100|130101|130102|130103', // 政府机构|行政机关|司法机关|民主党派
  restroom: '170100', // 公共厕所
  // 咖啡茶饮
  coffee: '050104|050109', // 咖啡厅|茶座
} as const

/**
 * POI类型键名列表（用于前端选择）
 */
export type PoiTypeKey = keyof typeof LIVING_CIRCLE_TYPES

/**
 * POI类型显示名称映射
 */
export const POI_TYPE_LABELS: Record<PoiTypeKey, string> = {
  restaurant: '餐厅',
  supermarket: '超市',
  bus_station: '公交站',
  park: '公园',
  bike_sharing: '共享单车',
  bakery: '面包店',
  gas_station: '加油站',
  gym: '健身房',
  coffee: '咖啡店',
  shopping_mall: '商场',
  parking: '停车场',
  library: '图书馆',
  restroom: '洗手间',
  residential: '小区',
  school: '学校',
  pharmacy: '药店',
  hospital: '医院',
  kindergarten: '幼儿园',
  clinic: '诊所',
  government: '政府机构',
}

/**
 * 根据时间和距离获取生活圈POI数据（支持获取全部数据）
 * @param lon - 经度
 * @param lat - 纬度
 * @param type - 查询类型：'time'(时间) | 'distance'(距离)
 * @param value - 数值（分钟或米）
 * @param poiType - POI类型，默认为'all'获取所有类型
 * @returns 生活圈POI列表（自动获取所有页数据）
 */
export const getLivingCirclePois = async (
  lon: number,
  lat: number,
  type: 'time' | 'distance',
  value: number,
  poiType: string = 'all'
): Promise<LivingCircleResponse> => {
  // 计算搜索半径
  let radius: number
  if (type === 'time') {
    // 步行速度约 80米/分钟，将时间转换为距离
    radius = value * 80
  } else {
    // 直接使用距离值
    radius = value
  }

  // 限制最大搜索半径为5000米
  radius = Math.min(radius, 5000)

  // 确定POI类型
  let types = ''
  if (poiType !== 'all' && LIVING_CIRCLE_TYPES[poiType as keyof typeof LIVING_CIRCLE_TYPES]) {
    types = LIVING_CIRCLE_TYPES[poiType as keyof typeof LIVING_CIRCLE_TYPES]
  }

  const pageSize = 50 // 每页最大50条
  let allPois: any[] = []
  let currentPage = 1
  let totalCount = 0

  // 循环获取所有页的数据
  while (true) {
    const params: Record<string, string> = {
      key: config.gaodeApi,
      location: `${lon},${lat}`,
      radius: radius.toString(),
      extensions: 'all',
      offset: pageSize.toString(),
      page: currentPage.toString(),
    }

    // 如果指定了类型，添加types参数
    if (types) {
      params.types = types
    }

    const url = buildUrl('/v3/place/around', params)
    const response = await fetch(url)
    const data: LivingCircleResponse = await response.json()

    if (data.status !== '1' || !data.pois) {
      console.error('获取POI数据失败:', data.info)
      break
    }

    // 累加POI数据
    allPois = allPois.concat(data.pois)
    totalCount = parseInt(data.count) || 0

    // 判断是否还有更多数据
    if (allPois.length >= totalCount || data.pois.length < pageSize) {
      break
    }

    currentPage++

    // 防止无限循环，最多获取10页（500条）
    if (currentPage > 10) {
      console.warn('已达到最大页数限制（10页）')
      break
    }
  }

  // 返回合并后的结果
  return {
    status: '1',
    count: allPois.length.toString(),
    info: 'OK',
    pois: allPois,
  }
}
