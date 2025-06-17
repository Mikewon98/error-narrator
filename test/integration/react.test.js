import React from "react";
import {
  createVoiceErrorBoundary,
  useErrorNarrator,
  ErrorNarratorProvider,
} from "../../integration/react.js";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the ErrorNarratorBrowser class
jest.mock("../../src/browser.js", () => {
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

  return {
    __esModule: true,
    default: jest.fn(() => mockErrorNarrator),
    mockInstance: mockErrorNarrator, // Export for accessing in tests
  };
});

// Import the mock after setting it up
import ErrorNarratorBrowser, { mockInstance } from "../../src/browser.js";

const ThrowError = ({ shouldThrow = false, message = "Test error" }) => {
  if (shouldThrow) {
    throw new TypeError(message);
  }
  return <div>No error</div>;
};

describe("React Integration", () => {
  let VoiceErrorBoundary;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a fresh error boundary for each test
    VoiceErrorBoundary = createVoiceErrorBoundary({
      debug: true,
      enabled: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const ThrowError = ({ shouldThrow = false, message = "Test error" }) => {
    if (shouldThrow) {
      throw new Error(message);
    }
    return <div>No error</div>;
  };

  test("should render children when no error occurs", () => {
    render(
      <VoiceErrorBoundary>
        <ThrowError shouldThrow={false} />
      </VoiceErrorBoundary>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
    expect(mockInstance.handleError).not.toHaveBeenCalled();
  });

  test("should catch errors and trigger voice notification", () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <VoiceErrorBoundary>
        <ThrowError shouldThrow={true} message="Test error message" />
      </VoiceErrorBoundary>
    );

    // Should show error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Should have called handleError
    expect(mockInstance.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Test error message",
      })
    );

    consoleSpy.mockRestore();
  });

  test("should use custom fallback component", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const CustomFallback = () => <div>Custom error message</div>;

    render(
      <VoiceErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(mockInstance.handleError).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("should initialize ErrorNarrator with custom options", () => {
    const customOptions = {
      rate: 1.5,
      pitch: 0.8,
      enabled: true,
      debug: true,
    };

    const CustomErrorBoundary = createVoiceErrorBoundary(customOptions);

    render(
      <CustomErrorBoundary>
        <div>Test content</div>
      </CustomErrorBoundary>
    );

    // ErrorNarratorBrowser should have been instantiated with merged options
    expect(ErrorNarratorBrowser).toHaveBeenCalledWith(
      expect.objectContaining({
        autoSetup: false, // Default from createVoiceErrorBoundary
        ...customOptions,
      })
    );
  });

  test("should handle function fallback", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const fallbackFunction = (error, errorInfo) => (
      <div>Function fallback: {error.message}</div>
    );

    render(
      <VoiceErrorBoundary fallback={fallbackFunction}>
        <ThrowError shouldThrow={true} message="Function test error" />
      </VoiceErrorBoundary>
    );

    expect(
      screen.getByText("Function fallback: Function test error")
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("should call custom onError handler", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const onErrorMock = jest.fn();

    render(
      <VoiceErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} message="Custom handler test" />
      </VoiceErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Custom handler test",
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });
});

describe("useErrorNarrator Hook", () => {
  test("should provide narrator functions", () => {
    let hookResult;

    function TestComponent() {
      hookResult = useErrorNarrator({ debug: true });
      return <div>Test Component</div>;
    }

    render(<TestComponent />);

    expect(hookResult).toHaveProperty("speak");
    expect(hookResult).toHaveProperty("handleError");
    expect(hookResult).toHaveProperty("test");
    expect(hookResult).toHaveProperty("updateConfig");
    expect(hookResult).toHaveProperty("getStatus");
    expect(hookResult).toHaveProperty("narrator");

    // Test that functions work
    hookResult.speak("test message");
    expect(mockInstance.speak).toHaveBeenCalledWith("test message");

    const testError = new Error("Hook test error");
    hookResult.handleError(testError);
    expect(mockInstance.handleError).toHaveBeenCalledWith(testError);
  });
});

describe("ErrorNarratorProvider", () => {
  test("should wrap children with error boundary", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <ErrorNarratorProvider options={{ debug: true }}>
        <ThrowError shouldThrow={true} message="Provider test" />
      </ErrorNarratorProvider>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(mockInstance.handleError).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("should pass through all props", () => {
    const onErrorMock = jest.fn();
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <ErrorNarratorProvider
        options={{ debug: true }}
        onError={onErrorMock}
        fallback={<div>Provider fallback</div>}
      >
        <ThrowError shouldThrow={true} message="Provider props test" />
      </ErrorNarratorProvider>
    );

    expect(screen.getByText("Provider fallback")).toBeInTheDocument();
    expect(onErrorMock).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

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
