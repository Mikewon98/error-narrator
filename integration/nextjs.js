export function withVoiceErrors(nextConfig = {}) {
  return {
    ...nextConfig,
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Inject error handling into the client bundle
        config.entry = async () => {
          const entries = await originalEntry();
          entries["main.js"].unshift("./error-narrator/client-inject.js");
          return entries;
        };
      }
      return config;
    },
  };
}
