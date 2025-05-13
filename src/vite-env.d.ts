/// <reference types="vite/client" />

interface RuntimeEnv {
  VITE_GOOGLE_CLIENT_ID: string;
  // Add other runtime environment variables here as needed
}

interface Window {
  runtimeEnv: RuntimeEnv;
}
