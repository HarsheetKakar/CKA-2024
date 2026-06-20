/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Dev-only: when 'true', every day is unlocked so all pages can be browsed
   * without solving prior days. Set in the `dev` npm script. Never set in build.
   */
  readonly VITE_UNLOCK_ALL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
