// This file is a template and will be processed by envsubst at container startup.
window.runtimeEnv = {
  VITE_GOOGLE_CLIENT_ID: "${RUNTIME_VITE_GOOGLE_CLIENT_ID}"
  // To add more variables, follow the pattern:
  // VITE_ANOTHER_VARIABLE: "${RUNTIME_VITE_ANOTHER_VARIABLE}"
};
