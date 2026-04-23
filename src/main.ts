import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';
import proj4 from 'proj4';
import { Cartesian3, GeoJsonDataSource } from 'cesium';

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(createPinia());
app.use(router);

app.mount('#app');

// 定义 EPSG:4490 (CGCS2000)
proj4.defs('EPSG:4490', '+proj=longlat +ellps=GRS80 +no_defs +type=crs');

// 定义 EPSG:4326 (WGS84)
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs +type=crs');

// 坐标转换函数
const transformFunc = proj4('EPSG:4490', 'EPSG:4326').forward;

// 将坐标转换函数注册给Cesium，让它能自动处理所有标记为EPSG:4490的坐标数据
GeoJsonDataSource.crsNames['EPSG:4490'] = function (coordinates: number[]) {
  const [x, y] = coordinates;
  // 使用 proj4 进行坐标转换
  const [lon, lat] = transformFunc([x, y]);
  // 返回 Cesium 能识别的笛卡尔坐标
  return Cartesian3.fromDegrees(lon, lat);
};
