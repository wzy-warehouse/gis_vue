<template>
  <div class="map_container" id="map-container"></div>
</template>

<script lang="ts" setup>
  import { onBeforeMount, onMounted } from 'vue';
  import { useStatusStore } from '@/stores/useStatusStore';

  import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';
  import config from '@/config/config.json';
  import { useMap } from '@/hooks/map/useMap';

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
