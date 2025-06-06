import { ErrorProcessor } from "./errorProcessor";
import ErrorNarratorBrowser from "./browser";

const ErrorNarrator =
  typeof window !== "undefined"
    ? ErrorNarratorBrowser
    : require("./node").default;

export default ErrorNarrator;
