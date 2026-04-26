<template>
  <div></div>
</template>

<script lang="ts" setup>
  import { watch } from 'vue';
  import { ElMessage } from 'element-plus';
  import { $api } from '@/api/api';
  import { useStatusStore } from '@/stores/useStatusStore';
  import { useBasicInfoStore } from '@/stores/useBasicInfoStore';
  import { wgs84ToGcj02 } from '@/utils/coord/coordTransform';

  const statusStore = useStatusStore();
  const basicInfoStore = useBasicInfoStore();

  const getBrowserCoordinate = () => {
    return new Promise<{ lon: number; lat: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('当前浏览器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lon: position.coords.longitude,
            lat: position.coords.latitude,
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        }
      );
    });
  };

  const parseIpRectangleCenter = (rectangle: string) => {
    const [start, end] = rectangle.split(';');
    if (!start || !end) return null;

    const [minLon, minLat] = start.split(',').map(Number);
    const [maxLon, maxLat] = end.split(',').map(Number);

    if (
      [minLon, minLat, maxLon, maxLat].some((value) => Number.isNaN(value))
    ) {
      return null;
    }

    return {
      lon: (minLon + maxLon) / 2,
      lat: (minLat + maxLat) / 2,
    };
  };

  const applyCurrentLocation = (payload: {
    lon: number;
    lat: number;
    province: string;
    city: string;
    district: string;
    adcode: string;
    formattedAddress: string;
    source: 'gps' | 'ip';
  }) => {
    basicInfoStore.originPoint.lon = payload.lon;
    basicInfoStore.originPoint.lat = payload.lat;
    basicInfoStore.targetPoint.lon = payload.lon;
    basicInfoStore.targetPoint.lat = payload.lat;

    basicInfoStore.currentLocation.province = payload.province;
    basicInfoStore.currentLocation.city = payload.city;
    basicInfoStore.currentLocation.district = payload.district;
    basicInfoStore.currentLocation.adcode = payload.adcode;
    basicInfoStore.currentLocation.formattedAddress = payload.formattedAddress;
    basicInfoStore.currentLocation.source = payload.source;
  };

  const loadCurrentLocation = async () => {
    try {
      const coordinate = await getBrowserCoordinate();
      // 高德底图与接口使用 GCJ-02，这里将浏览器 WGS84 坐标转为 GCJ-02
      const gcjCoordinate = wgs84ToGcj02(coordinate.lon, coordinate.lat);
      const regeoResp = await $api.location.getAddressByCoordinate(
        gcjCoordinate.lon,
        gcjCoordinate.lat
      );

      if (regeoResp.status !== '1' || !regeoResp.regeocode) {
        throw new Error(regeoResp.info || '逆地理编码失败');
      }

      const addressComponent = regeoResp.regeocode.addressComponent;
      applyCurrentLocation({
        lon: gcjCoordinate.lon,
        lat: gcjCoordinate.lat,
        province: addressComponent.province || '',
        city: Array.isArray(addressComponent.city)
          ? addressComponent.city[0] || ''
          : addressComponent.city || '',
        district: addressComponent.district || '',
        adcode: addressComponent.adcode || '',
        formattedAddress: regeoResp.regeocode.formatted_address || '',
        source: 'gps',
      });

      return;
    } catch (error) {
      console.warn('GPS定位失败，降级IP定位:', error);
    }

    const ipResp = await $api.location.getLocationByIp();
    if (ipResp.status !== '1') {
      throw new Error(ipResp.info || 'IP定位失败');
    }

    const center = parseIpRectangleCenter(ipResp.rectangle);
    if (!center) {
      throw new Error('IP定位坐标解析失败');
    }

    applyCurrentLocation({
      lon: center.lon,
      lat: center.lat,
      province: ipResp.province || '',
      city: ipResp.city || '',
      district: '',
      adcode: ipResp.adcode || '',
      formattedAddress: `${ipResp.province || ''}${ipResp.city || ''}`,
      source: 'ip',
    });
  };

  let hasLoaded = false;

  watch(
    () => statusStore.appLoadingCompleted,
    async (completed) => {
      if (!completed || hasLoaded) {
        return;
      }

      hasLoaded = true;

      try {
        await loadCurrentLocation();
      } catch (error) {
        hasLoaded = false;
        ElMessage.error('获取当前所在地失败，请稍后重试');
        console.error('获取当前所在地失败:', error);
      }
    },
    { immediate: true }
  );
</script>

<style scoped></style>
