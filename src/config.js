const defaultConfig = {
  enabled: process.env.NODE_ENV === "development",
  voice: null, // Use system default
  rate: 1,
  pitch: 1,
  volume: 1,
  maxMessageLength: 100,
  cooldownMs: 5000, // Prevent spam
  filters: {
    ignorePatterns: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "Loading chunk",
    ],
    onlyPatterns: null,
    errorTypes: [
      "SyntaxError",
      "ReferenceError",
      "TypeError",
      "RangeError",
      "Error",
    ],
  },
  humanize: true, // Use ErrorProcessor to make errors more readable
  fallbackToRaw: true, // If humanization fails, use raw error message
  debug: true, // Enable debug logging
};

class Config {
  constructor(userConfig = {}) {
    // Deep merge the config objects
    this.config = this.deepMerge(defaultConfig, userConfig || {});
    this.lastSpoken = new Map(); // Track cooldowns per error type
    this.errorCounts = new Map(); // Track error frequency

    if (this.config.debug) {
      console.log("[ErrorNarrator] Config initialized:", this.config);
    }
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
    if (!this.config.enabled) {
      return false;
    }

    const now = Date.now();
    const message = error.message || error.toString();
    const errorType = error.constructor?.name || "Error";

    // *** IMPROVED: Use the actual message content for the key instead of substring ***
    // This ensures that identical processed messages are properly tracked
    const messageHash = this.hashString(message);
    const errorKey = `${errorType}:${messageHash}`;

    // Check global cooldown - only if we have spoken before
    const lastGlobalSpoken = this.lastSpoken.get("global");
    if (lastGlobalSpoken && now - lastGlobalSpoken < this.config.cooldownMs) {
      if (this.config.debug) {
        console.log("[ErrorNarrator] Skipping due to global cooldown");
      }
      return false;
    }

    // Check specific error cooldown (longer cooldown for repeated errors)
    const lastErrorSpoken = this.lastSpoken.get(errorKey);
    if (lastErrorSpoken) {
      const errorCount = this.errorCounts.get(errorKey) || 0;
      const specificCooldown =
        this.config.cooldownMs * Math.min(errorCount + 1, 5);

      if (now - lastErrorSpoken < specificCooldown) {
        if (this.config.debug) {
          console.log(
            "[ErrorNarrator] Skipping due to specific error cooldown",
            { errorKey, specificCooldown, timeSince: now - lastErrorSpoken }
          );
        }
        return false;
      }
    }

    // Check ignore patterns
    if (
      this.config.filters.ignorePatterns?.some((pattern) =>
        message.toLowerCase().includes(pattern.toLowerCase())
      )
    ) {
      if (this.config.debug) {
        console.log("[ErrorNarrator] Ignoring error due to ignore pattern");
      }
      return false;
    }

    // Check error types filter
    if (
      this.config.filters.errorTypes?.length > 0 &&
      !this.config.filters.errorTypes.includes(errorType)
    ) {
      if (this.config.debug) {
        console.log("[ErrorNarrator] Ignoring error type:", errorType);
      }
      return false;
    }

    // Check only patterns (if specified, only allow these patterns)
    if (
      this.config.filters.onlyPatterns &&
      this.config.filters.onlyPatterns.length > 0
    ) {
      const matchesOnlyPattern = this.config.filters.onlyPatterns.some(
        (pattern) => message.toLowerCase().includes(pattern.toLowerCase())
      );
      if (!matchesOnlyPattern) {
        if (this.config.debug) {
          console.log("[ErrorNarrator] Error does not match only patterns");
        }
        return false;
      }
    }

    // Update tracking
    this.lastSpoken.set("global", now);
    this.lastSpoken.set(errorKey, now);
    const errorCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, errorCount + 1);

    if (this.config.debug) {
      console.log("[ErrorNarrator] Allowing speech for:", {
        errorKey,
        errorCount: errorCount + 1,
      });
    }

    return true;
  }

  // Simple hash function to create consistent keys for identical messages
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  updateConfig(newConfig) {
    this.config = this.deepMerge(this.config, newConfig);
    if (this.config.debug) {
      console.log("[ErrorNarrator] Config updated:", this.config);
    }
  }

  getConfig() {
    return { ...this.config };
  }

  // Reset cooldowns and counts (useful for testing)
  reset() {
    this.lastSpoken.clear();
    this.errorCounts.clear();
  }
}

export { Config, defaultConfig };

// const defaultConfig = {
//   enabled: process.env.NODE_ENV === "development",
//   voice: null, // Use system default
//   rate: 1,
//   pitch: 1,
//   volume: 1,
//   maxMessageLength: 100,
//   cooldownMs: 5000, // Prevent spam
//   filters: {
//     ignorePatterns: [
//       "ResizeObserver loop limit exceeded",
//       "Non-Error promise rejection captured",
//       "Loading chunk",
//     ],
//     onlyPatterns: null,
//     errorTypes: [
//       "SyntaxError",
//       "ReferenceError",
//       "TypeError",
//       "RangeError",
//       "Error",
//     ],
//   },
//   humanize: true, // Use ErrorProcessor to make errors more readable
//   fallbackToRaw: true, // If humanization fails, use raw error message
//   debug: true, // Enable debug logging
// };

// class Config {
//   constructor(userConfig = {}) {
//     // Deep merge the config objects
//     this.config = this.deepMerge(defaultConfig, userConfig || {});
//     this.lastSpoken = new Map(); // Track cooldowns per error type
//     this.errorCounts = new Map(); // Track error frequency

//     if (this.config.debug) {
//       console.log("[ErrorNarrator] Config initialized:", this.config);
//     }
//   }

//   deepMerge(target, source) {
//     const result = { ...target };

//     for (const key in source) {
//       if (
//         source[key] !== null &&
//         typeof source[key] === "object" &&
//         !Array.isArray(source[key])
//       ) {
//         result[key] = this.deepMerge(result[key] || {}, source[key]);
//       } else {
//         result[key] = source[key];
//       }
//     }

//     return result;
//   }

//   shouldSpeak(error) {
//     if (!this.config.enabled) {
//       return false;
//     }

//     const now = Date.now();
//     const message = error.message || error.toString();
//     const errorType = error.constructor.name;
//     const errorKey = `${errorType}:${message.substring(0, 50)}`;

//     // Check global cooldown - only if we have spoken before
//     const lastGlobalSpoken = this.lastSpoken.get("global");
//     if (lastGlobalSpoken && now - lastGlobalSpoken < this.config.cooldownMs) {
//       if (this.config.debug) {
//         console.log("[ErrorNarrator] Skipping due to global cooldown");
//       }
//       return false;
//     }

//     // Check specific error cooldown (longer cooldown for repeated errors)
//     const lastErrorSpoken = this.lastSpoken.get(errorKey);
//     if (lastErrorSpoken) {
//       const errorCount = this.errorCounts.get(errorKey) || 0;
//       const specificCooldown =
//         this.config.cooldownMs * Math.min(errorCount + 1, 5);

//       if (now - lastErrorSpoken < specificCooldown) {
//         if (this.config.debug) {
//           console.log(
//             "[ErrorNarrator] Skipping due to specific error cooldown"
//           );
//         }
//         return false;
//       }
//     }

//     // Check ignore patterns
//     if (
//       this.config.filters.ignorePatterns?.some((pattern) =>
//         message.toLowerCase().includes(pattern.toLowerCase())
//       )
//     ) {
//       if (this.config.debug) {
//         console.log("[ErrorNarrator] Ignoring error due to ignore pattern");
//       }
//       return false;
//     }

//     // Check error types filter
//     if (
//       this.config.filters.errorTypes?.length > 0 &&
//       !this.config.filters.errorTypes.includes(errorType)
//     ) {
//       if (this.config.debug) {
//         console.log("[ErrorNarrator] Ignoring error type:", errorType);
//       }
//       return false;
//     }

//     // Check only patterns (if specified, only allow these patterns)
//     if (
//       this.config.filters.onlyPatterns &&
//       this.config.filters.onlyPatterns.length > 0
//     ) {
//       const matchesOnlyPattern = this.config.filters.onlyPatterns.some(
//         (pattern) => message.toLowerCase().includes(pattern.toLowerCase())
//       );
//       if (!matchesOnlyPattern) {
//         if (this.config.debug) {
//           console.log("[ErrorNarrator] Error does not match only patterns");
//         }
//         return false;
//       }
//     }

//     // Update tracking
//     this.lastSpoken.set("global", now);
//     this.lastSpoken.set(errorKey, now);
//     const errorCount = this.errorCounts.get(errorKey) || 0;
//     this.errorCounts.set(errorKey, errorCount + 1);

//     return true;
//   }

//   updateConfig(newConfig) {
//     this.config = this.deepMerge(this.config, newConfig);
//     if (this.config.debug) {
//       console.log("[ErrorNarrator] Config updated:", this.config);
//     }
//   }

//   getConfig() {
//     return { ...this.config };
//   }

//   // Reset cooldowns and counts (useful for testing)
//   reset() {
//     this.lastSpoken.clear();
//     this.errorCounts.clear();
//   }
// }

// export { Config, defaultConfig };

// shouldSpeak(error) {
//   if (!this.config.enabled) {
//     return false;
//   }

//   const now = Date.now();
//   const message = error.message || error.toString();
//   const errorType = error.constructor.name;
//   const errorKey = `${errorType}:${message.substring(0, 50)}`;

//   // Check global cooldown
//   const lastGlobalSpoken = this.lastSpoken.get("global") || 0;

//   // Only check cooldown if a global timestamp has been set previously.
//   if (
//     lastGlobalSpoken !== undefined &&
//     now - lastGlobalSpoken < this.config.cooldownMs
//   ) {
//     if (this.config.debug) {
//       console.log("[ErrorNarrator] Skipping due to global cooldown");
//     }
//     return false;
//   }

//   // Check specific error cooldown (longer cooldown for repeated errors)
//   const lastErrorSpoken = this.lastSpoken.get(errorKey) || 0;
//   const errorCount = this.errorCounts.get(errorKey) || 0;
//   const specificCooldown =
//     this.config.cooldownMs * Math.min(errorCount + 1, 5);

//   if (now - lastErrorSpoken < specificCooldown) {
//     if (this.config.debug) {
//       console.log("[ErrorNarrator] Skipping due to specific error cooldown");
//     }
//     return false;
//   }

//   // Check ignore patterns
//   if (
//     this.config.filters.ignorePatterns?.some((pattern) =>
//       message.toLowerCase().includes(pattern.toLowerCase())
//     )
//   ) {
//     if (this.config.debug) {
//       console.log("[ErrorNarrator] Ignoring error due to ignore pattern");
//     }
//     return false;
//   }

//   // Check error types filter
//   if (
//     this.config.filters.errorTypes?.length > 0 &&
//     !this.config.filters.errorTypes.includes(errorType)
//   ) {
//     if (this.config.debug) {
//       console.log("[ErrorNarrator] Ignoring error type:", errorType);
//     }
//     return false;
//   }

//   // Check only patterns (if specified, only allow these patterns)
//   if (
//     this.config.filters.onlyPatterns &&
//     this.config.filters.onlyPatterns.length > 0
//   ) {
//     const matchesOnlyPattern = this.config.filters.onlyPatterns.some(
//       (pattern) => message.toLowerCase().includes(pattern.toLowerCase())
//     );
//     if (!matchesOnlyPattern) {
//       if (this.config.debug) {
//         console.log("[ErrorNarrator] Error does not match only patterns");
//       }
//       return false;
//     }
//   }

//   // Update tracking
//   this.lastSpoken.set("global", now);
//   this.lastSpoken.set(errorKey, now);
//   this.errorCounts.set(errorKey, errorCount + 1);

//   return true;
// }

// const defaultConfig = {
//   enabled: process.env.NODE_ENV === "development",
//   voice: null, // Use system default
//   rate: 1,
//   pitch: 1,
//   maxMessageLength: 100,
//   cooldownMs: 5000, // Prevent spam
//   filters: {
//     ignorePatterns: ["ResizeObserver loop limit exceeded"],
//     onlyPatterns: null,
//   },
// };

// class Config {
//   constructor(userConfig = {}) {
//     // Deep merge the config objects
//     this.config = this.deepMerge(defaultConfig, userConfig || {});
//     this.lastSpoken = 0;
//   }

//   deepMerge(target, source) {
//     const result = { ...target };

//     for (const key in source) {
//       if (
//         source[key] !== null &&
//         typeof source[key] === "object" &&
//         !Array.isArray(source[key])
//       ) {
//         result[key] = this.deepMerge(result[key] || {}, source[key]);
//       } else {
//         result[key] = source[key];
//       }
//     }

//     return result;
//   }

//   shouldSpeak(error) {
//     const now = Date.now();
//     if (now - this.lastSpoken < this.config.cooldownMs) {
//       return false;
//     }

//     const message = error.message || error.toString();

//     // Check ignore patterns
//     if (
//       this.config.filters.ignorePatterns?.some((pattern) =>
//         message.includes(pattern)
//       )
//     ) {
//       return false;
//     }

//     // Check only patterns (if specified, only allow these patterns)
//     if (
//       this.config.filters.onlyPatterns &&
//       this.config.filters.onlyPatterns.length > 0
//     ) {
//       const matchesOnlyPattern = this.config.filters.onlyPatterns.some(
//         (pattern) => message.includes(pattern)
//       );
//       if (!matchesOnlyPattern) {
//         return false;
//       }
//     }

//     this.lastSpoken = now;
//     return true;
//   }
// }

// export { Config };
