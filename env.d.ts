NEW_FILE_CODE;
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 声明环境变量类型
interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL: string;
  readonly START_PORT: number;
  readonly VITE_GEOSERVER_BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob;
}

// 声明 CSS 模块类型
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// 声明静态资源类型
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}
