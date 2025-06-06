class ErrorProcessor {
  static humanizeError(error) {
    const message = error.message || error.toString();

    // Common error patterns
    const patterns = {
      "is not a function": (match) =>
        `${match[0]} is not a function. Check if it's properly defined.`,
      "Cannot read property": (match) =>
        `Cannot read property. The object might be null or undefined.`,
      "Unexpected token": (match) =>
        `Syntax error detected. Check your code for missing brackets or commas.`,
      ReferenceError: () => `Reference error. A variable is not defined.`,
      TypeError: () => `Type error detected.`,
    };

    for (const [pattern, handler] of Object.entries(patterns)) {
      if (message.includes(pattern)) {
        const match = message.match(new RegExp(pattern, "i"));
        return handler(match);
      }
    }

    // Fallback: clean up the raw message
    return message.replace(/[^\w\s]/gi, " ").substring(0, 100);
  }
}

export { ErrorProcessor };
