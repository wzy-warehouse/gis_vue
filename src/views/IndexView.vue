<!-- 入口 -->
<template>
  <!-- 加载地图 -->
  <MapComponent />

  <!-- 加载完成后获取地址 -->
  <AddressComponent />

  <!-- 搜索组件 -->
  <SearchComponent />

  <!-- 输入框组件（时间、距离） -->
  <InputComponent />

  <!-- 获取周边生活圈的点 -->
  <AroundComponent />

  <!-- 路径规划 -->
  <RouteComponent />
</template>

<script setup lang="ts">
  import AddressComponent from '@/component/address/AddressComponent.vue';
  import AroundComponent from '@/component/around/AroundComponent.vue';
  import InputComponent from '@/component/input/InputComponent.vue';
  import MapComponent from '@/component/map/MapComponent.vue';
  import SearchComponent from '@/component/search/SearchComponent.vue';
</script>

<style scoped></style>
