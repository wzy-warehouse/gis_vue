<template>
  <div class="poi-list-container">
    <el-card class="poi-list" shadow="always">
      <template #header>
        <div class="card-header">
          <span>生活圈兴趣点 ({{ filteredPois.length }})</span>
          <div class="header-actions">
            <!-- POI类型筛选 -->
            <el-select
              v-model="selectedType"
              placeholder="筛选类型"
              size="small"
              style="width: 120px; margin-right: 10px"
              clearable
            >
              <el-option label="全部" value="all" />
              <el-option
                v-for="(label, key) in poiTypeLabels"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
            <el-button size="small" @click="toggleList">
              {{ visible ? '隐藏' : '显示' }}
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="visible" class="poi-content">
        <!-- POI列表表格 -->
        <el-table
          :data="filteredPois"
          style="width: 100%"
          max-height="500"
          @row-click="handleRowClick"
          highlight-current-row
          empty-text="暂无数据"
        >
          <el-table-column prop="name" label="名称" width="150" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="address" label="地址" show-overflow-tooltip />
          <el-table-column prop="distance" label="距离(米)" width="100" />
        </el-table>
      </div>
    </el-card>

    <!-- POI信息窗口 -->
    <PoiInfoWindow
      :visible="infoWindowVisible"
      :poi-data="selectedPoi"
      :position="infoWindowPosition"
      @close="closeInfoWindow"
      @go-here="handleGoHere"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useBasicInfoStore } from '@/stores/useBasicInfoStore';
  import { POI_TYPE_LABELS } from '@/api/location';
  import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';
  import {
    Cartesian3,
    ScreenSpaceEventType,
    HeadingPitchRange,
    Math as CesiumMath,
  } from 'cesium';
  import type { PoiInfo } from '@/types/PointResponse';
  import PoiInfoWindow from './PoiInfoWindow.vue';

  const basicInfoStore = useBasicInfoStore();
  const visible = ref(true);

  // 信息窗口状态
  const infoWindowVisible = ref(false);
  const selectedPoi = ref<PoiInfo | null>(null);
  const infoWindowPosition = ref<{ x: number; y: number } | undefined>();

  // POI类型标签
  const poiTypeLabels = POI_TYPE_LABELS;

  // 当前选中的类型（用于前端筛选）
  const selectedType = computed({
    get: () => basicInfoStore.selectedPoiType.type,
    set: (value) => {
      basicInfoStore.selectedPoiType.type = value || 'all';
    },
  });

  // 所有POI数据
  const allPois = computed(() => basicInfoStore.livingCirclePois);
  const hasData = computed(() => allPois.value.length > 0);

  // 根据选中类型筛选POI
  const filteredPois = computed(() => {
    if (selectedType.value === 'all') {
      return allPois.value;
    }

    // 获取该类型对应的编码
    const typeCodes = getAllTypeCodes(selectedType.value);
    if (!typeCodes || typeCodes.length === 0) {
      return allPois.value;
    }

    // 筛选匹配的POI
    return allPois.value.filter((poi) => {
      return typeCodes.some((code) => poi.typecode?.startsWith(code));
    });
  });

  /**
   * 获取类型的所有编码（包括父级和子级）
   */
  const getAllTypeCodes = (typeKey: string): string[] => {
    const codeMap: Record<string, string[]> = {
      restaurant: ['0501'],
      supermarket: ['060102', '060103'],
      shopping_mall: ['060100', '060101'],
      bakery: ['050108'],
      bus_station: ['1507'],
      bike_sharing: ['1509'],
      parking: ['1510'],
      gas_station: ['1801'],
      park: ['1101'],
      gym: ['0801'],
      school: ['1412'],
      kindergarten: ['141200'],
      library: ['1401'],
      hospital: ['090100', '090101'],
      pharmacy: ['090103'],
      clinic: ['090102'],
      residential: ['1202'],
      government: ['1301'],
      restroom: ['1701'],
      coffee: ['050104', '050109'],
    };

    return codeMap[typeKey] || [];
  };

  /**
   * 解析POI坐标
   */
  const parsePoiLocation = (location: string) => {
    const [lon, lat] = location.split(',').map(Number);
    return { lon, lat };
  };

  /**
   * 添加POI图标到地图
   */
  const addPoiMarkers = () => {
    // 清除旧的POI图标
    CesiumUtilsSingleton.clearAllPrimitives('custom');

    if (filteredPois.value.length === 0) return;

    // 构建billboard配置数组
    const billboards = filteredPois.value.map((poi) => {
      const { lon, lat } = parsePoiLocation(poi.location);

      return {
        id: `poi_${poi.id}`,
        type: 'billboard' as const,
        positions: [[lon, lat, 0]] as [number, number, number][],
        image: getPoiIcon(poi.typecode),
        scale: 1.0,
        customProperties: {
          poiData: poi,
        },
      };
    });

    // 批量添加图标
    CesiumUtilsSingleton.addPrimitivesBatch(billboards);
  };

  /**
   * 根据POI类型获取图标
   */
  const getPoiIcon = (typecode?: string): string => {
    if (!typecode)
      return new URL('@/assets/images/logo.png', import.meta.url).href;

    // 根据不同类型返回不同图标
    if (typecode.startsWith('0501'))
      return new URL('@/assets/images/餐厅.png', import.meta.url).href; // 餐饮
    if (typecode.startsWith('060102') || typecode.startsWith('060103'))
      return new URL('@/assets/images/服务超市.png', import.meta.url).href; // 超市/便利店
    if (typecode.startsWith('060100') || typecode.startsWith('060101'))
      return new URL('@/assets/images/商场.png', import.meta.url).href; // 商场
    if (typecode.startsWith('050108'))
      return new URL('@/assets/images/烘焙店（面包店）.png', import.meta.url)
        .href; // 面包店
    if (typecode.startsWith('1507'))
      return new URL('@/assets/images/公交站.png', import.meta.url).href; // 公交
    if (typecode.startsWith('1101'))
      return new URL('@/assets/images/公园大门.png', import.meta.url).href; // 公园
    if (typecode.startsWith('090100') || typecode.startsWith('090101'))
      return new URL('@/assets/images/医院.png', import.meta.url).href; // 医院
    if (typecode.startsWith('090103'))
      return new URL('@/assets/images/药店.png', import.meta.url).href; // 药店
    if (typecode.startsWith('090102'))
      return new URL('@/assets/images/诊所.png', import.meta.url).href; // 诊所
    if (typecode.startsWith('141200'))
      return new URL('@/assets/images/幼儿园.png', import.meta.url).href; // 幼儿园
    if (typecode.startsWith('1412') && !typecode.startsWith('141200'))
      return new URL('@/assets/images/学校.png', import.meta.url).href; // 学校（排除幼儿园）
    if (typecode.startsWith('1510'))
      return new URL('@/assets/images/停车场.png', import.meta.url).href; // 停车场
    if (typecode.startsWith('1801'))
      return new URL('@/assets/images/加油站.png', import.meta.url).href; // 加油站
    if (typecode.startsWith('0801'))
      return new URL('@/assets/images/健身房.png', import.meta.url).href; // 健身房
    if (typecode.startsWith('1401'))
      return new URL('@/assets/images/图书馆.png', import.meta.url).href; // 图书馆
    if (typecode.startsWith('1202'))
      return new URL('@/assets/images/小区.png', import.meta.url).href; // 住宅
    if (typecode.startsWith('1301'))
      return new URL('@/assets/images/政府机构.png', import.meta.url).href; // 政府
    if (typecode.startsWith('1701'))
      return new URL('@/assets/images/洗手间.png', import.meta.url).href; // 洗手间
    if (typecode.startsWith('1509'))
      return new URL('@/assets/images/共享单车点.png', import.meta.url).href; // 共享单车
    if (typecode.startsWith('050104') || typecode.startsWith('050109'))
      return new URL('@/assets/images/咖啡店.png', import.meta.url).href; // 咖啡/茶座

    return new URL('@/assets/images/logo.png', import.meta.url).href;
  };

  /**
   * 监听POI数据变化，自动添加图标
   */
  watch(
    () => filteredPois.value,
    () => {
      // 延迟执行，确保DOM更新完成
      setTimeout(() => {
        addPoiMarkers();
        setupPoiClickHandler();
      }, 100);
    },
    { deep: true }
  );

  /**
   * 监听类型筛选变化，重新添加图标
   */
  watch(
    () => selectedType.value,
    () => {
      setTimeout(() => {
        addPoiMarkers();
        setupPoiClickHandler();
      }, 100);
    }
  );

  /**
   * 点击表格行，飞到对应POI位置
   */
  const handleRowClick = (row: PoiInfo) => {
    const { lon, lat } = parsePoiLocation(row.location);

    // 飞到该位置
    CesiumUtilsSingleton.flyToTarget([lon, lat, 1000], 1.5);

    // 高亮对应的图标（可选）
    highlightPoiMarker(`poi_${row.id}`);
  };

  /**
   * 高亮POI图标
   */
  const highlightPoiMarker = (poiId: string) => {
    // 这里可以实现图标高亮效果
  };

  /**
   * POI点击事件处理器引用（用于移除旧的事件）
   */
  let poiClickHandler: ((clickEvent: any) => void) | null = null;

  /**
   * 设置POI图标点击事件
   */
  const setupPoiClickHandler = () => {
    const viewer = CesiumUtilsSingleton.getViewer();
    if (!viewer) return;

    // 移除旧的POI点击事件（如果存在）
    if (poiClickHandler) {
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        ScreenSpaceEventType.LEFT_CLICK
      );
    }

    // 创建新的事件处理器
    poiClickHandler = (clickEvent: any) => {
      const pickedObject = viewer.scene.pick(clickEvent.position);


      if (pickedObject) {
        // 尝试从不同位置获取ID
        let primitiveId = '';

        // BillboardCollection中的billboard，id在pickedObject.id中
        if (pickedObject.id && typeof pickedObject.id === 'string') {
          primitiveId = pickedObject.id;
        }

        // 判断是否是POI图标
        if (primitiveId.startsWith('poi_')) {
          // 通过ID找到对应的POI数据
          const poiId = primitiveId.replace('poi_', '');

          const poi = filteredPois.value.find((p) => p.id === poiId);

          if (poi) {
            showPoiInfoWindow(poi, clickEvent.position);
          } else {
            console.warn('❌ 未找到POI数据，ID:', poiId);
            console.warn('可能的原因：POI已被筛选掉或ID不匹配');
          }
        } else {
        }
      } else {
      }
    };

    // 注册新的事件
    viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(
      poiClickHandler,
      ScreenSpaceEventType.LEFT_CLICK
    );

  };

  /**
   * 显示POI信息窗口
   */
  const showPoiInfoWindow = (poi: PoiInfo, screenPosition: any) => {
    selectedPoi.value = poi;
    infoWindowPosition.value = {
      x: screenPosition.x,
      y: screenPosition.y,
    };
    infoWindowVisible.value = true;
  };

  /**
   * 关闭信息窗口
   */
  const closeInfoWindow = () => {
    infoWindowVisible.value = false;
    selectedPoi.value = null;
  };

  /**
   * 去这里 - 设置目标点并触发路径规划
   */
  const handleGoHere = (poi: PoiInfo) => {
    const { lon, lat } = parsePoiLocation(poi.location);

    basicInfoStore.targetPoint.lon = lon;
    basicInfoStore.targetPoint.lat = lat;
    basicInfoStore.targetPoint.height = 0;

    basicInfoStore.clickHere = !basicInfoStore.clickHere;

    // 关闭信息窗口
    closeInfoWindow();
  };

  /**
   * 切换显示/隐藏
   */
  const toggleList = () => {
    visible.value = !visible.value;
  };
</script>

<style scoped>
  .poi-list-container {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
  }

  .poi-list {
    width: 700px;
    background-color: white;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-actions {
    display: flex;
    align-items: center;
  }

  .poi-content {
    margin-top: 10px;
  }
</style>
