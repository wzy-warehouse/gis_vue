import {
  Viewer,
  SceneMode,
  Ion,
  UrlTemplateImageryProvider,
  ImageryProvider,
  PolygonHierarchy,
  Cartesian3,
  PolygonGeometry,
  ArcType,
  GeometryInstance,
  Color,
  Material,
  MaterialAppearance,
  GroundPrimitive,
} from 'cesium';
import type { CesiumInitOptions } from '@/types/cesium/CesiumInitOptions';
import config from '@/config/config.json';

/**
 * Cesium Viewer 管理器
 */
export class CesiumViewerManager {
  #viewer: Viewer | null = null;
  #currentTokenIndex: number = 0;
  #failedTokens: Set<number> = new Set();

  constructor() {
    this.#initializeToken();
  }

  /**
   * 初始化并设置有效的 Token
   */
  #initializeToken(): void {
    const tokens = config.cesiumIonDefaultAccessToken;
    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.warn('Cesium Ion Token 配置为空');
      return;
    }

    Ion.defaultAccessToken = tokens[this.#currentTokenIndex];
  }

  /**
   * 切换到下一个可用的 Token
   * @returns 是否成功切换
   */
  #switchToNextToken(): boolean {
    const tokens = config.cesiumIonDefaultAccessToken;
    if (!Array.isArray(tokens) || tokens.length <= 1) {
      return false;
    }

    this.#failedTokens.add(this.#currentTokenIndex);

    for (let i = 1; i < tokens.length; i++) {
      const nextIndex = (this.#currentTokenIndex + i) % tokens.length;
      if (!this.#failedTokens.has(nextIndex)) {
        this.#currentTokenIndex = nextIndex;
        Ion.defaultAccessToken = tokens[nextIndex];
        return true;
      }
    }

    console.warn('所有 Cesium Ion Token 均已失效');
    return false;
  }
  /**
   * 初始化 Cesium Viewer
   * @param options - Viewer 初始化选项
   * @param geoJson - GeoJSON 数据，如果要突出显示某一区域，就传递改值
   * @param type - 底图类型：0=影像图，1=矢量图（默认 0）
   * @param tdMapToken - 天地图 Token 数组（可选）
   */
  async initCesiumViewer(
    options: CesiumInitOptions,
    type: number = 0,
    tdMapToken?: string[]
  ): Promise<void> {
    const defaultOptions: CesiumInitOptions = {
      containerId: options.containerId,
      shouldAnimate: true,
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      infoBox: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      homeButton: false,
      scene3DOnly: false,
      sceneModePicker: false,
      geocoder: false,
      sceneMode: SceneMode.SCENE3D,
      mark: {
        include: false,
        belongingHemisphere: 'east',
        color: Color.BLACK,
        border: {
          show: true,
          color: Color.WHITE,
          width: 1,
        },
      },
    };

    // 合并选项
    const finalOptions: CesiumInitOptions = {
      ...defaultOptions,
      ...options,
      mark: options.mark
        ? {
            ...defaultOptions.mark,
            ...options.mark,
            border: options.mark.border
              ? {
                  ...defaultOptions.mark!.border,
                  ...options.mark.border,
                }
              : defaultOptions.mark!.border,
          }
        : defaultOptions.mark,
    };

    const container = document.getElementById(finalOptions.containerId);

    if (!container) {
      throw new Error(`Cesium 容器 #${finalOptions.containerId} 不存在`);
    }

    const viewer = new Viewer(container, {
      ...finalOptions,
      // 不加载默认地形
      terrainProvider: undefined,
      selectionIndicator: false,
      baseLayerPicker: false,
      contextOptions: {
        webgl: {
          alpha: true,
          depth: false,
          stencil: true,
          antialias: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false,
        },
        allowTextureFilterAnisotropic: true,
      },
    });

    // 性能优化配置
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.enableLighting = false;
    viewer.shadows = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.skyBox.show = false;
    const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement;
    creditContainer.style.display = 'none';

    // 添加底图
    this.#createImageryProviders(type, tdMapToken || config.tdMapToken).forEach(
      (provider) => {
        viewer.imageryLayers.addImageryProvider(provider);
      }
    );

    this.#viewer = viewer;

    // 是否突出显示指定区域
    if (options.mark?.include) {
      await this.#highlight(finalOptions);
    }
  }

  /**
   * 销毁 Cesium Viewer
   * @param clearAllResources - 清理所有资源的回调函数
   */
  destroyCesiumViewer(clearAllResources: () => void): void {
    if (this.#viewer) {
      clearAllResources();
      this.#viewer.destroy();
      this.#viewer = null;
    }
  }

  /**
   * 获取 Viewer 实例
   * @returns Viewer 实例，如果未初始化则返回 null
   */
  getViewer(): Viewer | null {
    return this.#viewer;
  }

  /**
   * 创建底图 ImageryProvider
   */
  #createImageryProviders(
    type: number,
    tdMapToken: string[]
  ): ImageryProvider[] {
    if (type === 0) {
      // 高德影像图
      const imageryProvider = new UrlTemplateImageryProvider({
        url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        subdomains: ['1', '2', '3', '4'],
        minimumLevel: 0,
        maximumLevel: 18,
        credit: '高德地图',
      });
      // 高德中文标注图层
      const annotationProvider = new UrlTemplateImageryProvider({
        url: 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8',
        subdomains: ['1', '2', '3', '4'],
        minimumLevel: 0,
        maximumLevel: 18,
        credit: '高德地图',
      });
      return [imageryProvider, annotationProvider];
    } else {
      // 高德矢量图（包含标注）
      const vectorProvider = new UrlTemplateImageryProvider({
        url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
        subdomains: ['1', '2', '3', '4'],
        minimumLevel: 0,
        maximumLevel: 18,
        credit: '高德地图',
      });
      return [vectorProvider];
    }
  }

  /**
   * 高亮指定区域
   * @param options - 高亮选项
   */
  async #highlight(options: CesiumInitOptions): Promise<void> {
    if (!this.#viewer) {
      throw new Error('请先初始化 Cesium Viewer');
    }

    if (!options.mark || !options.mark.geoJson) {
      throw new Error('请提供 GeoJSON 数据');
    }

    // 解析边界坐标和孔洞位置
    const parseCoordinates = () => {
      const holes: PolygonHierarchy[] = [];
      const boundaryCoords: number[] = [];
      const polygons = options.mark?.geoJson!.features[0].geometry.coordinates;

      polygons!.forEach((polygon, index) => {
        const flatCoords: number[] = [];
        polygon[0].forEach((point) => {
          flatCoords.push(point[0], point[1]);
        });

        // 第一个是多边形外边界
        if (index === 0) {
          boundaryCoords.push(...flatCoords);
        }

        // 坐标反转（用于挖孔）
        const positions = Cartesian3.fromDegreesArray(flatCoords).reverse();
        holes.push(new PolygonHierarchy(positions));
      });

      return { holes, boundaryCoords };
    };

    const { holes, boundaryCoords } = parseCoordinates();

    // 东西半球标准坐标
    const westPositions = Cartesian3.fromDegreesArray([
      -0.00001, 85, -0.00001, -85, -180, -85, -180, 85, -0.00001, 85,
    ]);
    const eastPositions = Cartesian3.fromDegreesArray([
      0.00001, 85, 0.00001, -85, 180, -85, 180, 85, 0.00001, 85,
    ]);

    // 西半球
    const westOption = {
      polygonHierarchy: new PolygonHierarchy(westPositions),
      arcType: ArcType.GEODESIC,
    };
    if (options.mark.belongingHemisphere === 'west') {
      westOption.polygonHierarchy = new PolygonHierarchy(westPositions, holes);
    }
    const westGeometry = new PolygonGeometry(westOption);
    const westInstance = new GeometryInstance({ geometry: westGeometry });

    // 东半球
    const eastOption = {
      polygonHierarchy: new PolygonHierarchy(eastPositions),
      arcType: ArcType.GEODESIC,
    };
    if (options.mark.belongingHemisphere === 'east') {
      eastOption.polygonHierarchy = new PolygonHierarchy(eastPositions, holes);
    }
    const eastGeometry = new PolygonGeometry(eastOption);
    const eastInstance = new GeometryInstance({ geometry: eastGeometry });

    // 添加遮罩
    const maskMaterial = new Material({
      fabric: {
        type: 'Color',
        uniforms: {
          color: options.mark.color,
        },
      },
    });
    const appearance = new MaterialAppearance({
      material: maskMaterial,
      closed: true,
    });

    // 合并渲染
    const globalMask = new GroundPrimitive({
      geometryInstances: [westInstance, eastInstance],
      appearance: appearance,
    });

    this.#viewer.scene.primitives.add(globalMask);

    // 添加边界线
    if (options.mark.border?.show) {
      const boundaryPositions = Cartesian3.fromDegreesArray(boundaryCoords);
      // 闭合边界线
      boundaryPositions.push(boundaryPositions[0]);

      this.#viewer.entities.add({
        id: 'holeLine',
        polyline: {
          positions: boundaryPositions,
          width: options.mark.border.width,
          material: options.mark.border.color,
          clampToGround: true,
        },
      });
    }

    // 等待完成渲染
    return new Promise<void>((resolve) => {
      const removeListener = this.#viewer!.scene.postRender.addEventListener(
        () => {
          if (globalMask.ready) {
            removeListener();
            resolve();
          }
        }
      );

      // 设置超时保护，避免无限等待
      setTimeout(() => {
        removeListener();
        resolve();
      }, 6000);
    });
  }
}
