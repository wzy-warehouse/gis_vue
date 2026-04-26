<template>
  <div class="map_container" id="map-container"></div>
</template>

<script lang="ts" setup>
  import { onBeforeMount, onMounted, watch } from 'vue';
  import { useBasicInfoStore } from '@/stores/useBasicInfoStore';
  import { useStatusStore } from '@/stores/useStatusStore';
  import { HeightReference, VerticalOrigin } from 'cesium';

  import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';
  import config from '@/config/config.json';
  import { useMap } from '@/hooks/map/useMap';

  const basicInfoStore = useBasicInfoStore();
  const CURRENT_LOCATION_ENTITY_ID = 'current-location-marker';
  const CURRENT_LOCATION_ICON =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="14" fill="#1E88E5" fill-opacity="0.22"/>
        <circle cx="22" cy="22" r="8" fill="#1E88E5" stroke="#FFFFFF" stroke-width="3"/>
      </svg>`
    );

  onBeforeMount(() => {
    // 重置所有状态
    useStatusStore().appLoadingCompleted = false;
  });

  onMounted(async () => {
    // 初始化Cesium
    await CesiumUtilsSingleton.initCesiumViewer({
      containerId: 'map-container',
    });

    // 设置状态
    useStatusStore().appLoadingCompleted = true;

    // 注册全局点击监听器
    useMap().registerAndClickOnTheListener();

    // 注册双击设置目标点
    useMap().registerDoubleClickSetTarget();

    // 默认视角
    CesiumUtilsSingleton.viewToTarget(
      config.defaultPosition as [number, number, number]
    );
  });

  watch(
    () => ({
      lon: basicInfoStore.originPoint.lon,
      lat: basicInfoStore.originPoint.lat,
      source: basicInfoStore.currentLocation.source,
    }),
    ({ lon, lat, source }) => {
      if (!source || !Number.isFinite(lon) || !Number.isFinite(lat)) {
        return;
      }

      const existedEntity = CesiumUtilsSingleton.getCesiumEntityById(
        CURRENT_LOCATION_ENTITY_ID
      );
      if (existedEntity) {
        CesiumUtilsSingleton.removeCesiumEntity(CURRENT_LOCATION_ENTITY_ID);
      }

      CesiumUtilsSingleton.addCesiumEntity({
        id: CURRENT_LOCATION_ENTITY_ID,
        type: 'billboard',
        position: [lon, lat, 0],
        billboardOptions: {
          image: CURRENT_LOCATION_ICON,
          scale: 1,
          verticalOrigin: VerticalOrigin.BOTTOM,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });

      CesiumUtilsSingleton.viewToTarget([
        lon,
        lat,
        basicInfoStore.originPoint.height,
      ]);
    }
  );
</script>

<style scoped>
  .map_container {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
