// Lets mutations declare meta.skipGlobalError so the global MutationCache
// onError handler can skip toasting (when the form shows inline field errors).
import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      skipGlobalError?: boolean;
    };
  }
}
