/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the API. Empty in dev so Vite's /api proxy is used. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}