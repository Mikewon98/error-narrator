const defaultConfig = {
  enabled: process.env.NODE_ENV === "development",
  voice: null, // Use system default
  rate: 1,
  pitch: 1,
  maxMessageLength: 100,
  cooldownMs: 5000, // Prevent spam
  filters: {
    ignorePatterns: ["ResizeObserver loop limit exceeded"],
    onlyPatterns: null,
  },
};

class Config {
  constructor(userConfig = {}) {
    // Deep merge the config objects
    this.config = this.deepMerge(defaultConfig, userConfig || {});
    this.lastSpoken = 0;
  }

  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  shouldSpeak(error) {
    const now = Date.now();
    if (now - this.lastSpoken < this.config.cooldownMs) {
      return false;
    }

    const message = error.message || error.toString();

    // Check ignore patterns
    if (
      this.config.filters.ignorePatterns?.some((pattern) =>
        message.includes(pattern)
      )
    ) {
      return false;
    }

    // Check only patterns (if specified, only allow these patterns)
    if (
      this.config.filters.onlyPatterns &&
      this.config.filters.onlyPatterns.length > 0
    ) {
      const matchesOnlyPattern = this.config.filters.onlyPatterns.some(
        (pattern) => message.includes(pattern)
      );
      if (!matchesOnlyPattern) {
        return false;
      }
    }

    this.lastSpoken = now;
    return true;
  }
}

export { Config };
