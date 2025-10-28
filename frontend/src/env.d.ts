interface ImportMetaEnv {
  readonly VITE_API_BASE: string; // your backend URL
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}