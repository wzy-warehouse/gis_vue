import config from '@/config/config.json'

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
