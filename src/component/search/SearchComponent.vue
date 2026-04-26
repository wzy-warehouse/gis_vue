<template>
  <div class="search-container">
    <el-autocomplete
      v-model="searchKeyword"
      :fetch-suggestions="querySearch"
      placeholder="请输入地点名称"
      clearable
      class="search-input"
      @select="handleSelect"
      @keyup.enter="handleSearch"
      value-key="name"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
      <template #default="{ item }">
        <div class="suggestion-item">
          <div class="suggestion-name">{{ item.name }}</div>
          <div class="suggestion-address">{{ item.address }}</div>
        </div>
      </template>
    </el-autocomplete>
    <el-button type="primary" :loading="searching" @click="handleSearch">
      搜索
    </el-button>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { ElMessage } from 'element-plus';
  import { Search } from '@element-plus/icons-vue';
  import configJson from '@/config/config.json';
  import { CesiumUtilsSingleton } from '@/utils/cesium/CesiumUtils';
  import { useBasicInfoStore } from '@/stores/useBasicInfoStore';

  const searchKeyword = ref('');
  const searching = ref(false);
  const basicInfoStore = useBasicInfoStore();

  interface SuggestionItem {
    name: string;
    address: string;
    location: {
      lat: number;
      lon: number;
    };
  }

  /**
   * 调用高德地图输入提示API
   * @param keyword 关键词
   * @returns 返回建议列表
   */
  const fetchSuggestions = async (keyword: string): Promise<SuggestionItem[]> => {
    if (!keyword.trim()) {
      return [];
    }

    const gaodeKey = configJson.gaodeApi;
    const url = `https://restapi.amap.com/v3/assistant/inputtips?keywords=${encodeURIComponent(keyword)}&key=${gaodeKey}&datatype=all`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.tips && data.tips.length > 0) {
        return data.tips
          .filter((tip: any) => {
            // 严格检查：必须有location字段且为字符串类型
            return tip.location && typeof tip.location === 'string' && tip.location.includes(',');
          })
          .map((tip: any) => {
            try {
              const locationStr = String(tip.location);
              const [lon, lat] = locationStr.split(',').map(Number);

              // 验证坐标是否有效
              if (isNaN(lon) || isNaN(lat)) {
                return null;
              }

              return {
                name: tip.name || '未知地点',
                address: tip.district || tip.address || '',
                location: {
                  lon,
                  lat,
                },
              };
            } catch (error) {
              console.warn('解析位置信息失败:', tip);
              return null;
            }
          })
          .filter((item: SuggestionItem | null): item is SuggestionItem => item !== null);
      }
      return [];
    } catch (error) {
      console.error('高德输入提示API调用失败:', error);
      return [];
    }
  };

  /**
   * 自动补全查询函数
   */
  const querySearch = async (
    queryString: string,
    cb: (results: SuggestionItem[]) => void
  ) => {
    const results = await fetchSuggestions(queryString);
    cb(results);
  };

  /**
   * 处理选择事件
   * @param item 选中的建议项
   */
  const handleSelect = (item: SuggestionItem) => {
    // 更新源点信息
    basicInfoStore.originPoint.lon = item.location.lon;
    basicInfoStore.originPoint.lat = item.location.lat;
    basicInfoStore.originPoint.height = 0;
  };

  /**
   * 处理搜索事件（点击搜索按钮）
   */
  const handleSearch = async () => {
    if (!searchKeyword.value.trim()) {
      ElMessage.warning('请输入地点名称');
      return;
    }

    searching.value = true;
    try {
      const suggestions = await fetchSuggestions(searchKeyword.value.trim());

      if (suggestions.length > 0) {
        // 如果有建议结果，选择第一个
        handleSelect(suggestions[0]);
      } else {
        ElMessage.warning('未找到相关地点');
      }
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '搜索失败，请重试');
    } finally {
      searching.value = false;
    }
  };
</script>

<style scoped>
  .search-container {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  .search-input {
    width: 300px;
  }

  .suggestion-item {
    padding: 4px 0;
  }

  .suggestion-name {
    font-size: 14px;
    color: #303133;
    margin-bottom: 2px;
  }

  .suggestion-address {
    font-size: 12px;
    color: #909399;
  }
</style>
