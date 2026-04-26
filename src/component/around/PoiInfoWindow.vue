<template>
  <div v-if="visible && poiData" class="poi-info-window" :style="windowStyle">
    <el-card class="info-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span class="title">{{ poiData.name }}</span>
          <el-button
            link
            type="primary"
            size="small"
            @click="closeWindow"
            class="close-btn"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>

      <div class="info-content">
        <div class="info-item">
          <label>类型：</label>
          <span>{{ poiData.type }}</span>
        </div>
        <div class="info-item">
          <label>地址：</label>
          <span>{{ poiData.address || '暂无' }}</span>
        </div>
        <div class="info-item" v-if="poiData.distance">
          <label>距离：</label>
          <span>{{ poiData.distance }}米</span>
        </div>
        <div class="info-item" v-if="poiData.tel">
          <label>电话：</label>
          <span>{{ poiData.tel }}</span>
        </div>

        <div class="actions">
          <el-button type="primary" size="small" @click="handleGoHere">
            <el-icon><Location /></el-icon>
            去这里
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { Close, Location } from '@element-plus/icons-vue';
  import type { PoiInfo } from '@/types/PointResponse';
  import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';
  import { Cartesian3 } from 'cesium';

  const props = defineProps<{
    visible: boolean;
    poiData: PoiInfo | null;
    position?: { x: number; y: number };
  }>();

  const emit = defineEmits<{
    close: [];
    goHere: [poi: PoiInfo];
  }>();

  // 窗口样式
  const windowStyle = computed(() => {
    if (!props.position) {
      return {
        top: '100px',
        right: '20px',
      };
    }
    return {
      top: `${props.position.y - 200}px`,
      left: `${props.position.x + 20}px`,
    };
  });

  // 关闭窗口
  const closeWindow = () => {
    emit('close');
  };

  // 去这里
  const handleGoHere = () => {
    if (props.poiData) {
      emit('goHere', props.poiData);
    }
  };
</script>

<style scoped>
  .poi-info-window {
    position: fixed;
    z-index: 2000;
    max-width: 350px;
  }

  .info-card {
    background-color: rgba(255, 255, 255, 0.95);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .close-btn {
    padding: 0;
  }

  .info-content {
    padding: 10px 0;
  }

  .info-item {
    margin-bottom: 12px;
    display: flex;
    align-items: flex-start;
  }

  .info-item label {
    font-weight: bold;
    color: #606266;
    min-width: 60px;
    flex-shrink: 0;
  }

  .info-item span {
    color: #303133;
    flex: 1;
    word-break: break-all;
  }

  .actions {
    margin-top: 20px;
    text-align: center;
    padding-top: 15px;
    border-top: 1px solid #eee;
  }
</style>
