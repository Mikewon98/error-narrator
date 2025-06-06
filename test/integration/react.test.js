import { createVoiceErrorBoundary } from "../../integration/react";
import { render, screen } from "@testing-library/react";
import { BrowserVoiceEngine } from "../../src/browser";
import "@testing-library/jest-dom";

// Mock the voice engine
jest.mock("../../src/browser");

describe("React Integration", () => {
  let VoiceErrorBoundary;
  let mockVoiceEngine;

  beforeEach(() => {
    mockVoiceEngine = {
      speak: jest.fn(),
    };

    BrowserVoiceEngine.mockImplementation(() => mockVoiceEngine);
    VoiceErrorBoundary = createVoiceErrorBoundary(BrowserVoiceEngine);
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
    expect(mockVoiceEngine.speak).not.toHaveBeenCalled();
  });

  test("should catch errors and trigger voice notification in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <VoiceErrorBoundary>
        <ThrowError shouldThrow={true} message="map is not a function" />
      </VoiceErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(mockVoiceEngine.speak).toHaveBeenCalledWith(
      expect.stringContaining("Development error")
    );
    expect(mockVoiceEngine.speak).toHaveBeenCalledWith(
      expect.stringContaining("is not a function")
    );

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  test("should not trigger voice notification in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <VoiceErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VoiceErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(mockVoiceEngine.speak).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  test("should use custom fallback component", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

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
    expect(mockVoiceEngine.speak).toHaveBeenCalled();

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  test("should initialize voice engine with custom options", () => {
    const voiceOptions = {
      rate: 1.5,
      pitch: 0.8,
      enabled: true,
    };

    render(
      <VoiceErrorBoundary voiceOptions={voiceOptions}>
        <div>Test</div>
      </VoiceErrorBoundary>
    );

    expect(BrowserVoiceEngine).toHaveBeenCalledWith(voiceOptions);
  });

  test("should handle multiple errors correctly", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const MultiErrorComponent = ({ errorType }) => {
      if (errorType === "type") {
        throw new TypeError("Cannot read property of null");
      }
      if (errorType === "reference") {
        throw new ReferenceError("variable is not defined");
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <VoiceErrorBoundary>
        <MultiErrorComponent errorType="type" />
      </VoiceErrorBoundary>
    );

    expect(mockVoiceEngine.speak).toHaveBeenCalledTimes(1);
    expect(mockVoiceEngine.speak).toHaveBeenCalledWith(
      expect.stringContaining("Cannot read property")
    );

    rerender(
      <VoiceErrorBoundary key="second">
        <MultiErrorComponent errorType="reference" />
      </VoiceErrorBoundary>
    );

    expect(mockVoiceEngine.speak).toHaveBeenCalledTimes(2);
    expect(mockVoiceEngine.speak).toHaveBeenLastCalledWith(
      expect.stringContaining("variable is not defined")
    );

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
