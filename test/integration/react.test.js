import React from "react";
import {
  withErrorNarration,
  useErrorNarrator,
  ErrorNarratorProvider,
  ErrorBoundary,
} from "../../integration/react.js";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock the ErrorNarratorBrowser class
const mockErrorNarrator = {
  handleError: jest.fn(),
  speak: jest.fn(),
  test: jest.fn(),
  updateConfig: jest.fn(),
  getStatus: jest.fn(() => ({
    enabled: true,
    initialized: true,
    speaking: false,
    queueLength: 0,
    config: {},
  })),
  enable: jest.fn(),
  disable: jest.fn(),
  clearQueue: jest.fn(),
};

jest.mock("error-narrator/src/browser.js", () => ({
  __esModule: true,
  default: jest.fn(() => mockErrorNarrator),
}));

// Import the mock after setting it up
import ErrorNarratorBrowser from "error-narrator/src/browser.js";

// Test component that can throw errors
const ThrowError = ({ shouldThrow = false, message = "Test error" }) => {
  if (shouldThrow) {
    throw new TypeError(message);
  }
  return <div>No error</div>;
};

// Component that uses the hook
const HookTestComponent = () => {
  const narrator = useErrorNarrator();

  return (
    <div>
      <button onClick={() => narrator.speak("Test message")}>Speak Test</button>
      <button onClick={() => narrator.handleError(new Error("Manual error"))}>
        Trigger Error
      </button>
      <button onClick={() => narrator.test("Test TTS")}>Test TTS</button>
      <div>Hook working</div>
    </div>
  );
};

describe("ErrorNarratorProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the initialization state
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should render children when no error occurs", async () => {
    render(
      <ErrorNarratorProvider>
        <ThrowError shouldThrow={false} />
      </ErrorNarratorProvider>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();

    // Wait for async initialization
    await waitFor(() => {
      expect(ErrorNarratorBrowser).toHaveBeenCalledWith({
        autoSetup: true,
      });
    });
  });

  test("should initialize ErrorNarrator with custom options", async () => {
    const customOptions = {
      rate: 1.5,
      pitch: 0.8,
      enabled: true,
      debug: true,
    };

    render(
      <ErrorNarratorProvider options={customOptions}>
        <div>Test content</div>
      </ErrorNarratorProvider>
    );

    await waitFor(() => {
      expect(ErrorNarratorBrowser).toHaveBeenCalledWith({
        autoSetup: true,
        ...customOptions,
      });
    });
  });

  test("should call onError callback when initialization fails", async () => {
    const onErrorMock = jest.fn();
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Mock import to throw error
    jest.doMock("error-narrator/src/browser.js", () => {
      throw new Error("Failed to load module");
    });

    render(
      <ErrorNarratorProvider options={{ debug: true }} onError={onErrorMock}>
        <div>Test content</div>
      </ErrorNarratorProvider>
    );

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  test("should update config when options change", async () => {
    const initialOptions = { rate: 1.0 };
    const updatedOptions = { rate: 1.5 };

    const { rerender } = render(
      <ErrorNarratorProvider options={initialOptions}>
        <div>Test content</div>
      </ErrorNarratorProvider>
    );

    // Wait for initial setup
    await waitFor(() => {
      expect(ErrorNarratorBrowser).toHaveBeenCalledWith({
        autoSetup: true,
        ...initialOptions,
      });
    });

    // Update options
    rerender(
      <ErrorNarratorProvider options={updatedOptions}>
        <div>Test content</div>
      </ErrorNarratorProvider>
    );

    await waitFor(() => {
      expect(mockErrorNarrator.updateConfig).toHaveBeenCalledWith(
        updatedOptions
      );
    });
  });

  test("should cleanup on unmount", async () => {
    const { unmount } = render(
      <ErrorNarratorProvider>
        <div>Test content</div>
      </ErrorNarratorProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(ErrorNarratorBrowser).toHaveBeenCalled();
    });

    unmount();

    expect(mockErrorNarrator.disable).toHaveBeenCalled();
    expect(mockErrorNarrator.clearQueue).toHaveBeenCalled();
  });
});

describe("useErrorNarrator Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should provide narrator functions", async () => {
    const user = userEvent.setup();

    render(
      <ErrorNarratorProvider>
        <HookTestComponent />
      </ErrorNarratorProvider>
    );

    expect(screen.getByText("Hook working")).toBeInTheDocument();

    // Wait for initialization
    await waitFor(() => {
      expect(ErrorNarratorBrowser).toHaveBeenCalled();
    });

    // Test speak function
    await user.click(screen.getByText("Speak Test"));
    expect(mockErrorNarrator.speak).toHaveBeenCalledWith("Test message");

    // Test handleError function
    await user.click(screen.getByText("Trigger Error"));
    expect(mockErrorNarrator.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Manual error",
      })
    );

    // Test test function
    await user.click(screen.getByText("Test TTS"));
    expect(mockErrorNarrator.test).toHaveBeenCalledWith("Test TTS");
  });

  test("should throw error when used outside provider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<HookTestComponent />);
    }).toThrow("useErrorNarrator must be used within an ErrorNarratorProvider");

    consoleSpy.mockRestore();
  });

  test("should provide all narrator methods", async () => {
    let hookResult;

    function TestComponent() {
      hookResult = useErrorNarrator();
      return <div>Test Component</div>;
    }

    render(
      <ErrorNarratorProvider>
        <TestComponent />
      </ErrorNarratorProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(ErrorNarratorBrowser).toHaveBeenCalled();
    });

    expect(hookResult).toHaveProperty("narrator");
    expect(hookResult).toHaveProperty("speak");
    expect(hookResult).toHaveProperty("handleError");
    expect(hookResult).toHaveProperty("enable");
    expect(hookResult).toHaveProperty("disable");
    expect(hookResult).toHaveProperty("test");
    expect(hookResult).toHaveProperty("clearQueue");
    expect(hookResult).toHaveProperty("getStatus");
    expect(hookResult).toHaveProperty("updateConfig");
  });
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should catch errors and trigger narrator", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <ErrorNarratorProvider>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Test error message" />
        </ErrorBoundary>
      </ErrorNarratorProvider>
    );

    // Should show error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("An error occurred and has been narrated.")
    ).toBeInTheDocument();

    // Wait for initialization and error handling
    await waitFor(() => {
      expect(mockErrorNarrator.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Test error message",
        })
      );
    });

    consoleSpy.mockRestore();
  });

  test("should show error details in expandable section", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <ErrorNarratorProvider>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Detailed error test" />
        </ErrorBoundary>
      </ErrorNarratorProvider>
    );

    // Click on details
    const detailsButton = screen.getByText("Error details");
    await user.click(detailsButton);

    // Should show error details
    expect(
      screen.getByText(/TypeError: Detailed error test/)
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("should allow retry after error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const user = userEvent.setup();

    let shouldThrow = true;
    function RetryableComponent() {
      if (shouldThrow) {
        throw new Error("Retryable error");
      }
      return <div>Success after retry</div>;
    }

    render(
      <ErrorNarratorProvider>
        <ErrorBoundary>
          <RetryableComponent />
        </ErrorBoundary>
      </ErrorNarratorProvider>
    );

    // Should show error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Change the condition and click retry
    shouldThrow = false;
    const retryButton = screen.getByText("Try again");
    await user.click(retryButton);

    // Should show success message
    expect(screen.getByText("Success after retry")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("should render children when no error", () => {
    render(
      <ErrorNarratorProvider>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </ErrorNarratorProvider>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
    expect(mockErrorNarrator.handleError).not.toHaveBeenCalled();
  });
});

describe("withErrorNarration HOC", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should wrap component with ErrorNarratorProvider and ErrorBoundary", async () => {
    const TestComponent = () => <div>HOC Test Component</div>;
    const WrappedComponent = withErrorNarration(TestComponent, { debug: true });

    render(<WrappedComponent />);

    expect(screen.getByText("HOC Test Component")).toBeInTheDocument();

    await waitFor(() => {
      expect(ErrorNarratorBrowser).toHaveBeenCalledWith({
        autoSetup: true,
        debug: true,
      });
    });
  });

  test("should catch errors in wrapped component", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const ErrorComponent = () => {
      throw new Error("HOC error test");
    };

    const WrappedComponent = withErrorNarration(ErrorComponent);

    render(<WrappedComponent />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockErrorNarrator.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "HOC error test",
        })
      );
    });

    consoleSpy.mockRestore();
  });

  test("should pass props to wrapped component", () => {
    const TestComponent = ({ testProp }) => <div>Prop: {testProp}</div>;
    const WrappedComponent = withErrorNarration(TestComponent);

    render(<WrappedComponent testProp="test value" />);

    expect(screen.getByText("Prop: test value")).toBeInTheDocument();
  });
});

describe("Integration with different error types", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should handle TypeError", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <ErrorNarratorProvider>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Type error test" />
        </ErrorBoundary>
      </ErrorNarratorProvider>
    );

    await waitFor(() => {
      expect(mockErrorNarrator.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Type error test",
          name: "TypeError",
        })
      );
    });

    consoleSpy.mockRestore();
  });

  test("should handle ReferenceError", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const ReferenceErrorComponent = () => {
      throw new ReferenceError("Reference error test");
    };

    render(
      <ErrorNarratorProvider>
        <ErrorBoundary>
          <ReferenceErrorComponent />
        </ErrorBoundary>
      </ErrorNarratorProvider>
    );

    await waitFor(() => {
      expect(mockErrorNarrator.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Reference error test",
          name: "ReferenceError",
        })
      );
    });

    consoleSpy.mockRestore();
  });
});

describe("Server-side rendering compatibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should not initialize narrator on server side", () => {
    // Mock window as undefined (server-side)
    const originalWindow = global.window;
    delete global.window;

    render(
      <ErrorNarratorProvider>
        <div>SSR Test</div>
      </ErrorNarratorProvider>
    );

    expect(screen.getByText("SSR Test")).toBeInTheDocument();
    expect(ErrorNarratorBrowser).not.toHaveBeenCalled();

    // Restore window
    global.window = originalWindow;
  });
});

// --------------------------------------------------------------------------------------------------------

// import {
//   withErrorNarration,
//   useErrorNarrator,
//   ErrorNarratorProvider,
//   ErrorBoundary,
// } from "../../integration/react.js";
// import { render, screen } from "@testing-library/react";
// import "@testing-library/jest-dom";

// // Mock the ErrorNarratorBrowser class
// jest.mock("../../src/browser.js", () => {
//   const mockErrorNarrator = {
//     handleError: jest.fn(),
//     speak: jest.fn(),
//     test: jest.fn(),
//     updateConfig: jest.fn(),
//     getStatus: jest.fn(() => ({
//       enabled: true,
//       initialized: true,
//       speaking: false,
//       queueLength: 0,
//       config: {},
//     })),
//     enable: jest.fn(),
//     disable: jest.fn(),
//     clearQueue: jest.fn(),
//   };

//   return {
//     __esModule: true,
//     default: jest.fn(() => mockErrorNarrator),
//     mockInstance: mockErrorNarrator, // Export for accessing in tests
//   };
// });

// // Import the mock after setting it up
// import ErrorNarratorBrowser, { mockInstance } from "../../src/browser.js";

// const ThrowError = ({ shouldThrow = false, message = "Test error" }) => {
//   if (shouldThrow) {
//     throw new TypeError(message);
//   }
//   return <div>No error</div>;
// };

// describe("React Integration", () => {
//   let VoiceErrorBoundary;

//   beforeEach(() => {
//     // Reset all mocks
//     jest.clearAllMocks();

//     const options = {
//       debug: true,
//       enabled: true,
//     };

//     // Create a fresh error boundary for each test
//     VoiceErrorBoundary = ErrorNarratorProvider(options, (onError = null));
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   const ThrowError = ({ shouldThrow = false, message = "Test error" }) => {
//     if (shouldThrow) {
//       throw new Error(message);
//     }
//     return <div>No error</div>;
//   };

//   test("should render children when no error occurs", () => {
//     render(
//       <VoiceErrorBoundary>
//         <ThrowError shouldThrow={false} />
//       </VoiceErrorBoundary>
//     );

//     expect(screen.getByText("No error")).toBeInTheDocument();
//     expect(mockInstance.handleError).not.toHaveBeenCalled();
//   });

//   test("should catch errors and trigger voice notification", () => {
//     // Suppress console.error for this test
//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     render(
//       <VoiceErrorBoundary>
//         <ThrowError shouldThrow={true} message="Test error message" />
//       </VoiceErrorBoundary>
//     );

//     // Should show error UI
//     expect(screen.getByText("Something went wrong")).toBeInTheDocument();

//     // Should have called handleError
//     expect(mockInstance.handleError).toHaveBeenCalledWith(
//       expect.objectContaining({
//         message: "Test error message",
//       })
//     );

//     consoleSpy.mockRestore();
//   });

//   test("should use custom fallback component", () => {
//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     const CustomFallback = () => <div>Custom error message</div>;

//     render(
//       <VoiceErrorBoundary fallback={<CustomFallback />}>
//         <ThrowError shouldThrow={true} />
//       </VoiceErrorBoundary>
//     );

//     expect(screen.getByText("Custom error message")).toBeInTheDocument();
//     expect(mockInstance.handleError).toHaveBeenCalled();

//     consoleSpy.mockRestore();
//   });

//   test("should initialize ErrorNarrator with custom options", () => {
//     const customOptions = {
//       rate: 1.5,
//       pitch: 0.8,
//       enabled: true,
//       debug: true,
//     };

//     const CustomErrorBoundary = createVoiceErrorBoundary(customOptions);

//     render(
//       <CustomErrorBoundary>
//         <div>Test content</div>
//       </CustomErrorBoundary>
//     );

//     // ErrorNarratorBrowser should have been instantiated with merged options
//     expect(ErrorNarratorBrowser).toHaveBeenCalledWith(
//       expect.objectContaining({
//         autoSetup: false, // Default from createVoiceErrorBoundary
//         ...customOptions,
//       })
//     );
//   });

//   test("should handle function fallback", () => {
//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     const fallbackFunction = (error, errorInfo) => (
//       <div>Function fallback: {error.message}</div>
//     );

//     render(
//       <VoiceErrorBoundary fallback={fallbackFunction}>
//         <ThrowError shouldThrow={true} message="Function test error" />
//       </VoiceErrorBoundary>
//     );

//     expect(
//       screen.getByText("Function fallback: Function test error")
//     ).toBeInTheDocument();

//     consoleSpy.mockRestore();
//   });

//   test("should call custom onError handler", () => {
//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     const onErrorMock = jest.fn();

//     render(
//       <VoiceErrorBoundary onError={onErrorMock}>
//         <ThrowError shouldThrow={true} message="Custom handler test" />
//       </VoiceErrorBoundary>
//     );

//     expect(onErrorMock).toHaveBeenCalledWith(
//       expect.objectContaining({
//         message: "Custom handler test",
//       }),
//       expect.objectContaining({
//         componentStack: expect.any(String),
//       })
//     );

//     consoleSpy.mockRestore();
//   });
// });

// describe("useErrorNarrator Hook", () => {
//   test("should provide narrator functions", () => {
//     let hookResult;

//     function TestComponent() {
//       hookResult = useErrorNarrator({ debug: true });
//       return <div>Test Component</div>;
//     }

//     render(<TestComponent />);

//     expect(hookResult).toHaveProperty("speak");
//     expect(hookResult).toHaveProperty("handleError");
//     expect(hookResult).toHaveProperty("test");
//     expect(hookResult).toHaveProperty("updateConfig");
//     expect(hookResult).toHaveProperty("getStatus");
//     expect(hookResult).toHaveProperty("narrator");

//     // Test that functions work
//     hookResult.speak("test message");
//     expect(mockInstance.speak).toHaveBeenCalledWith("test message");

//     const testError = new Error("Hook test error");
//     hookResult.handleError(testError);
//     expect(mockInstance.handleError).toHaveBeenCalledWith(testError);
//   });
// });

// describe("ErrorNarratorProvider", () => {
//   test("should wrap children with error boundary", () => {
//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     render(
//       <ErrorNarratorProvider options={{ debug: true }}>
//         <ThrowError shouldThrow={true} message="Provider test" />
//       </ErrorNarratorProvider>
//     );

//     expect(screen.getByText("Something went wrong")).toBeInTheDocument();
//     expect(mockInstance.handleError).toHaveBeenCalled();

//     consoleSpy.mockRestore();
//   });

//   test("should pass through all props", () => {
//     const onErrorMock = jest.fn();
//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     render(
//       <ErrorNarratorProvider
//         options={{ debug: true }}
//         onError={onErrorMock}
//         fallback={<div>Provider fallback</div>}
//       >
//         <ThrowError shouldThrow={true} message="Provider props test" />
//       </ErrorNarratorProvider>
//     );

//     expect(screen.getByText("Provider fallback")).toBeInTheDocument();
//     expect(onErrorMock).toHaveBeenCalled();

//     consoleSpy.mockRestore();
//   });
// });

// -------------------------------------------------------------------------------------------------------------

// import { createVoiceErrorBoundary } from "../../integration/react";
// import { render, screen } from "@testing-library/react";
// import { BrowserVoiceEngine } from "../../src/browser";
// import "@testing-library/jest-dom";

// // Mock the voice engine
// jest.mock("../../src/browser");

// describe("React Integration", () => {
//   let VoiceErrorBoundary;
//   let mockVoiceEngine;

//   beforeEach(() => {
//     mockVoiceEngine = {
//       speak: jest.fn(),
//     };

//     BrowserVoiceEngine.mockImplementation(() => mockVoiceEngine);
//     VoiceErrorBoundary = createVoiceErrorBoundary(BrowserVoiceEngine);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   const ThrowError = ({ shouldThrow = false, message = "Test error" }) => {
//     if (shouldThrow) {
//       throw new Error(message);
//     }
//     return <div>No error</div>;
//   };

//   test("should render children when no error occurs", () => {
//     render(
//       <VoiceErrorBoundary>
//         <ThrowError shouldThrow={false} />
//       </VoiceErrorBoundary>
//     );

//     expect(screen.getByText("No error")).toBeInTheDocument();
//     expect(mockVoiceEngine.speak).not.toHaveBeenCalled();
//   });

//   test("should catch errors and trigger voice notification in development", () => {
//     const originalEnv = process.env.NODE_ENV;
//     process.env.NODE_ENV = "development";

//     // Suppress console.error for this test
//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     render(
//       <VoiceErrorBoundary>
//         <ThrowError shouldThrow={true} message="map is not a function" />
//       </VoiceErrorBoundary>
//     );

//     expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
//     expect(mockVoiceEngine.speak).toHaveBeenCalledWith(
//       expect.stringContaining("Development error")
//     );
//     expect(mockVoiceEngine.speak).toHaveBeenCalledWith(
//       expect.stringContaining("is not a function")
//     );

//     consoleSpy.mockRestore();
//     process.env.NODE_ENV = originalEnv;
//   });

//   test("should not trigger voice notification in production", () => {
//     const originalEnv = process.env.NODE_ENV;
//     process.env.NODE_ENV = "production";

//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     render(
//       <VoiceErrorBoundary>
//         <ThrowError shouldThrow={true} />
//       </VoiceErrorBoundary>
//     );

//     expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
//     expect(mockVoiceEngine.speak).not.toHaveBeenCalled();

//     consoleSpy.mockRestore();
//     process.env.NODE_ENV = originalEnv;
//   });

//   test("should use custom fallback component", () => {
//     const originalEnv = process.env.NODE_ENV;
//     process.env.NODE_ENV = "development";

//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     const CustomFallback = () => <div>Custom error message</div>;

//     render(
//       <VoiceErrorBoundary fallback={<CustomFallback />}>
//         <ThrowError shouldThrow={true} />
//       </VoiceErrorBoundary>
//     );

//     expect(screen.getByText("Custom error message")).toBeInTheDocument();
//     expect(mockVoiceEngine.speak).toHaveBeenCalled();

//     consoleSpy.mockRestore();
//     process.env.NODE_ENV = originalEnv;
//   });

//   test("should initialize voice engine with custom options", () => {
//     const voiceOptions = {
//       rate: 1.5,
//       pitch: 0.8,
//       enabled: true,
//     };

//     render(
//       <VoiceErrorBoundary voiceOptions={voiceOptions}>
//         <div>Test</div>
//       </VoiceErrorBoundary>
//     );

//     expect(BrowserVoiceEngine).toHaveBeenCalledWith(voiceOptions);
//   });

//   test("should handle multiple errors correctly", () => {
//     const originalEnv = process.env.NODE_ENV;
//     process.env.NODE_ENV = "development";

//     const consoleSpy = jest
//       .spyOn(console, "error")
//       .mockImplementation(() => {});

//     const MultiErrorComponent = ({ errorType }) => {
//       if (errorType === "type") {
//         throw new TypeError("Cannot read property of null");
//       }
//       if (errorType === "reference") {
//         throw new ReferenceError("variable is not defined");
//       }
//       return <div>No error</div>;
//     };

//     const { rerender } = render(
//       <VoiceErrorBoundary>
//         <MultiErrorComponent errorType="type" />
//       </VoiceErrorBoundary>
//     );

//     expect(mockVoiceEngine.speak).toHaveBeenCalledTimes(1);
//     expect(mockVoiceEngine.speak).toHaveBeenCalledWith(
//       expect.stringContaining("Cannot read property")
//     );

//     rerender(
//       <VoiceErrorBoundary key="second">
//         <MultiErrorComponent errorType="reference" />
//       </VoiceErrorBoundary>
//     );

//     expect(mockVoiceEngine.speak).toHaveBeenCalledTimes(2);
//     expect(mockVoiceEngine.speak).toHaveBeenLastCalledWith(
//       expect.stringContaining("variable is not defined")
//     );

//     consoleSpy.mockRestore();
//     process.env.NODE_ENV = originalEnv;
//   });
// });
