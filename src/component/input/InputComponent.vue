<template>
  <div class="input-container">
    <el-button type="primary" @click="togglePanel" class="calc-button">
      计算生活圈
    </el-button>

    <el-card v-if="visible" class="input-panel" shadow="always">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="查询类型">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="时间" value="time" />
            <el-option label="距离" value="distance" />
          </el-select>
        </el-form-item>

        <el-form-item label="数值">
          <el-input
            v-model.number="formData.value"
            type="number"
            :placeholder="formData.type === 'time' ? '请输入时长（分钟）' : '请输入距离（米）'"
          >
            <template #append>
              {{ formData.type === 'time' ? '分钟' : '米' }}
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import { useBasicInfoStore } from '@/stores/useBasicInfoStore';

  const basicInfoStore = useBasicInfoStore();

  const visible = ref(false);

  const formData = reactive({
    type: 'time' as 'time' | 'distance',
    value: 0,
  });

  const togglePanel = () => {
    visible.value = !visible.value;
    if (visible.value) {
      formData.type = basicInfoStore.query.type;
      formData.value = basicInfoStore.query.value;
    }
  };

  const handleConfirm = () => {
    basicInfoStore.query.type = formData.type;
    basicInfoStore.query.value = formData.value;
    visible.value = false;
  };

  const handleCancel = () => {
    visible.value = false;
  };
</script>

<style scoped>
  .input-container {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1000;
  }

  .calc-button {
    width: 120px;
  }

  .input-panel {
    position: absolute;
    top: 50px;
    left: 0;
    width: 280px;
    background-color: white;
  }
</style>
