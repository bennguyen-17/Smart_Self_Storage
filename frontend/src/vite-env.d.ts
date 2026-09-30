/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_AGENTATION: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_ENABLE_DEMO_TOOLS?: string
  readonly VITE_PUBLIC_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
