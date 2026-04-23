import type { Billboard } from 'cesium';

/**
 * 点击对象接口
 */
export interface ClickObject {
  /** 对象ID */
  id: string;
  /** 其他属性 */
  [key: string]: unknown;
  /** 图元对象 */
  primitive: Billboard | null;
}
