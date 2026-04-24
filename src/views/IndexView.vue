<!-- 入口 -->
<template>
  <!-- 加载地图 -->
  <MapComponent />

  <!-- 加载完成后获取地址 -->
  <AddressComponent v-if="useStatusStore().appLoadingCompleted" />

  <!-- 搜索组件 -->
  <SearchComponent v-if="useStatusStore().appLoadingCompleted" />

  <!-- 输入框组件（时间、距离） -->
  <InputComponent v-if="useStatusStore().appLoadingCompleted" />

  <!-- 获取周边生活圈的点 -->
  <AroundComponent v-if="useStatusStore().appLoadingCompleted" />

  <!-- 将生活区点显示到地图 -->
  <AroundPointShowComponent v-if="useStatusStore().appLoadingCompleted" />

  <!-- 路径规划 -->
  <RouteComponent v-if="useStatusStore().appLoadingCompleted" />
</template>

<script setup lang="ts">
  import AddressComponent from '@/component/address/AddressComponent.vue';
  import AroundComponent from '@/component/around/AroundComponent.vue';
  import AroundPointShowComponent from '@/component/around/AroundPointShowComponent.vue';
  import InputComponent from '@/component/input/InputComponent.vue';
  import MapComponent from '@/component/map/MapComponent.vue';
  import SearchComponent from '@/component/search/SearchComponent.vue';
  import { useStatusStore } from '@/stores/useStatusStore.ts';
  import RouteComponent from '@/component/route/RouteComponent.vue';
  import { watch } from 'vue';
  import { useBasicInfoStore } from '@/stores/useBasicInfoStore';
  import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';

  watch(
    () => useBasicInfoStore().originPoint,
    () => {
      CesiumUtilsSingleton.flyToTarget([
        useBasicInfoStore().originPoint.lon,
        useBasicInfoStore().originPoint.lat,
        useBasicInfoStore().originPoint.height,
      ]);
    },
    { deep: true }
  );
</script>

<style scoped></style>
