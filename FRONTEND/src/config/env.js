// Environment configuration
export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081",
  AGENTIC_AI_BASE_URL:
    import.meta.env.VITE_AGENTIC_AI_BASE_URL || "http://localhost:8082",
  APP_NAME: import.meta.env.VITE_APP_NAME || "Visera Warehouse Management",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  APP_ENV: import.meta.env.VITE_APP_ENV || "development",
  TOKEN_KEY: import.meta.env.VITE_TOKEN_KEY || "token",
  ROLE_KEY: import.meta.env.VITE_ROLE_KEY || "role",
  USER_ID_KEY: import.meta.env.VITE_USER_ID_KEY || "userId",
};

export const isDevelopment = () => env.APP_ENV === "development";
export const isProduction = () => env.APP_ENV === "production";
